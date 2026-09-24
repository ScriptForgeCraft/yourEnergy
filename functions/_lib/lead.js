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
const boundedNumber = (value, minimum, maximum) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
};
const oneOf = (value, values) => (values.includes(value) ? value : null);
const boundedText = (value, maximum) => {
  const normalized = normalizeText(value);
  return normalized && normalized.length <= maximum ? normalized : null;
};

const normalizeMonthlyValues = (value, maximum) => {
  if (!Array.isArray(value) || value.length !== 12) return null;
  const normalized = value.map((item) => boundedNumber(item, 0, maximum));
  return normalized.every((item) => item !== null) ? normalized : null;
};

const normalizeOutlinePoints = (value) => {
  if (!Array.isArray(value) || value.length < 3 || value.length > 40) return null;
  const normalized = value.map((point) => ({
    lat: boundedNumber(point?.lat, -90, 90),
    lng: boundedNumber(point?.lng, -180, 180)
  }));
  return normalized.every((point) => point.lat !== null && point.lng !== null) ? normalized : null;
};

/**
 * Quick Calculator leads carry only the small, explicit calculation summary an
 * engineer needs. Addresses, coordinates, roof geometry, tariffs, files and
 * arbitrary client fields are deliberately excluded from delivery payloads.
 */
const normalizeCalculatorContext = (value, locale) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (normalizeText(value.kind) === 'professional') {
    return normalizeProfessionalCalculatorContext(value, locale);
  }
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

/**
 * Professional Calculator requests intentionally allow the full submitted
 * calculation to be shared with an engineer, but every item stays typed and
 * bounded. This prevents arbitrary nested data from becoming a mail message.
 */
const normalizeProfessionalCalculatorContext = (value, locale) => {
  const property = value.property && typeof value.property === 'object' ? value.property : {};
  const consumption =
    value.consumption && typeof value.consumption === 'object' ? value.consumption : {};
  const roof = value.roof && typeof value.roof === 'object' ? value.roof : {};
  const result = value.result && typeof value.result === 'object' ? value.result : {};
  const equipment = value.equipment && typeof value.equipment === 'object' ? value.equipment : {};
  const mode = oneOf(normalizeText(consumption.mode), ['bill', 'usage', 'monthly']);
  const areaMethod = oneOf(normalizeText(roof.areaMethod), ['map-projected', 'measured-plane']);
  const mountingMode = oneOf(normalizeText(roof.mountingMode), ['roof-parallel', 'elevated']);
  const panelCount = boundedNumber(result.panelCount, 1, 100_000);
  const outlinePoints = normalizeOutlinePoints(roof.outlinePoints);
  const professional = {
    type: 'professional',
    locale,
    property: {
      address: boundedText(property.address, 500),
      latitude: boundedNumber(property.latitude, -90, 90),
      longitude: boundedNumber(property.longitude, -180, 180)
    },
    consumption: {
      mode,
      averageMonthlyBillAmd: positiveNumber(consumption.averageMonthlyBillAmd, 100_000_000),
      averageMonthlyKwh: positiveNumber(consumption.averageMonthlyKwh, 10_000_000),
      monthlyKwh: normalizeMonthlyValues(consumption.monthlyKwh, 10_000_000),
      annualKwh: positiveNumber(consumption.annualKwh, 100_000_000)
    },
    tariffAmdPerKwh: positiveNumber(value.tariffAmdPerKwh, 1_000_000),
    roof: {
      areaMethod,
      areaSqm: positiveNumber(roof.areaSqm, 10_000_000),
      projectedAreaSqm: positiveNumber(roof.projectedAreaSqm, 10_000_000),
      planeAreaSqm: positiveNumber(roof.planeAreaSqm, 10_000_000),
      azimuthDegrees: boundedNumber(roof.azimuthDegrees, 0, 359),
      tiltDegrees: boundedNumber(roof.tiltDegrees, 0, 90),
      mountingMode,
      outlinePoints
    },
    storageRequested: value.storageRequested === true,
    result: {
      solarYieldKwhPerKwp: positiveNumber(result.solarYieldKwhPerKwp, 10_000_000),
      capacityKwp: positiveNumber(result.capacityKwp, 100_000),
      panelCount,
      panelWatts: positiveNumber(result.panelWatts, 100_000),
      annualGenerationKwh: positiveNumber(result.annualGenerationKwh, 100_000_000),
      monthlyGenerationKwh: normalizeMonthlyValues(result.monthlyGenerationKwh, 100_000_000),
      annualConsumptionKwh: positiveNumber(result.annualConsumptionKwh, 100_000_000),
      coveredConsumptionKwh: boundedNumber(result.coveredConsumptionKwh, 0, 100_000_000),
      surplusGenerationKwh: boundedNumber(result.surplusGenerationKwh, 0, 100_000_000),
      coveragePercent: boundedNumber(result.coveragePercent, 0, 100_000),
      annualSavingsAmd: boundedNumber(result.annualSavingsAmd, 0, 100_000_000_000),
      avoidedCo2Tons: boundedNumber(result.avoidedCo2Tons, 0, 100_000_000),
      source: boundedText(result.source, 96)
    },
    equipment: {
      solarModule: boundedText(equipment.solarModule, 300),
      inverter: boundedText(equipment.inverter, 300),
      storage: boundedText(equipment.storage, 300),
      mounting: boundedText(equipment.mounting, 300)
    },
    billFileName: boundedText(value.billFileName, 255)
  };

  return professional;
};

