import { createCalculatorSession } from './calculator-session.js';

const finite = (value) => {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const meaningfulAddress = (value) =>
  typeof value === 'string' && value.trim().length >= 3 ? value.trim() : null;

/**
 * Presentation data for the home Hero. It deliberately reads completed
 * SolarAnalysis values only: it does not size a system, estimate savings or
 * manufacture a PVGIS/environmental fallback.
 */
export const buildHeroAnalysisPresentation = (analysis, { status = 'idle' } = {}) => {
  const scenario = analysis?.selectedScenario ?? null;
  const annualGenerationKwh = finite(scenario?.generation?.annualKwh);
  const monthlyCandidate = scenario?.generation?.monthlyKwh;
  const monthlyGenerationKwh =
    Array.isArray(monthlyCandidate) &&
    monthlyCandidate.length === 12 &&
    monthlyCandidate.every((value) => finite(value) !== null && finite(value) >= 0)
      ? monthlyCandidate.map(Number)
      : null;
  const rawCoveragePercent = finite(scenario?.coveragePercent);
  const annualSavingsAmd = finite(scenario?.financial?.annualSavingsAmd);
  const avoidedCo2Tons = finite(analysis?.environmental?.avoidedCo2Tons);
  const property = analysis?.property ?? null;
  const locationKind =
    property?.confirmed && meaningfulAddress(property.address)
      ? 'address'
      : property?.confirmed
        ? 'selected'
        : analysis?.scope === 'regional-preliminary'
          ? 'regional'
          : 'pending';

  return {
    loading: status === 'loading',
    ready: annualGenerationKwh !== null,
    locationKind,
    location: locationKind === 'address' ? meaningfulAddress(property.address) : null,
    annualGenerationKwh,
    monthlyGenerationKwh,
    // The underlying analysis preserves any generation surplus. The Hero is a
    // consumer-facing coverage label, so its display is capped at 100% only.
    coveragePercent:
      rawCoveragePercent === null ? null : Math.min(Math.max(rawCoveragePercent, 0), 100),
    annualSavingsAmd: annualSavingsAmd !== null && annualSavingsAmd > 0 ? annualSavingsAmd : null,
    avoidedCo2Tons: avoidedCo2Tons !== null && avoidedCo2Tons >= 0 ? avoidedCo2Tons : null
  };
};

const formatNumber = (value, locale, options = {}) =>
  new Intl.NumberFormat(locale, options).format(value);

const text = (root, selector, value) => {
  const target = root.querySelector(selector);
  if (target) target.textContent = value;
  return target;
};

const counter = (target, value, { decimals = 0 } = {}) => {
  if (!target) return;
  if (value === null) {
    target.removeAttribute('data-hero-countup');
    target.removeAttribute('data-hero-countup-value');
    target.removeAttribute('data-hero-countup-decimals');
    return;
  }
  target.setAttribute('data-hero-countup', '');
  target.dataset.heroCountupValue = String(value);
  target.dataset.heroCountupDecimals = String(decimals);
};

const renderMetric = ({
  root,
  valueSelector,
  unitSelector,
  value,
  fallback,
  locale,
  decimals = 0
}) => {
  const output = root.querySelector(valueSelector);
  const unitOutput = root.querySelector(unitSelector);
  const available = value !== null;
  if (output) {
    output.textContent = available
      ? formatNumber(value, locale, {
          maximumFractionDigits: decimals,
          minimumFractionDigits: decimals
        })
      : fallback;
    counter(output, available ? value : null, { decimals });
  }
  if (unitOutput) unitOutput.hidden = !available;
  return available;
};

const hidden = (root, selector, value) => {
  const target = root.querySelector(selector);
  if (target) target.hidden = value;
  return target;
};

const renderExampleFact = ({ root, selector, valueSelector, value, locale, decimals = 0 }) => {
  const output = root.querySelector(valueSelector);
  if (!output || value === null) {
    hidden(root, selector, true);
    return;
  }
  output.textContent = formatNumber(value, locale, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
  counter(output, value, { decimals });
  hidden(root, selector, false);
};

const renderBars = (root, monthlyGenerationKwh) => {
  const chart = root.querySelector('[data-hero-analysis-bars]');
  if (!chart) return;
  const maximum = monthlyGenerationKwh ? Math.max(...monthlyGenerationKwh) : 0;
  const available = maximum > 0;
  chart.hidden = !available;
  if (!available) return;
  [...chart.querySelectorAll('i')].forEach((bar, index) => {
    const value = monthlyGenerationKwh[index] ?? 0;
    bar.style.setProperty('--hero-bar-height', `${Math.max((value / maximum) * 100, 5)}%`);
  });
};

const locationLabel = (presentation, copy) => {
  if (presentation.locationKind === 'address') return presentation.location;
  if (presentation.locationKind === 'selected') return copy.dashboardLocationSelected;
  if (presentation.locationKind === 'regional') return copy.dashboardLocationRegional;
  return copy.dashboardLocationSelected;
};

const renderExampleCard = ({ root, copy, locale }) => {
  const example = copy.dashboardExample;
  if (!example) return null;
  root.dataset.dashboardMode = 'example';
  root.dataset.co2Available = 'false';
  text(root, '[data-hero-analysis-location]', example.location);
  text(root, '[data-hero-analysis-status]', example.status);
  text(root, '[data-hero-analysis-label]', example.label);
  text(root, '[data-hero-analysis-note]', example.note);
  renderMetric({
    root,
    valueSelector: '[data-hero-analysis-generation]',
    unitSelector: '[data-hero-analysis-generation-unit]',
    value: finite(example.annualGenerationKwh),
    fallback: '—',
    locale
  });
  renderBars(root, example.monthlyGenerationKwh);
  renderExampleFact({
    root,
    selector: '[data-hero-example-co2]',
    valueSelector: '[data-hero-example-co2-value]',
    value: finite(example.co2Tons),
    locale,
    decimals: 1
  });
  renderExampleFact({
    root,
    selector: '[data-hero-example-trees]',
    valueSelector: '[data-hero-example-trees-value]',
    value: finite(example.trees),
    locale
  });
  hidden(root, '[data-hero-analysis-coverage]', true);
  hidden(root, '[data-hero-analysis-savings]', true);
  hidden(root, '[data-hero-analysis-co2]', true);
  return { mode: 'example', ...example };
};

/** Updates existing semantic Hero markup from a SolarAnalysis snapshot. */
export const renderHeroAnalysisCard = ({
  root,
  analysis,
  status = 'idle',
  copy = {},
  locale = 'en-US'
}) => {
  if (!analysis && status !== 'loading') return renderExampleCard({ root, copy, locale });
  const presentation = buildHeroAnalysisPresentation(analysis, { status });
  const ready = presentation.ready;
  root.dataset.dashboardMode = presentation.loading ? 'loading' : 'analysis';
  root.dataset.co2Available = String(presentation.avoidedCo2Tons !== null);
  text(root, '[data-hero-analysis-location]', locationLabel(presentation, copy));
  text(
    root,
    '[data-hero-analysis-status]',
    ready ? copy.dashboardStatusPreliminary : copy.dashboardLoading
  );
  text(root, '[data-hero-analysis-label]', ready ? copy.dashboardReady : copy.dashboardLoading);
  text(
    root,
    '[data-hero-analysis-note]',
    ready ? copy.dashboardNotePreliminary : copy.dashboardLoading
  );

  renderMetric({
    root,
    valueSelector: '[data-hero-analysis-generation]',
    unitSelector: '[data-hero-analysis-generation-unit]',
    value: presentation.annualGenerationKwh,
    fallback: presentation.loading ? copy.dashboardLoading : '—',
    locale
  });
  renderMetric({
    root,
    valueSelector: '[data-hero-analysis-coverage-value]',
    unitSelector: '[data-hero-analysis-coverage-unit]',
    value: presentation.coveragePercent,
    fallback: copy.dashboardNeedConsumption,
    locale
  });
  renderMetric({
    root,
    valueSelector: '[data-hero-analysis-savings-value]',
    unitSelector: '[data-hero-analysis-savings-unit]',
    value: presentation.annualSavingsAmd,
    fallback: copy.dashboardNeedTariff,
    locale
  });

  const co2 = root.querySelector('[data-hero-analysis-co2]');
  if (co2) {
    co2.hidden = presentation.avoidedCo2Tons === null;
    const value = root.querySelector('[data-hero-analysis-co2-value]');
    if (value && presentation.avoidedCo2Tons !== null) {
      value.textContent = formatNumber(presentation.avoidedCo2Tons, locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1
      });
      counter(value, presentation.avoidedCo2Tons, { decimals: 1 });
    }
  }
  hidden(root, '[data-hero-example-co2]', true);
  hidden(root, '[data-hero-example-trees]', true);
  hidden(root, '[data-hero-analysis-coverage]', false);
  hidden(root, '[data-hero-analysis-savings]', false);
  renderBars(root, presentation.monthlyGenerationKwh);
  return presentation;
};

/**
 * The homepage is a separate static route, so it reads the same session
 * snapshot created by Quick, Roof Refinement and Professional Calculator.
 * The event listener is useful for embedded/home contexts and never performs
 * a network request or a new calculation.
 */
export const initHeroAnalysisCard = ({ hero, copy, locale, onRender = () => {} } = {}) => {
  const root = hero?.querySelector?.('[data-hero-dashboard]');
  if (!root) return () => {};
  const session = createCalculatorSession();
  const refresh = ({ analysis, status } = {}) => {
    const snapshot = analysis === undefined ? session.read() : null;
    const presentation = renderHeroAnalysisCard({
      root,
      analysis: analysis ?? snapshot?.analysis ?? snapshot?.quickAnalysis ?? null,
      status: status ?? snapshot?.analysisStatus ?? 'idle',
      copy,
      locale
    });
    onRender(presentation);
  };
  const handleAnalysisUpdate = (event) => refresh(event.detail ?? {});
  refresh();
  window.addEventListener('solar:analysis-updated', handleAnalysisUpdate);
  return () => window.removeEventListener('solar:analysis-updated', handleAnalysisUpdate);
};
