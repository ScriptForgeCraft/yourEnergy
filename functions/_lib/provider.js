import { ApiError, isApiError } from './http.js';

/**
 * Fetch without leaking upstream errors or URLs to clients. `signal` is the
 * original browser request signal; a separate controller enforces the timeout.
 */
export const fetchWithTimeout = async (
  fetchImpl,
  url,
  init,
  {
    signal,
    timeoutMs = 8_000,
    timeoutCode = 'PROVIDER_TIMEOUT',
    unavailableCode = 'PROVIDER_UNAVAILABLE'
  } = {}
) => {
  if (signal?.aborted) {
    throw new ApiError('REQUEST_ABORTED');
  }

  const controller = new AbortController();
  let timedOut = false;
  const onRequestAbort = () => controller.abort();
  signal?.addEventListener('abort', onRequestAbort, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    if (signal?.aborted) {
      throw new ApiError('REQUEST_ABORTED');
    }
    if (timedOut) {
      throw new ApiError(timeoutCode);
    }
    throw new ApiError(unavailableCode);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onRequestAbort);
  }
};

export const fetchJsonWithTimeout = async (fetchImpl, url, init, options) => {
  const response = await fetchWithTimeout(fetchImpl, url, init, options);
  if (!response.ok) {
    throw new ApiError(options?.unavailableCode ?? 'PROVIDER_UNAVAILABLE');
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError(options?.invalidResponseCode ?? 'PROVIDER_RESPONSE_INVALID');
  }
};
