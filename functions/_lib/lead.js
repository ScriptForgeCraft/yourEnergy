import { envBoolean, envString, providerTimeoutMs } from './config.js';
import { ApiError, isApiError } from './http.js';
import { fetchWithTimeout } from './provider.js';

const SUPPORTED_LOCALES = new Set(['hy', 'ru', 'en']);
const ANALYSIS_ID = /^[A-Za-z0-9_-]{1,96}$/;
const TELEGRAM_MESSAGE_LIMIT = 4_096;
const DELIVERY_CHANNELS = Object.freeze(['telegram', 'email']);

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
 * arbitrary client fields are deliberately excluded from delivery payloads.
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

const leadDeliveryErrorForResponse = (response) =>
  new ApiError(
    response.status === 429 || response.status >= 500
      ? 'LEAD_DELIVERY_UNAVAILABLE'
      : 'LEAD_DELIVERY_REJECTED'
  );

const truncateTelegramMessage = (message) => {
  const characters = Array.from(message);
  if (characters.length <= TELEGRAM_MESSAGE_LIMIT) return message;
  const notice = '\n\n[Message truncated; full text is in the email.]';
  return `${characters.slice(0, TELEGRAM_MESSAGE_LIMIT - notice.length).join('')}${notice}`;
};

/**
 * Produces one shared, plain-text representation for Telegram and email. The
 * lead was already normalized, so it cannot add headers or arbitrary objects.
 */
export const formatLeadMessage = (lead) => {
  const lines = [
    'New YourEnergy lead',
    '',
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email ?? 'Not provided'}`,
    `Locale: ${lead.locale}`
  ];

  if (lead.analysisId) {
    lines.push(`Analysis ID: ${lead.analysisId}`);
  }
  if (lead.calculatorContext) {
    lines.push('', 'Calculator context:', JSON.stringify(lead.calculatorContext, null, 2));
  }
  if (lead.message) {
    lines.push('', 'Message:', lead.message);
  }

  return lines.join('\n');
};

/** Telegram Bot API adapter. The bot token is never included in a client response. */
export const createTelegramAdapter = (env, { fetchImpl = fetch } = {}) => {
  const botToken = envString(env, 'TELEGRAM_BOT_TOKEN');
  const timeoutMs = providerTimeoutMs(env);

  return {
    async send(leadText, chatId, { signal } = {}) {
      if (!botToken || !chatId) {
        throw new ApiError('LEAD_DELIVERY_NOT_CONFIGURED');
      }

      const response = await fetchWithTimeout(
        fetchImpl,
        `https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`,
        {
          method: 'POST',
          headers: { accept: 'application/json', 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: truncateTelegramMessage(leadText),
            disable_web_page_preview: true
          })
        },
        {
          signal,
          timeoutMs,
          timeoutCode: 'LEAD_DELIVERY_TIMEOUT',
          unavailableCode: 'LEAD_DELIVERY_UNAVAILABLE'
        }
      );

      if (!response.ok) {
        throw leadDeliveryErrorForResponse(response);
      }

      try {
        if ((await response.json())?.ok !== true) {
          throw new ApiError('LEAD_DELIVERY_REJECTED');
        }
      } catch (error) {
        if (isApiError(error)) throw error;
        throw new ApiError('LEAD_DELIVERY_REJECTED');
      }
    }
  };
};

/** Cloudflare Email Service REST adapter. */
export const createEmailAdapter = (env, { fetchImpl = fetch } = {}) => {
  const apiToken = envString(env, 'CF_EMAIL_API_TOKEN');
  const accountId = envString(env, 'CF_ACCOUNT_ID');
  const contactEmail = envString(env, 'CONTACT_EMAIL');
  const from = envString(env, 'EMAIL_FROM');
  const timeoutMs = providerTimeoutMs(env);

  return {
    async send(leadText, lead, { signal } = {}) {
      if (!apiToken || !accountId || !contactEmail || !validEmail(contactEmail) || !from) {
        throw new ApiError('LEAD_DELIVERY_NOT_CONFIGURED');
      }

      const response = await fetchWithTimeout(
        fetchImpl,
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/email/sending/send`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${apiToken}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            to: contactEmail,
            from,
            subject: 'New YourEnergy lead',
            text: leadText,
            ...(lead.email ? { reply_to: lead.email } : {})
          })
        },
        {
          signal,
          timeoutMs,
          timeoutCode: 'LEAD_DELIVERY_TIMEOUT',
          unavailableCode: 'LEAD_DELIVERY_UNAVAILABLE'
        }
      );

      if (!response.ok) {
        throw leadDeliveryErrorForResponse(response);
      }

      try {
        const result = await response.json();
        if (result?.success !== true) {
          throw new ApiError('LEAD_DELIVERY_REJECTED');
        }
      } catch (error) {
        if (isApiError(error)) throw error;
        throw new ApiError('LEAD_DELIVERY_REJECTED');
      }
    }
  };
};