const validateLeadInput = (body) => {
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

const createTurnstileAdapter = (env, { fetchImpl = fetch } = {}) => {
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

const localeForFormatting = (locale) =>
  locale === 'ru' ? 'ru-RU' : locale === 'hy' ? 'hy-AM' : 'en-US';

const formatNumber = (value, locale, maximumFractionDigits = 0) =>
  Number.isFinite(Number(value))
    ? new Intl.NumberFormat(localeForFormatting(locale), { maximumFractionDigits }).format(value)
    : null;

const field = (lines, label, value) => {
  if (value === null || value === undefined || value === '') return;
  lines.push(`• ${label}: ${value}`);
};

const section = (lines, title) => lines.push('', title);

const modeLabel = (mode) =>
  ({ bill: 'monthly bill', usage: 'monthly kWh', monthly: 'monthly profile' })[mode] ?? mode;

const roofAreaMethodLabel = (method) =>
  ({ 'map-projected': 'map outline', 'measured-plane': 'measured roof plane' })[method] ?? method;

const mountingModeLabel = (mode) =>
  ({ 'roof-parallel': 'parallel to roof', elevated: 'elevated structure' })[mode] ?? mode;

const formatQuickCalculatorContext = (context, locale) => {
  const lines = ['Quick Calculator summary'];
  field(lines, 'Region', context.region);
  if (context.consumption) {
    section(lines, 'Consumption');
    field(lines, 'Input', modeLabel(context.consumption.mode));
    field(
      lines,
      'Average monthly bill',
      context.consumption.averageMonthlyBillAmd === undefined
        ? null
        : `${formatNumber(context.consumption.averageMonthlyBillAmd, locale)} AMD`
    );
    field(
      lines,
      'Average monthly consumption',
      context.consumption.averageMonthlyKwh === undefined
        ? null
        : `${formatNumber(context.consumption.averageMonthlyKwh, locale)} kWh`
    );
    field(
      lines,
      'Annual consumption',
      context.consumption.annualKwh === undefined
        ? null
        : `${formatNumber(context.consumption.annualKwh, locale)} kWh`
    );
  }
  section(lines, 'Preliminary result');
  field(lines, 'Scenario', context.selectedScenario);
  field(
    lines,
    'Recommended power',
    context.capacityKwp === undefined ? null : `${formatNumber(context.capacityKwp, locale, 2)} kWp`
  );
  field(
    lines,
    'Annual generation',
    context.annualGenerationKwh === undefined
      ? null
      : `${formatNumber(context.annualGenerationKwh, locale)} kWh`
  );
  if (context.budgetRangeAmd) {
    field(
      lines,
      'Preliminary budget range',
      `${formatNumber(context.budgetRangeAmd.p25, locale)}–${formatNumber(
        context.budgetRangeAmd.p75,
        locale
      )} AMD`
    );
  }
  field(lines, 'Solar data source', context.source);
  field(lines, 'Scope', context.scope);
  return lines;
};

const formatProfessionalCalculatorContext = (context, locale) => {
  const lines = ['Professional Calculator report'];
  const { property, consumption, roof, result, equipment } = context;

  section(lines, 'Property');
  field(lines, 'Address / note', property.address);
  if (property.latitude !== null && property.longitude !== null) {
    field(
      lines,
      'Coordinates',
      `${formatNumber(property.latitude, locale, 5)}, ${formatNumber(property.longitude, locale, 5)}`
    );
  }

  section(lines, 'Entered consumption');
  field(lines, 'Input method', modeLabel(consumption.mode));
  field(
    lines,
    'Average monthly bill',
    consumption.averageMonthlyBillAmd === null
      ? null
      : `${formatNumber(consumption.averageMonthlyBillAmd, locale)} AMD`
  );
  field(
    lines,
    'Average monthly consumption',
    consumption.averageMonthlyKwh === null
      ? null
      : `${formatNumber(consumption.averageMonthlyKwh, locale)} kWh`
  );
  field(
    lines,
    'Annual consumption',
    consumption.annualKwh === null ? null : `${formatNumber(consumption.annualKwh, locale)} kWh`
  );
  field(
    lines,
    'Electricity tariff',
    context.tariffAmdPerKwh === null
      ? null
      : `${formatNumber(context.tariffAmdPerKwh, locale, 2)} AMD/kWh`
  );
  if (consumption.monthlyKwh) {
    field(
      lines,
      'Monthly consumption profile',
      consumption.monthlyKwh
        .map((value, index) => `${index + 1}: ${formatNumber(value, locale)} kWh`)
        .join(' · ')
    );
  }

  section(lines, 'Roof');
  field(lines, 'Area method', roofAreaMethodLabel(roof.areaMethod));
  field(
    lines,
    'Roof area used for sizing',
    roof.areaSqm === null ? null : `${formatNumber(roof.areaSqm, locale, 1)} m²`
  );
  field(
    lines,
    'Projected map area',
    roof.projectedAreaSqm === null ? null : `${formatNumber(roof.projectedAreaSqm, locale, 1)} m²`
  );
  field(
    lines,
    'Measured roof-plane area',
    roof.planeAreaSqm === null ? null : `${formatNumber(roof.planeAreaSqm, locale, 1)} m²`
  );
  field(
    lines,
    'Orientation',
    roof.azimuthDegrees === null ? null : `${formatNumber(roof.azimuthDegrees, locale)}°`
  );
  field(
    lines,
    'Tilt',
    roof.tiltDegrees === null ? null : `${formatNumber(roof.tiltDegrees, locale)}°`
  );
  field(lines, 'Mounting approach', mountingModeLabel(roof.mountingMode));
  field(lines, 'Storage / backup requested', context.storageRequested ? 'Yes' : 'No');
  if (roof.outlinePoints) {
    field(lines, 'Roof outline', `${roof.outlinePoints.length} points`);
    field(
      lines,
      'Outline coordinates',
      roof.outlinePoints
        .map(
          (point, index) =>
            `${index + 1}: ${formatNumber(point.lat, locale, 5)}, ${formatNumber(point.lng, locale, 5)}`
        )
        .join(' · ')
    );
  }

  section(lines, 'Calculated result');
  field(
    lines,
    'Solar potential',
    result.solarYieldKwhPerKwp === null
      ? null
      : `${formatNumber(result.solarYieldKwhPerKwp, locale)} kWh/kWp per year`
  );
  field(
    lines,
    'Recommended power',
    result.capacityKwp === null ? null : `${formatNumber(result.capacityKwp, locale, 2)} kWp`
  );
  field(
    lines,
    'Panels',
    result.panelCount === null || result.panelWatts === null
      ? null
      : `${formatNumber(result.panelCount, locale)} × ${formatNumber(result.panelWatts, locale)} W`
  );
  field(
    lines,
    'Annual generation',
    result.annualGenerationKwh === null
      ? null
      : `${formatNumber(result.annualGenerationKwh, locale)} kWh`
  );
  field(
    lines,
    'Consumption coverage',
    result.coveragePercent === null ? null : `${formatNumber(result.coveragePercent, locale, 1)}%`
  );
  field(
    lines,
    'Covered consumption',
    result.coveredConsumptionKwh === null
      ? null
      : `${formatNumber(result.coveredConsumptionKwh, locale)} kWh`
  );
  field(
    lines,
    'Surplus generation',
    result.surplusGenerationKwh === null
      ? null
      : `${formatNumber(result.surplusGenerationKwh, locale)} kWh`
  );
  field(
    lines,
    'Estimated annual savings',
    result.annualSavingsAmd === null ? null : `${formatNumber(result.annualSavingsAmd, locale)} AMD`
  );
  field(
    lines,
    'CO₂ reduction',
    result.avoidedCo2Tons === null
      ? null
      : `${formatNumber(result.avoidedCo2Tons, locale, 2)} t/year`
  );
  field(lines, 'Solar data source', result.source);
  if (result.monthlyGenerationKwh) {
    field(
      lines,
      'Monthly generation',
      result.monthlyGenerationKwh
        .map((value, index) => `${index + 1}: ${formatNumber(value, locale)} kWh`)
        .join(' · ')
    );
  }

  section(lines, 'Recommended equipment');
  field(lines, 'Solar module', equipment.solarModule);
  field(lines, 'Inverter', equipment.inverter);
  field(lines, 'Storage', equipment.storage);
  field(lines, 'Mounting', equipment.mounting);
  field(
    lines,
    'Uploaded bill file',
    context.billFileName ? `${context.billFileName} (not attached)` : null
  );
  return lines;
};

/** Produces the same readable plain-text report for Telegram and e-mail. */
const formatLeadMessage = (lead) => {
  const isProfessional = lead.calculatorContext?.type === 'professional';
  const lines = [
    isProfessional ? 'New YourEnergy Professional Calculator request' : 'New YourEnergy lead',
    '',
    'Contact',
    `• Name: ${lead.name}`,
    `• Phone: ${lead.phone}`,
    `• Email: ${lead.email ?? 'Not provided'}`,
    `• Language: ${lead.locale}`
  ];

  if (lead.analysisId) field(lines, 'Analysis ID', lead.analysisId);
  if (lead.calculatorContext) {
    lines.push(
      '',
      ...(isProfessional
        ? formatProfessionalCalculatorContext(lead.calculatorContext, lead.locale)
        : formatQuickCalculatorContext(lead.calculatorContext, lead.locale))
    );
  }
  if (lead.message) {
    section(lines, 'Customer message');
    lines.push(lead.message);
  }
  return lines.join('\n');
};

/** Telegram Bot API adapter. The bot token is never included in a client response. */
const createTelegramAdapter = (env, { fetchImpl = fetch } = {}) => {
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
const createEmailAdapter = (env, { fetchImpl = fetch } = {}) => {
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
            subject:
              lead.calculatorContext?.type === 'professional'
                ? 'New YourEnergy Professional Calculator request'
                : 'New YourEnergy lead',
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
const deliverLead = async (lead, env, { fetchImpl = fetch, signal } = {}) => {
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
