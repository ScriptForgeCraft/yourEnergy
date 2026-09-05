import { compareOffer, isPriceBookActive } from './domain/index.js';
const CORE_SCOPE_KEYS = [
  'panels',
  'inverter',
  'mounting',
  'standard-installation',
  'basic-grid-connection'
];
const SCOPE_LABEL_KEYS = Object.freeze({
  'standard-installation': 'installation',
  'basic-grid-connection': 'grid'
});

const positiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
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

const formatPriceBookDate = (value, locale) =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${value}T00:00:00.000Z`));

export const initPriceBookReference = (config) => {
  if (config?.toolType !== 'offer-checker') return;

  const reference = document.querySelector('[data-pricebook-reference]');
  const version = document.querySelector('[data-pricebook-version]');
  if (!reference || !version) return;

  if (!isPriceBookActive(config.priceBook)) {
    reference.textContent = config.strings.expiry;
    version.hidden = true;
    return;
  }

  const rates = config.priceBook.ratesAmdPerWp;
  reference.textContent = `${formatAmdPerWp(rates.p25, config.locale)} – ${formatAmdPerWp(
    rates.p75,
    config.locale
  )}`;
  version.textContent = `YOURENERGY · ${config.priceBook.version} · ${formatPriceBookDate(
    config.priceBook.validUntil,
    config.locale
  )}`;
  version.hidden = false;
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

export const initOfferChecker = (config) => {
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
    if (reason === 'CORE_SCOPE_INCOMPLETE' && comparison.missingInclusions.length) {
      const missing = comparison.missingInclusions
        .map((key) => config.strings.scope[SCOPE_LABEL_KEYS[key] ?? key])
        .filter(Boolean)
        .join(', ');
      return `${config.strings.scopeIncomplete}: ${missing}.`;
    }
    const localized = config.strings.reason?.[reason];
    if (localized) return localized;
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

    populateList(
      questionsList,
      comparison.questionKeys.map((key) => config.strings.questions?.[key]).filter(Boolean)
    );
    result.focus({ preventScroll: false });
  });

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      setStatus(status, '');
      resetResult();
    });
  });
};

export const initOfferCheckerWorkspace = (config) => {
  if (config?.toolType !== 'offer-checker') return;
  initPriceBookReference(config);
  initOfferChecker(config);
};
