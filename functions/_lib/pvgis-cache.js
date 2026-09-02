import { envString } from './config.js';
import { ApiError } from './http.js';

export const PVGIS_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;
const CACHE_SCHEMA_VERSION = '1';

const finite = (value) => Number.isFinite(Number(value));
const canonicalNumber = (value, decimals = 5) => Number(value).toFixed(decimals);
const isoDate = (value) => new Date(value).toISOString();

const stableCacheInput = ({ mode, input }) => {
  const property = input?.property ?? {};
  const system = input?.system ?? {};
  const roof = input?.roof ?? {};
  const pieces = [
    `v=${CACHE_SCHEMA_VERSION}`,
    `mode=${mode}`,
    `lat=${canonicalNumber(property.latitude)}`,
    `lng=${canonicalNumber(property.longitude)}`,
    `kwp=${canonicalNumber(system.capacityKwp, 3)}`,
    `loss=${canonicalNumber(system.lossPercent, 2)}`
  ];
  if (mode === 'manual-roof-plane') {
    pieces.push(`tilt=${canonicalNumber(roof.tiltDegrees, 2)}`);
    pieces.push(`aspect=${canonicalNumber(roof.pvgisAspectDegrees, 2)}`);
  }
  return pieces.join('|');
};

const validInput = (input) =>
  finite(input?.property?.latitude) &&
  finite(input?.property?.longitude) &&
  finite(input?.system?.capacityKwp) &&
  finite(input?.system?.lossPercent);

const textEncoder = new TextEncoder();

const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

const sha256 = async (value, cryptoImpl = globalThis.crypto) => {
  if (!cryptoImpl?.subtle?.digest) throw new ApiError('PVGIS_CACHE_UNAVAILABLE');
  return toHex(await cryptoImpl.subtle.digest('SHA-256', textEncoder.encode(value)));
};

const normalizeStoredRecord = (record, now) => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  const expiresAt = new Date(record.expiresAt).getTime();
  const providerRetrievedAt = new Date(record.providerRetrievedAt).getTime();
  if (
    record.schemaVersion !== CACHE_SCHEMA_VERSION ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= now.getTime() ||
    !Number.isFinite(providerRetrievedAt) ||
    !record.value ||
    typeof record.value !== 'object'
  ) {
    return null;
  }
  return record;
};

const parseRecord = (raw, now) => {
  if (!raw) return null;
  if (typeof raw === 'object') return normalizeStoredRecord(raw, now);
  try {
    return normalizeStoredRecord(JSON.parse(raw), now);
  } catch {
    return null;
  }
};

/**
 * A privacy-preserving cache for normalized PVGIS data. It never stores a
 * street address, full request body, roof polygon, consumption, tariff, or a
 * browser-identifying value. Coordinates exist only inside a salted hash key.
 */
export const createPvgisCache = (
  env,
  { now = () => new Date(), cryptoImpl = globalThis.crypto } = {}
) => {
  const namespace = env?.PVGIS_CACHE;
  const salt = envString(env, 'PVGIS_CACHE_SALT');
  if (
    !namespace ||
    typeof namespace.get !== 'function' ||
    typeof namespace.put !== 'function' ||
    !salt
  ) {
    throw new ApiError('PVGIS_CACHE_NOT_CONFIGURED');
  }

  const keyFor = async ({ mode, input }) => {
    if (!validInput(input)) throw new ApiError('INVALID_INPUT');
    const hash = await sha256(`${salt}|${stableCacheInput({ mode, input })}`, cryptoImpl);
    return `pvgis:${CACHE_SCHEMA_VERSION}:${mode}:${hash}`;
  };

  return {
    async read({ mode, input }) {
      const cacheKey = await keyFor({ mode, input });
      let raw;
      try {
        raw = await namespace.get(cacheKey);
      } catch {
        throw new ApiError('PVGIS_CACHE_UNAVAILABLE');
      }
      const record = parseRecord(raw, now());
      if (!record) return { hit: false, cacheKey: null, value: null, cache: { state: 'miss' } };
      return {
        hit: true,
        cacheKey: null,
        value: record.value,
        cache: {
          state: 'hit',
          providerRetrievedAt: record.providerRetrievedAt,
          expiresAt: record.expiresAt
        }
      };
    },
    async write({ mode, input, value, providerRetrievedAt = isoDate(now()) }) {
      const cacheKey = await keyFor({ mode, input });
      const retrievedAt = isoDate(providerRetrievedAt);
      const expiresAt = isoDate(new Date(now().getTime() + PVGIS_CACHE_TTL_SECONDS * 1000));
      const record = {
        schemaVersion: CACHE_SCHEMA_VERSION,
        providerRetrievedAt: retrievedAt,
        expiresAt,
        value
      };
      try {
        await namespace.put(cacheKey, JSON.stringify(record), {
          expirationTtl: PVGIS_CACHE_TTL_SECONDS
        });
      } catch {
        throw new ApiError('PVGIS_CACHE_UNAVAILABLE');
      }
      return {
        state: 'miss',
        providerRetrievedAt: retrievedAt,
        expiresAt
      };
    }
  };
};

export const __private__ = Object.freeze({ stableCacheInput, parseRecord, normalizeStoredRecord });
