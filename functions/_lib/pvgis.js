import { configuredUrl, envString, providerTimeoutMs } from './config.js';
import { ApiError, isApiError } from './http.js';
import { createPvgisCache } from './pvgis-cache.js';
import { fetchJsonWithTimeout } from './provider.js';

const numberInRange = (value, minimum, maximum) => {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'boolean' ||
    (typeof value === 'string' && !value.trim())
  ) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
};

const compassToPvgisAspect = (azimuthDegrees) => {
  const aspect = ((azimuthDegrees - 180 + 540) % 360) - 180;
  return Object.is(aspect, -0) ? 0 : aspect;
};

const pvgisAspectToCompass = (aspectDegrees) => {
  const compass = (((Number(aspectDegrees) + 180) % 360) + 360) % 360;
  return Object.is(compass, -0) ? 0 : compass;
};

// PVGIS has a public no-key API. Keeping the request server-side prevents the
// browser from gaining a direct provider dependency and leaves a single point
// for future endpoint/version changes.
export const DEFAULT_PVGIS_ENDPOINT = 'https://re.jrc.ec.europa.eu/api/v5_3/PVcalc';

/**
 * The client sends compass azimuth (0 north, 90 east, 180 south, 270 west).
 * PVGIS receives aspect relative to south (-90 east, 0 south, 90 west).
 */
export const validateAnalysisInput = (body) => {
  const latitude = numberInRange(body?.property?.latitude, -90, 90);
  const longitude = numberInRange(body?.property?.longitude, -180, 180);
  const capacityKwp = numberInRange(body?.system?.capacityKwp, 0.1, 100);
  const lossPercent = numberInRange(body?.system?.lossPercent, 0, 100);
  const tiltDegrees = numberInRange(body?.roof?.tiltDegrees, 0, 90);
  const azimuthDegrees = numberInRange(body?.roof?.azimuthDegrees, 0, 359.9999);

  if (
    latitude === null ||
    longitude === null ||
    capacityKwp === null ||
    lossPercent === null ||
    tiltDegrees === null ||
    azimuthDegrees === null
  ) {
    throw new ApiError('INVALID_INPUT');
  }

  return {
    property: { latitude, longitude },
    system: { capacityKwp, lossPercent },
    roof: {
      tiltDegrees,
      azimuthDegrees,
      pvgisAspectDegrees: compassToPvgisAspect(azimuthDegrees)
    }
  };
};

/**
 * The quick potential step deliberately needs only a confirmed geographic
 * point. It returns PVGIS's fixed free-standing optimum, not a claim about
 * the physical roof or shading at that address.
 */
export const validatePotentialInput = (body) => {
  const latitude = numberInRange(body?.property?.latitude, -90, 90);
  const longitude = numberInRange(body?.property?.longitude, -180, 180);

  if (body?.property?.confirmed !== true || latitude === null || longitude === null) {
    throw new ApiError('INVALID_INPUT');
  }

  return {
    property: { latitude, longitude },
    system: { capacityKwp: 1, lossPercent: 14 }
  };
};

export const buildPvgisUrl = (endpoint, input, { optimalAngles = false } = {}) => {
  const url = new URL(endpoint);
  url.searchParams.set('lat', String(input.property.latitude));
  url.searchParams.set('lon', String(input.property.longitude));
  url.searchParams.set('peakpower', String(input.system.capacityKwp));
  url.searchParams.set('loss', String(input.system.lossPercent));
  if (optimalAngles) {
    // PVGIS ignores angle/aspect when this is true. Omitting them makes it
    // explicit that this is only a free-standing optimum benchmark.
    url.searchParams.set('optimalangles', '1');
  } else {
    url.searchParams.set('angle', String(input.roof.tiltDegrees));
    url.searchParams.set('aspect', String(input.roof.pvgisAspectDegrees));
  }
  url.searchParams.set('outputformat', 'json');
  return url;
};

export const normalizePvgisResult = (payload) => {
  const annualKwh = Number(payload?.outputs?.totals?.fixed?.E_y);
  const monthly = payload?.outputs?.monthly?.fixed;
  const monthlyKwh = Array.isArray(monthly) ? monthly.map((month) => Number(month?.E_m)) : [];

  if (
    !Number.isFinite(annualKwh) ||
    annualKwh <= 0 ||
    monthlyKwh.length !== 12 ||
    monthlyKwh.some((value) => !Number.isFinite(value) || value < 0)
  ) {
    throw new ApiError('PVGIS_RESPONSE_INVALID');
  }

  return { annualKwh, monthlyKwh };
};

