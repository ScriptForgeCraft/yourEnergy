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
const positiveNumber = (value, maximum) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= maximum ? number : null;
};
const oneOf = (value, values) => (values.includes(value) ? value : null);

/**
 * Quick Calculator leads carry only the small, explicit calculation summary an
 * engineer needs. Addresses, coordinates, roof geometry, tariffs, files and
 * arbitrary client fields are deliberately excluded from the CRM payload.
 */
const normalizeCalculatorContext = (value, locale) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const region = normalizeText(value.region);
  const mode = oneOf(normalizeText(value?.consumption?.mode), ['bill', 'usage', 'monthly']);
  const averageMonthlyBillAmd = positiveNumber(
    value?.consumption?.averageMonthlyBillAmd,
    100_000_000
  );
  const averageMonthlyKwh = positiveNumber(value?.consumption?.averageMonthlyKwh, 10_000_000);
  const annualKwh = positiveNumber(value?.consumption?.annualKwh, 100_000_000);
  const selectedScenario = normalizeText(value.selectedScenario);
  const capacityKwp = positiveNumber(value.capacityKwp, 100);
  const annualGenerationKwh = positiveNumber(value.annualGenerationKwh, 10_000_000);
  const source = normalizeText(value.source);
  const scope = normalizeText(value.scope);
  const range = value.budgetRangeAmd;
  const p25 = positiveNumber(range?.p25, 10_000_000_000);
  const p50 = positiveNumber(range?.p50, 10_000_000_000);
  const p75 = positiveNumber(range?.p75, 10_000_000_000);
  const budgetRangeAmd =
    p25 !== null && p50 !== null && p75 !== null && p25 <= p50 && p50 <= p75
      ? { p25, p50, p75 }
      : null;

  const context = {
    locale,
    ...(region && region.length <= 64 ? { region } : {}),
    ...(mode
      ? {
          consumption: {
            mode,
            ...(averageMonthlyBillAmd !== null ? { averageMonthlyBillAmd } : {}),
            ...(averageMonthlyKwh !== null ? { averageMonthlyKwh } : {}),
            ...(annualKwh !== null ? { annualKwh } : {})
          }
        }
      : {}),
    ...(selectedScenario && selectedScenario.length <= 96 ? { selectedScenario } : {}),
    ...(capacityKwp !== null ? { capacityKwp } : {}),
    ...(annualGenerationKwh !== null ? { annualGenerationKwh } : {}),
    ...(budgetRangeAmd ? { budgetRangeAmd } : {}),
    ...(source && source.length <= 96 ? { source } : {}),
    ...(scope && scope.length <= 96 ? { scope } : {})
  };

  return Object.keys(context).length > 1 ? context : null;
};

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

  const calculatorContext = normalizeCalculatorContext(body?.calculatorContext, locale);

  return {
    name,
    phone,
    ...(email ? { email } : {}),
    ...(message ? { message } : {}),
    locale,
    ...(analysisId ? { analysisId } : {}),
    ...(calculatorContext ? { calculatorContext } : {}),
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
          ...(lead.analysisId ? { analysisId: lead.analysisId } : {}),
          ...(lead.calculatorContext ? { calculatorContext: lead.calculatorContext } : {})
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

export const __private__ = Object.freeze({ normalizeCalculatorContext });