const deliveryFailure = (results) => {
  const errors = results
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason)
    .filter(isApiError);

  // Preserve an intentional browser cancellation instead of turning it into a
  // delivery outage after the three in-flight attempts have settled.
  const priority = [
    'REQUEST_ABORTED',
    'LEAD_DELIVERY_TIMEOUT',
    'LEAD_DELIVERY_UNAVAILABLE',
    'LEAD_DELIVERY_REJECTED',
    'LEAD_DELIVERY_NOT_CONFIGURED'
  ];
  for (const code of priority) {
    const error = errors.find((candidate) => candidate.code === code);
    if (error) return error;
  }
  return new ApiError('LEAD_DELIVERY_UNAVAILABLE');
};

const deliverySummary = (results) =>
  Object.fromEntries(
    DELIVERY_CHANNELS.map((channel, index) => [
      channel,
      results[index]?.status === 'fulfilled' ? 'succeeded' : 'failed'
    ])
  );

/**
 * Attempts every delivery independently. A lead is accepted as soon as at
 * least one channel has accepted it, but Promise.allSettled still waits for
 * every channel so the safe server-side summary is complete.
 */
export const deliverLead = async (lead, env, { fetchImpl = fetch, signal } = {}) => {
  const leadText = formatLeadMessage(lead);
  const telegram = createTelegramAdapter(env, { fetchImpl });
  const email = createEmailAdapter(env, { fetchImpl });
  const results = await Promise.allSettled([
    telegram.send(leadText, envString(env, 'TELEGRAM_CHAT_ID'), { signal }),
    email.send(leadText, lead, { signal })
  ]);

  const summary = deliverySummary(results);
  if (!results.some((result) => result.status === 'fulfilled')) {
    throw deliveryFailure(results);
  }
  return summary;
};

/**
 * Returns the honest state of the optional Turnstile adapter. Delivery is
 * never fabricated: this function resolves only after at least one delivery
 * channel has accepted the normalized lead and all attempts have settled.
 */
export const submitLead = async (body, env, { fetchImpl = fetch, signal, remoteIp } = {}) => {
  const lead = validateLeadInput(body);
  const turnstile = createTurnstileAdapter(env, { fetchImpl });
  const requiresTurnstile = envBoolean(env, 'LEAD_REQUIRE_TURNSTILE');

  if (!turnstile && (requiresTurnstile || lead.turnstileToken)) {
    throw new ApiError('TURNSTILE_NOT_CONFIGURED');
  }

  if (turnstile) {
    await turnstile.verify(lead.turnstileToken, { signal, remoteIp });
  }

  const delivery = await deliverLead(lead, env, { fetchImpl, signal });
  return {
    accepted: true,
    delivery,
    turnstile: turnstile ? 'verified' : 'not-configured'
  };
};

export const __private__ = Object.freeze({ normalizeCalculatorContext, truncateTelegramMessage });
