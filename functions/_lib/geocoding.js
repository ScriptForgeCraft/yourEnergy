import { configuredUrl, envString, optionalSecretHeader, providerTimeoutMs } from './config.js';
import { ApiError } from './http.js';
import { fetchJsonWithTimeout } from './provider.js';

const MAX_RESULTS = 5;
const SUPPORTED_LOCALES = new Set(['hy', 'ru', 'en']);

const normalizeText = (value) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

const finiteNumber = (...values) => {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      typeof value === 'boolean' ||
      (typeof value === 'string' && !value.trim())
    ) {
      continue;
    }
    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }
  return null;
};

const normalizedLocale = (value) => {
  const key = normalizeText(value).toLowerCase().split('-')[0];
  return SUPPORTED_LOCALES.has(key) ? key : null;
};

export const validateGeocodeInput = (body) => {
  const query = normalizeText(body?.query ?? body?.address);
  if (query.length < 3 || query.length > 160) {
    throw new ApiError('INVALID_INPUT');
  }

  const locale = body?.locale === undefined ? null : normalizedLocale(body.locale);
  if (body?.locale !== undefined && !locale) {
    throw new ApiError('INVALID_INPUT');
  }

  return { query, locale };
};

const templateTokenPresent = (serializedUrl, token) =>
  serializedUrl.includes(`{${token}}`) || serializedUrl.includes(`%7B${token}%7D`);

const replaceTemplateToken = (url, token, value) =>
  url
    .toString()
    .replaceAll(`{${token}}`, encodeURIComponent(value))
    .replaceAll(`%7B${token}%7D`, encodeURIComponent(value));

export const buildGeocodingUrl = (endpoint, input, env) => {
  const serializedEndpoint = endpoint.toString();
  const usesQueryTemplate = templateTokenPresent(serializedEndpoint, 'query');
  const usesLocaleTemplate = templateTokenPresent(serializedEndpoint, 'locale');
  let url = endpoint;

  if (usesQueryTemplate) {
    url = new URL(replaceTemplateToken(url, 'query', input.query));
  }
  if (usesLocaleTemplate) {
    if (!input.locale) {
      throw new ApiError('INVALID_INPUT');
    }
    url = new URL(replaceTemplateToken(url, 'locale', input.locale));
  }

  if (!usesQueryTemplate) {
    url.searchParams.set(envString(env, 'GEOCODING_QUERY_PARAM') ?? 'q', input.query);
  }
  if (input.locale && !usesLocaleTemplate) {
    url.searchParams.set(envString(env, 'GEOCODING_LOCALE_PARAM') ?? 'language', input.locale);
  }
  url.searchParams.set(envString(env, 'GEOCODING_LIMIT_PARAM') ?? 'limit', String(MAX_RESULTS));
  return url;
};

const candidateItems = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.features)) {
    return payload.features;
  }
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  throw new ApiError('GEOCODER_RESPONSE_INVALID');
};

export const normalizeGeocodingCandidate = (candidate) => {
  const coordinates = candidate?.geometry?.coordinates;
  const latitude = finiteNumber(
    candidate?.latitude,
    candidate?.lat,
    candidate?.center?.[1],
    coordinates?.[1]
  );
  const longitude = finiteNumber(
    candidate?.longitude,
    candidate?.lon,
    candidate?.lng,
    candidate?.center?.[0],
    coordinates?.[0]
  );
  const label = normalizeText(
    candidate?.label ??
      candidate?.display_name ??
      candidate?.place_name ??
      candidate?.formatted ??
      candidate?.properties?.label ??
      candidate?.name
  );

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    !label
  ) {
    return null;
  }

  const rawConfidence = finiteNumber(candidate?.confidence, candidate?.score, candidate?.relevance);
  const confidence =
    rawConfidence !== null && rawConfidence >= 0 && rawConfidence <= 1 ? rawConfidence : null;

  return {
    label: label.slice(0, 220),
    coordinates: { latitude, longitude },
    confidence
  };
};

export const createGeocodingAdapter = (env, { fetchImpl = fetch } = {}) => {
  const endpoint = configuredUrl(env, 'GEOCODING_ENDPOINT', 'GEOCODER_NOT_CONFIGURED');
  const credential = optionalSecretHeader(env, 'GEOCODING');
  const provider = envString(env, 'GEOCODING_PROVIDER') ?? 'configured-geocoder';
  const timeoutMs = providerTimeoutMs(env);

  return {
    async search(input, { signal } = {}) {
      const url = buildGeocodingUrl(endpoint, input, env);
      const headers = new Headers({ accept: 'application/json' });
      if (credential) {
        headers.set(credential.name, credential.value);
      }

      const payload = await fetchJsonWithTimeout(
        fetchImpl,
        url,
        { method: 'GET', headers },
        {
          signal,
          timeoutMs,
          timeoutCode: 'GEOCODER_TIMEOUT',
          unavailableCode: 'GEOCODER_UNAVAILABLE',
          invalidResponseCode: 'GEOCODER_RESPONSE_INVALID'
        }
      );

      const seenCoordinates = new Set();
      const candidates = candidateItems(payload)
        .map(normalizeGeocodingCandidate)
        .filter(Boolean)
        .filter((candidate) => {
          const key = `${candidate.coordinates.latitude},${candidate.coordinates.longitude}`;
          if (seenCoordinates.has(key)) {
            return false;
          }
          seenCoordinates.add(key);
          return true;
        })
        .slice(0, MAX_RESULTS);

      return {
        candidates,
        selectionRequired: true,
        source: {
          provider,
          fetchedAt: new Date().toISOString()
        }
      };
    }
  };
};
