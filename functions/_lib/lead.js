import {
  configuredUrl,
  envBoolean,
  envString,
  optionalSecretHeader,
  providerTimeoutMs
} from './config.js';
import { ApiError } from './http.js';
import { fetchWithTimeout } from './provider.js';

const SUPPORTED_LOCALES = new Set(['hy', 'ru', 'en']);
const ANALYSIS_ID = /^[A-Za-z0-9_-]{1,96}$/;
const CRM_LEAD_ID = /^[A-Za-z0-9._:-]{1,128}$/;

const normalizeText = (value) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

const normalizeLocale = (value) => normalizeText(value).toLowerCase().split('-')[0];

const validPhone = (value) => /^[+()\d\s-]{6,32}$/.test(value) && /\d/.test(value);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const validateLeadInput = (body) => {
  const name = normalizeText(body?.name);
  const phone = normalizeText(body?.phone);
  const email = normalizeText(body?.email);
  const message = normalizeText(body?.message);
  const locale = normalizeLocale(body?.locale);
  const analysisId = normalizeText(body?.analysisId);
  const turnstileToken = normalizeText(body?.turnstileToken);

  if (
    name.length < 2 ||
    name.length > 100 ||
    !validPhone(phone) ||
    (email && (email.length > 254 || !validEmail(email))) ||
    message.length > 2_000 ||
    !SUPPORTED_LOCALES.has(locale) ||
    (analysisId && !ANALYSIS_ID.test(analysisId)) ||
    turnstileToken.length > 4_096
  ) {
    throw new ApiError('INVALID_INPUT');
  }

  return {
    name,
    phone,
    ...(email ? { email } : {}),
    ...(message ? { message } : {}),
    locale,
    ...(analysisId ? { analysisId } : {}),
    ...(turnstileToken ? { turnstileToken } : {})
  };
};

export const createTurnstileAdapter = (env, { fetchImpl = fetch } = {}) => {
  const secret = envString(env, 'TURNSTILE_SECRET_KEY');
  if (!secret) {
    return null;
  }

  const timeoutMs = providerTimeoutMs(env);
  return {
    async verify(token, { signal, remoteIp } = {}) {
      if (!token) {
        throw new ApiError('BOT_VERIFICATION_REQUIRED');
      }

      const body = new URLSearchParams({ secret, response: token });
      if (remoteIp) {
        body.set('remoteip', remoteIp);
      }

      let response;
      try {
        response = await fetchWithTimeout(
          fetchImpl,
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body
          },
          {
            signal,
            timeoutMs,
            timeoutCode: 'BOT_VERIFICATION_UNAVAILABLE',
            unavailableCode: 'BOT_VERIFICATION_UNAVAILABLE'
          }
        );
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError('BOT_VERIFICATION_UNAVAILABLE');
      }

      if (!response.ok) {
        throw new ApiError('BOT_VERIFICATION_UNAVAILABLE');
      }

      try {
        const result = await response.json();
        if (result?.success !== true) {
          throw new ApiError('BOT_VERIFICATION_FAILED');
        }
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError('BOT_VERIFICATION_UNAVAILABLE');
      }
    }
  };
};

export const createCrmAdapter = (env, { fetchImpl = fetch } = {}) => {
  const endpoint = configuredUrl(env, 'CRM_ENDPOINT', 'CRM_NOT_CONFIGURED');
  const credential = optionalSecretHeader(env, 'CRM');
  const timeoutMs = providerTimeoutMs(env);

  return {
    async submit(lead, { signal } = {}) {
      const headers = new Headers({
        accept: 'application/json',
        'content-type': 'application/json'
      });
      if (credential) {
        headers.set(credential.name, credential.value);
      }

      const payload = {
        type: 'solar-lead',
        submittedAt: new Date().toISOString(),
        contact: {
          name: lead.name,
          phone: lead.phone,
          ...(lead.email ? { email: lead.email } : {})
        },
        request: {
          locale: lead.locale,
          ...(lead.message ? { message: lead.message } : {}),
          ...(lead.analysisId ? { analysisId: lead.analysisId } : {})
        }
      };

      const response = await fetchWithTimeout(
        fetchImpl,
        endpoint,
        { method: 'POST', headers, body: JSON.stringify(payload) },
        {
          signal,
          timeoutMs,
          timeoutCode: 'CRM_TIMEOUT',
          unavailableCode: 'CRM_UNAVAILABLE'
        }
      );

      if (!response.ok) {
        throw new ApiError(
          response.status >= 500 || response.status === 429 ? 'CRM_UNAVAILABLE' : 'CRM_REJECTED'
        );
      }

      // A webhook is allowed to return an empty response. We expose an ID only
      // when the CRM explicitly supplied a safe value; no client-side ID is made up.
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.toLowerCase().includes('application/json')) {
        return null;
      }

      try {
        const result = await response.json();
        const leadId = normalizeText(result?.leadId ?? result?.id);
        return CRM_LEAD_ID.test(leadId) ? leadId : null;
      } catch {
        return null;
      }
    }
  };
};

/**
 * Returns the honest state of the optional Turnstile adapter. A CRM success is
 * never fabricated: this function resolves only after the CRM accepted it.
 */
export const submitLead = async (body, env, { fetchImpl = fetch, signal, remoteIp } = {}) => {
  const lead = validateLeadInput(body);
  const crm = createCrmAdapter(env, { fetchImpl });
  const turnstile = createTurnstileAdapter(env, { fetchImpl });
  const requiresTurnstile = envBoolean(env, 'LEAD_REQUIRE_TURNSTILE');

  if (!turnstile && (requiresTurnstile || lead.turnstileToken)) {
    throw new ApiError('TURNSTILE_NOT_CONFIGURED');
  }

  if (turnstile) {
    await turnstile.verify(lead.turnstileToken, { signal, remoteIp });
  }

  const leadId = await crm.submit(lead, { signal });
  return {
    accepted: true,
    delivery: 'crm',
    leadId,
    turnstile: turnstile ? 'verified' : 'not-configured'
  };
};