/**
 * PVGIS returns the selected optimum in its input echo using its own azimuth
 * convention (0 south, 90 west, -90 east). The browser uses compass degrees
 * instead (0 north, 180 south), so the conversion is kept server-side.
 */
export const normalizePvgisOptimalResult = (payload) => {
  const generation = normalizePvgisResult(payload);
  const tiltDegrees = numberInRange(payload?.inputs?.mounting_system?.fixed?.slope?.value, 0, 90);
  const pvgisAspectDegrees = numberInRange(
    payload?.inputs?.mounting_system?.fixed?.azimuth?.value,
    -180,
    180
  );

  if (tiltDegrees === null || pvgisAspectDegrees === null) {
    throw new ApiError('PVGIS_RESPONSE_INVALID');
  }

  return {
    generation,
    tiltDegrees,
    azimuthDegrees: pvgisAspectToCompass(pvgisAspectDegrees)
  };
};

const providerLedger = (kind, retrievedAt, cache) => [
  {
    kind,
    provider: 'PVGIS',
    retrievedAt,
    cache
  }
];

const responseFromCachedAnalysis = ({ input, generation, cache }) => ({
  source: 'provider',
  provider: 'pvgis',
  inputs: input,
  generation,
  cache,
  providerRetrievedAt: cache.providerRetrievedAt,
  sourceLedger: providerLedger('solar-yield', cache.providerRetrievedAt, cache)
});

const responseFromCachedPotential = ({ input, optimum, cache }) => ({
  source: 'provider',
  provider: 'pvgis',
  input,
  optimum,
  cache,
  providerRetrievedAt: cache.providerRetrievedAt,
  sourceLedger: providerLedger('solar-potential-optimum', cache.providerRetrievedAt, cache)
});

export const createPvgisAdapter = (
  env,
  { fetchImpl = fetch, cache = createPvgisCache(env) } = {}
) => {
  const endpoint = envString(env, 'PVGIS_ENDPOINT')
    ? configuredUrl(env, 'PVGIS_ENDPOINT', 'PVGIS_NOT_CONFIGURED')
    : new URL(DEFAULT_PVGIS_ENDPOINT);
  const timeoutMs = providerTimeoutMs(env);

  return {
    async analyze(input, { signal } = {}) {
      const cached = await cache.read({ mode: 'manual-roof-plane', input });
      if (cached.hit) {
        return responseFromCachedAnalysis({
          input,
          generation: cached.value.generation,
          cache: cached.cache
        });
      }
      const payload = await fetchJsonWithTimeout(
        fetchImpl,
        buildPvgisUrl(endpoint, input),
        { method: 'GET', headers: { accept: 'application/json' } },
        {
          signal,
          timeoutMs,
          timeoutCode: 'PVGIS_TIMEOUT',
          unavailableCode: 'PVGIS_UNAVAILABLE',
          invalidResponseCode: 'PVGIS_RESPONSE_INVALID'
        }
      );
      const generation = normalizePvgisResult(payload);
      const cacheMetadata = await cache.write({
        mode: 'manual-roof-plane',
        input,
        value: { generation }
      });

      return responseFromCachedAnalysis({ input, generation, cache: cacheMetadata });
    },
    async potential(input, { signal } = {}) {
      try {
        const cached = await cache.read({ mode: 'site-benchmark', input });
        if (cached.hit) {
          return responseFromCachedPotential({
            input,
            optimum: cached.value.optimum,
            cache: cached.cache
          });
        }
        const payload = await fetchJsonWithTimeout(
          fetchImpl,
          buildPvgisUrl(endpoint, input, { optimalAngles: true }),
          { method: 'GET', headers: { accept: 'application/json' } },
          {
            signal,
            timeoutMs,
            timeoutCode: 'PVGIS_TIMEOUT',
            unavailableCode: 'PVGIS_UNAVAILABLE',
            invalidResponseCode: 'PVGIS_RESPONSE_INVALID'
          }
        );
        const optimum = normalizePvgisOptimalResult(payload);
        const cacheMetadata = await cache.write({
          mode: 'site-benchmark',
          input,
          value: { optimum }
        });

        return responseFromCachedPotential({ input, optimum, cache: cacheMetadata });
      } catch (error) {
        // The potential endpoint itself should surface provider failures. This
        // branch merely preserves the documented cancellation code.
        if (isApiError(error)) throw error;
        throw new ApiError('PVGIS_UNAVAILABLE');
      }
    }
  };
};
