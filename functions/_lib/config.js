import { ApiError } from './http.js';

const HEADER_NAME = /^[A-Za-z0-9-]+$/;
const DEFAULT_PROVIDER_TIMEOUT_MS = 12_000;
const MIN_PROVIDER_TIMEOUT_MS = 5_000;
const MAX_PROVIDER_TIMEOUT_MS = 20_000;

export const envString = (env, key) => {
  const value = env?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

export const envBoolean = (env, key, fallback = false) => {
  const value = envString(env, key);
  if (value === null) {
    return fallback;
  }
  return value.toLowerCase() === 'true';
};

export const providerTimeoutMs = (env) => {
  const configuredValue = envString(env, 'API_FETCH_TIMEOUT_MS');
  if (configuredValue === null) {
    return DEFAULT_PROVIDER_TIMEOUT_MS;
  }
  const configured = Number(configuredValue);
  if (!Number.isFinite(configured)) return DEFAULT_PROVIDER_TIMEOUT_MS;
  // PVGIS regularly needs more than one second even for a single 1 kWp query.
  // Clamping an accidentally low staging value keeps a real provider response
  // possible while retaining a bounded request lifetime.
  return Math.max(MIN_PROVIDER_TIMEOUT_MS, Math.min(configured, MAX_PROVIDER_TIMEOUT_MS));
};

export const configuredUrl = (env, key, missingCode) => {
  const value = envString(env, key);
  if (!value) {
    throw new ApiError(missingCode);
  }

  try {
    const url = new URL(value);
    const allowsInsecureUrl = envBoolean(env, 'ALLOW_INSECURE_PROVIDER_URLS');
    const secureProtocol = url.protocol === 'https:';
    const localDevelopmentProtocol =
      allowsInsecureUrl &&
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);

    if ((!secureProtocol && !localDevelopmentProtocol) || url.username || url.password) {
      throw new Error('Unsafe provider URL');
    }
    return url;
  } catch {
    throw new ApiError(missingCode);
  }
};

export const optionalSecretHeader = (env, prefix) => {
  const secret = envString(env, `${prefix}_API_KEY`);
  if (!secret) {
    return null;
  }

  const name = envString(env, `${prefix}_API_KEY_HEADER`) ?? 'authorization';
  if (!HEADER_NAME.test(name)) {
    throw new ApiError('INTERNAL');
  }

  const valuePrefix = envString(env, `${prefix}_API_KEY_PREFIX`) ?? '';
  return { name, value: `${valuePrefix}${secret}` };
};
