import { compareOffer } from './domain/index.js';

const DRAFT_STORAGE_KEY = 'yourenergy-calculator-draft';
const CORE_SCOPE_KEYS = [
  'panels',
  'inverter',
  'mounting',
  'standard-installation',
  'basic-grid-connection'
];

const positiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const readConfig = () => {
  const element = document.getElementById('tool-page-config');
  if (!element) return null;

  try {
    const config = JSON.parse(element.textContent ?? '');
    return config && typeof config === 'object' ? config : null;
  } catch {
    return null;
  }
};

const setStatus = (element, message, isError = false) => {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('is-error', isError);
};

const numberFormatter = (locale, fractionDigits = 0) =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits
  });

const formatAmdPerWp = (value, locale) => `${numberFormatter(locale, 1).format(value)} ֏/Wp`;

const saveCalculatorDraft = (draft) => {
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
};

const initQuickCalculator = (config) => {
  const form = document.querySelector('[data-quick-calculator]');
  if (!form) return;

  const status = form.querySelector('[data-tool-status]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(form);
    const averageMonthlyKwh = positiveNumber(values.get('averageMonthlyKwh'));
    const averageMonthlyBillAmd = positiveNumber(values.get('averageMonthlyBillAmd'));
    const tariffRate = positiveNumber(values.get('tariff'));
    const tariffProvided = String(values.get('tariff') ?? '').trim().length > 0;

    if (
      (!averageMonthlyKwh && !averageMonthlyBillAmd) ||
      (averageMonthlyBillAmd && !tariffRate) ||
      (tariffProvided && !tariffRate)
    ) {
      setStatus(status, config.strings.invalid, true);
      return;
    }

    const consumption = averageMonthlyKwh ? { averageMonthlyKwh } : { averageMonthlyBillAmd };
    const draft = {
      address: String(values.get('address') ?? '').trim(),
      consumption,
      tariff: tariffRate ? { rateAmdPerKwh: tariffRate } : null
    };

    if (!saveCalculatorDraft(draft)) {
      setStatus(status, config.strings.storageUnavailable, true);
      return;
    }

    setStatus(status, config.strings.stored);
    window.setTimeout(() => {
      window.location.assign(`${config.homeHref}#calculator`);
    }, 60);
  });
};

const populateList = (list, items) => {
  if (!list) return;
  list.replaceChildren();
  for (const item of items) {
    const entry = document.createElement('li');
    entry.textContent = item;
    list.append(entry);
  }
};

const initOfferChecker = (config) => {
  const form = document.querySelector('[data-offer-checker]');
  const result = document.querySelector('[data-offer-result]');
  if (!form || !result) return;

  const status = form.querySelector('[data-tool-status]');
  const summary = result.querySelector('[data-offer-result-summary]');
  const metrics = result.querySelector('[data-offer-metrics]');
  const rate = result.querySelector('[data-offer-rate]');
  const range = result.querySelector('[data-offer-range]');
  const why = result.querySelector('[data-offer-why]');
  const reasons = result.querySelector('[data-offer-reasons]');
  const questions = result.querySelector('[data-offer-questions]');
  const questionsList = result.querySelector('[data-offer-questions-list]');
  const engineeringCta = result.querySelector('[data-engineering-cta]');

  const resetResult = () => {
    result.classList.remove(
      'is-below-range',
      'is-within-range',
      'is-above-range',
      'is-not-comparable'
    );
    summary.textContent = config.strings.resultAwaiting;
    metrics.hidden = true;
    why.hidden = true;
    questions.hidden = true;
    engineeringCta.hidden = true;
    populateList(reasons, []);
    populateList(questionsList, []);
  };

  const resultReason = (reason, comparison) => {
    const localized = config.strings.reason[reason];
    if (localized) return localized;
    if (reason === 'CORE_SCOPE_INCOMPLETE' && comparison.missingInclusions.length) {
      const missing = comparison.missingInclusions
        .map((key) => config.strings.scope[key])
        .filter(Boolean)
        .join(', ');
      return `${config.strings.scopeIncomplete}: ${missing}.`;
    }
    return config.strings.notComparable;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(form);
    const totalAmd = positiveNumber(values.get('totalAmd'));
    const capacityKwp = positiveNumber(values.get('capacityKwp'));
    if (!totalAmd || !capacityKwp) {
      setStatus(status, config.strings.invalid, true);
      return;
    }

    const systemType = String(values.get('systemType') ?? 'residential-grid-tied');
    const inclusions = Object.fromEntries(
      CORE_SCOPE_KEYS.map((key) => [key, values.get(`scope-${key}`) === 'true'])
    );
    inclusions.battery = systemType === 'battery' || values.get('scope-battery') === 'true';

    const comparison = compareOffer({
      totalAmd,
      capacityKwp,
      systemType,
      inclusions,
      priceBook: config.priceBook
    });

    setStatus(status, '');
    result.classList.remove(
      'is-below-range',
      'is-within-range',
      'is-above-range',
      'is-not-comparable'
    );
    result.classList.add(`is-${comparison.status}`);
    summary.textContent = config.strings.status[comparison.status] ?? config.strings.notComparable;
    metrics.hidden = !comparison.comparable;
    why.hidden = comparison.comparable;
    questions.hidden = false;
    engineeringCta.hidden = false;

    if (comparison.comparable) {
      rate.textContent = formatAmdPerWp(comparison.amdPerWp, config.locale);
      range.textContent = `${formatAmdPerWp(
        comparison.estimate.ratesAmdPerWp.p25,
        config.locale
      )} – ${formatAmdPerWp(comparison.estimate.ratesAmdPerWp.p75, config.locale)}`;
      populateList(reasons, []);
    } else {
      metrics.hidden = true;
      const messages = comparison.reasons.map((reason) => resultReason(reason, comparison));
      populateList(reasons, [...new Set(messages)]);
    }

    populateList(questionsList, comparison.questions);
    result.focus({ preventScroll: false });
  });

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      setStatus(status, '');
      resetResult();
    });
  });
};

const config = readConfig();
if (config?.toolType === 'calculator') initQuickCalculator(config);
if (config?.toolType === 'offer-checker') initOfferChecker(config);
