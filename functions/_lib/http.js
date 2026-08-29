const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff'
};

const ERROR_DEFINITIONS = Object.freeze({
  METHOD_NOT_ALLOWED: {
    status: 405,
    message: 'This endpoint only accepts POST requests.',
    retryable: false
  },
  INVALID_CONTENT_TYPE: {
    status: 415,
    message: 'Send an application/json request body.',
    retryable: false
  },
  INVALID_JSON: {
    status: 400,
    message: 'The request body must be valid JSON.',
    retryable: false
  },
  PAYLOAD_TOO_LARGE: {
    status: 413,
    message: 'The request body is too large.',
    retryable: false
  },
  INVALID_INPUT: {
    status: 422,
    message: 'One or more request fields are invalid.',
    retryable: false
  },
  REQUEST_ABORTED: {
    status: 499,
    message: 'The request was cancelled.',
    retryable: true
  },
  GEOCODER_NOT_CONFIGURED: {
    status: 503,
    message: 'Address search is not configured yet.',
    retryable: false
  },
  GEOCODER_TIMEOUT: {
    status: 504,
    message: 'Address search took too long. Try again.',
    retryable: true
  },
  GEOCODER_UNAVAILABLE: {
    status: 503,
    message: 'Address search is temporarily unavailable.',
    retryable: true
  },
  GEOCODER_RESPONSE_INVALID: {
    status: 502,
    message: 'Address search returned an unusable response.',
    retryable: true
  },
  PVGIS_NOT_CONFIGURED: {
    status: 503,
    message: 'Solar yield analysis is not configured yet.',
    retryable: false
  },
  PVGIS_TIMEOUT: {
    status: 504,
    message: 'Solar yield analysis took too long. Try again.',
    retryable: true
  },
  PVGIS_UNAVAILABLE: {
    status: 503,
    message: 'Solar yield analysis is temporarily unavailable.',
    retryable: true
  },
  PVGIS_RESPONSE_INVALID: {
    status: 502,
    message: 'Solar yield analysis returned an unusable response.',
    retryable: true
  },
  CRM_NOT_CONFIGURED: {
    status: 503,
    message: 'Lead delivery is not configured yet.',
    retryable: false
  },
  CRM_TIMEOUT: {
    status: 504,
    message: 'Lead delivery took too long. Try again.',
    retryable: true
  },
  CRM_UNAVAILABLE: {
    status: 503,
    message: 'Lead delivery is temporarily unavailable.',
    retryable: true
  },
  CRM_REJECTED: {
    status: 502,
    message: 'Lead delivery was rejected by the configured service.',
    retryable: false
  },
  TURNSTILE_NOT_CONFIGURED: {
    status: 503,
    message: 'Bot verification is required but not configured yet.',
    retryable: false
  },
  BOT_VERIFICATION_REQUIRED: {
    status: 422,
    message: 'Bot verification is required before sending a lead.',
    retryable: false
  },
  BOT_VERIFICATION_FAILED: {
    status: 403,
    message: 'Bot verification was not accepted. Try again.',
    retryable: true
  },
  BOT_VERIFICATION_UNAVAILABLE: {
    status: 503,
    message: 'Bot verification is temporarily unavailable.',
    retryable: true
  },
  INTERNAL: {
    status: 500,
    message: 'The request could not be completed.',
    retryable: true
  }
});

export class ApiError extends Error {
  constructor(code, overrides = {}) {
    const definition = ERROR_DEFINITIONS[code] ?? ERROR_DEFINITIONS.INTERNAL;
    super(overrides.message ?? definition.message);
    this.name = 'ApiError';
    this.code = ERROR_DEFINITIONS[code] ? code : 'INTERNAL';
    this.status = overrides.status ?? definition.status;
    this.retryable = overrides.retryable ?? definition.retryable;
  }
}

export const isApiError = (error) => error instanceof ApiError;

export const toApiError = (error) => (isApiError(error) ? error : new ApiError('INTERNAL'));

export const apiHeaders = (additional = {}) => new Headers({ ...JSON_HEADERS, ...additional });

export const json = (body, { status = 200, headers = {} } = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: apiHeaders(headers)
  });

export const success = (data, options) => json({ ok: true, data }, options);

export const failure = (error, options = {}) => {
  const normalized = toApiError(error);
  return json(
    {
      ok: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        retryable: normalized.retryable
      }
    },
    { ...options, status: normalized.status }
  );
};

export const readJsonBody = async (request, { maxBytes = 32_768 } = {}) => {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new ApiError('PAYLOAD_TOO_LARGE');
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType && !contentType.toLowerCase().includes('application/json')) {
    throw new ApiError('INVALID_CONTENT_TYPE');
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    throw new ApiError('INVALID_JSON');
  }

  if (new TextEncoder().encode(rawBody).byteLength > maxBytes) {
    throw new ApiError('PAYLOAD_TOO_LARGE');
  }

  try {
    const parsed = JSON.parse(rawBody);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new ApiError('INVALID_JSON');
    }
    return parsed;
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw new ApiError('INVALID_JSON');
  }
};

/**
 * Shared Pages Function wrapper. It intentionally returns no CORS headers:
 * public browser requests are same-origin and API credentials stay server-side.
 */
export const handlePost = async (context, handler) => {
  const request = context.request;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: new Headers({
        allow: 'POST, OPTIONS',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff'
      })
    });
  }

  if (request.method !== 'POST') {
    return failure(new ApiError('METHOD_NOT_ALLOWED'), {
      headers: { allow: 'POST, OPTIONS' }
    });
  }

  try {
    const data = await handler({
      request,
      env: context.env ?? {},
      fetchImpl: context.fetch ?? fetch
    });
    return success(data);
  } catch (error) {
    // Never log request bodies, addresses, coordinates, or lead details here.
    return failure(error);
  }
};

export const errorCodes = Object.freeze(Object.keys(ERROR_DEFINITIONS));
