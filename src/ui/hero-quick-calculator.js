import { ProductApiClient } from '../services/api-client.js';
import { getCalculatorInputNumber } from '../domain/calculator-inputs.js';
import {
  FINANCIAL_RATE_MODES,
  resolveFinancialRateSource,
  toFinancialRateRequest
} from '../domain/financial-rate.js';
import { createCalculatorSession } from './calculator-session.js';
import { createQuickAnalysisIdentity } from './quick-analysis-identity.js';

const textInput = (value) =>
  typeof value === 'string' ? value.trim() : String(value ?? '').trim();

/**
 * Translates the intentionally small Hero form into the same server contract
 * used by Quick Calculator. The standard residential tariff remains the
 * honest default; the optional field is an observed effective rate only.
 */
export const buildHeroQuickAnalysisRequest = ({
  regionId,
  averageMonthlyKwh,
  effectiveRateAmdPerKwh
} = {}) => {
  const region = textInput(regionId);
  const usage = getCalculatorInputNumber(averageMonthlyKwh, 'averageMonthlyConsumptionKwh');
  if (!region || usage === null) return { valid: false, issue: 'consumption' };

  const rawTariff = textInput(effectiveRateAmdPerKwh);
  const tariff =
    rawTariff === '' ? null : getCalculatorInputNumber(rawTariff, 'customTariffAmdPerKwh');
  if (rawTariff !== '' && tariff === null) return { valid: false, issue: 'tariff' };

  const consumption = { mode: 'usage', averageMonthlyKwh: usage };
  const financialRate = resolveFinancialRateSource({
    mode: tariff === null ? FINANCIAL_RATE_MODES.STANDARD : FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE,
    consumption,
    effectiveRateAmdPerKwh: tariff
  });

  return {
    valid: true,
    payload: {
      regionId: region,
      consumption: { averageMonthlyKwh: usage },
      financialRate: toFinancialRateRequest(financialRate, consumption)
    },
    state: { regionId: region, consumption, financialRate }
  };
};

const setHidden = (element, value) => {
  if (element) element.hidden = value;
};

/**
 * The Hero is deliberately a compact entry point rather than a second full
 * calculator. It calls /api/quick-analysis, then hands the response to the
 * shared session so the full Quick and Professional flows can continue from
 * the exact same result.
 */
export const initHeroQuickCalculator = ({ config = {} } = {}) => {
  const root = document.querySelector('[data-hero-quick-calculator]');
  if (!root) return () => {};

  const copy = config.hero?.quickCalculator ?? {};
  const api = new ProductApiClient({ endpoints: config.endpoints ?? {} });
  const session = createCalculatorSession();
  const formPanel = root.querySelector('[data-hero-quick-form-panel]');
  const resultPanel = root.querySelector('[data-hero-quick-result]');
  const form = root.querySelector('[data-hero-quick-form]');
  const region = root.querySelector('[data-hero-quick-region]');
  const consumption = root.querySelector('[data-hero-quick-consumption]');
  const tariff = root.querySelector('[data-hero-quick-tariff]');
  const submit = root.querySelector('[data-hero-quick-submit]');
  const submitLabel = root.querySelector('[data-hero-quick-submit-label]');
  const status = root.querySelector('[data-hero-quick-status]');
  const edit = root.querySelector('[data-hero-quick-edit]');
  let controller = null;

  const setStatus = (message = '', invalid = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-error', invalid);
  };

  const setView = (mode) => {
    const loading = mode === 'loading';
    root.dataset.dashboardMode = mode;
    root.setAttribute('aria-busy', String(loading));
    setHidden(formPanel, mode !== 'input');
    setHidden(resultPanel, mode === 'input');
    if (submit) submit.disabled = loading;
    if (submitLabel) submitLabel.textContent = loading ? copy.calculating : copy.submit;
  };

  const populate = (state) => {
    if (region && state.regionId) region.value = state.regionId;
    if (consumption && state.consumption?.mode === 'usage') {
      consumption.value = state.consumption.averageMonthlyKwh ?? '';
    }
    if (
      tariff &&
      state.financialRate?.mode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE &&
      state.financialRate.effectiveRateAmdPerKwh !== undefined
    ) {
      tariff.value = state.financialRate.effectiveRateAmdPerKwh;
    }
  };

  const initial = session.read();
  populate(initial);
  const active = initial.professionalAnalysis
    ? { analysis: initial.professionalAnalysis, status: initial.professionalAnalysisStatus }
    : { analysis: initial.quickAnalysis, status: initial.quickAnalysisStatus };
  setView(
    active.analysis || active.status === 'loading'
      ? active.status === 'loading'
        ? 'loading'
        : 'analysis'
      : 'input'
  );

  const clearFieldState = () => {
    setStatus();
    consumption?.removeAttribute('aria-invalid');
    tariff?.removeAttribute('aria-invalid');
  };

  const showForm = () => {
    controller?.abort();
    controller = null;
    setView('input');
    setStatus();
    window.requestAnimationFrame(() => consumption?.focus());
  };

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = buildHeroQuickAnalysisRequest({
      regionId: region?.value,
      averageMonthlyKwh: consumption?.value,
      effectiveRateAmdPerKwh: tariff?.value
    });
    clearFieldState();
    if (!input.valid) {
      const target = input.issue === 'tariff' ? tariff : consumption;
      target?.setAttribute('aria-invalid', 'true');
      setStatus(input.issue === 'tariff' ? copy.invalidTariff : copy.invalid, true);
      target?.focus();
      return;
    }

    controller?.abort();
    controller = new AbortController();
    const activeController = controller;
    setView('loading');
    session.write({
      ...input.state,
      quickAnalysis: null,
      quickAnalysisStatus: 'loading',
      quickAnalysisIdentity: null,
      professionalAnalysis: null,
      professionalAnalysisStatus: 'idle',
      professionalAnalysisIdentity: null,
      professionalSolarPassport: null
    });

    try {
      const response = await api.quickAnalyze(input.payload, { signal: activeController.signal });
      if (controller !== activeController) return;
      const analysis = response?.analysis;
      if (!analysis) throw new Error('MALFORMED_RESPONSE');
      const identity = createQuickAnalysisIdentity(input.state);
      session.write({
        ...input.state,
        quickAnalysis: analysis,
        quickAnalysisStatus: 'complete',
        quickAnalysisIdentity: identity
      });
      setView('analysis');
    } catch {
      if (activeController.signal.aborted) return;
      session.write({
        ...input.state,
        quickAnalysis: null,
        quickAnalysisStatus: 'unavailable',
        quickAnalysisIdentity: null
      });
      setView('input');
      setStatus(copy.unavailable, true);
    } finally {
      if (controller === activeController) controller = null;
    }
  });

  [region, consumption, tariff]
    .filter(Boolean)
    .forEach((field) => field.addEventListener('input', clearFieldState));
  edit?.addEventListener('click', showForm);

  return () => {
    controller?.abort();
  };
};
