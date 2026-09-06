const defaultEndpoints = Object.freeze({
  geocode: '/api/geocode',
  potential: '/api/potential',
  analysis: '/api/analysis',
  quickAnalysis: '/api/quick-analysis',
  lead: '/api/lead'
});

export class ProductApiError extends Error {
  constructor(code, { message = code, retryable = false, status = 0 } = {}) {
    super(message);
    this.name = 'ProductApiError';
    this.code = code;
    this.retryable = retryable;
    this.status = status;
  }
}

const readJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const normalizeError = (response, payload) => {
  const error = payload?.error ?? {};
  return new ProductApiError(error.code ?? 'UNAVAILABLE', {
    message: error.message ?? 'Service unavailable',
    retryable: Boolean(error.retryable),
    status: response.status
  });
};

/**
 * Browser client for same-origin Cloudflare Functions. It transmits data only
 * after a user submits the relevant form; it never falls back to demo values.
 */
export class ProductApiClient {
  constructor({ endpoints = defaultEndpoints, fetchImpl = globalThis.fetch } = {}) {
    this.endpoints = { ...defaultEndpoints, ...endpoints };
    this.fetchImpl = fetchImpl;
  }

  async request(endpoint, payload, { signal } = {}) {
    let response;
    try {
      // `window.fetch` is Web-API method rather than an ordinary callback in
      // some browsers. Calling a saved reference as `this.fetchImpl(...)`
      // can therefore use ProductApiClient as its receiver and fail with an
      // "Illegal invocation", even though the same-origin endpoint is live.
      // Supply the global receiver explicitly while still allowing tests and
      // future adapters to inject their own implementation.
      response = await this.fetchImpl.call(globalThis, endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
        signal
      });
    } catch (error) {
      if (signal?.aborted || error?.name === 'AbortError') {
        throw new ProductApiError('ABORTED');
      }
      throw new ProductApiError('UNAVAILABLE', { retryable: true });
    }

    const body = await readJson(response);
    if (!response.ok || body?.ok === false) {
      throw normalizeError(response, body);
    }
    if (!body?.ok || !body.data) {
      throw new ProductApiError('MALFORMED_RESPONSE', { retryable: true, status: response.status });
    }
    return body.data;
  }

  geocode({ query, locale }, options) {
    return this.request(this.endpoints.geocode, { query, locale }, options);
  }

  potential(input, options) {
    return this.request(this.endpoints.potential, input, options);
  }

  analyze(input, options) {
    return this.request(this.endpoints.analysis, input, options);
  }

  quickAnalyze(input, options) {
    return this.request(this.endpoints.quickAnalysis, input, options);
  }

  submitLead(lead, options) {
    return this.request(this.endpoints.lead, lead, options);
  }
}
