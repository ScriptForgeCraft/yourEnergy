import { configuredUrl, envString, providerTimeoutMs } from './config.js';
import { ApiError } from './http.js';
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

export const buildPvgisUrl = (endpoint, input) => {
  const url = new URL(endpoint);
  url.searchParams.set('lat', String(input.property.latitude));
  url.searchParams.set('lon', String(input.property.longitude));
  url.searchParams.set('peakpower', String(input.system.capacityKwp));
  url.searchParams.set('loss', String(input.system.lossPercent));
  url.searchParams.set('angle', String(input.roof.tiltDegrees));
  url.searchParams.set('aspect', String(input.roof.pvgisAspectDegrees));
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

export const createPvgisAdapter = (env, { fetchImpl = fetch } = {}) => {
  const endpoint = envString(env, 'PVGIS_ENDPOINT')
    ? configuredUrl(env, 'PVGIS_ENDPOINT', 'PVGIS_NOT_CONFIGURED')
    : new URL(DEFAULT_PVGIS_ENDPOINT);
  const timeoutMs = providerTimeoutMs(env);

  return {
    async analyze(input, { signal } = {}) {
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

      return {
        source: 'provider',
        provider: 'pvgis',
        inputs: input,
        generation,
        confidence: {
          status: 'provider-data',
          provider: 'pvgis'
        },
        sourceLedger: [
          {
            kind: 'solar-yield',
            provider: 'PVGIS',
            retrievedAt: new Date().toISOString()
          }
        ]
      };
    }
  };
};
