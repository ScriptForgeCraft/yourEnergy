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
 * used by Quick Calculator. A bill and its matching kWh reading allow the
 * server to derive the effective rate; either value can also stand alone.
 */
export const buildHeroQuickAnalysisRequest = ({
  regionId,
  averageMonthlyBillAmd,
  billedKwh
} = {}) => {
  const region = textInput(regionId);
  const rawBill = textInput(averageMonthlyBillAmd);
  const rawUsage = textInput(billedKwh);
  const bill = rawBill === '' ? null : getCalculatorInputNumber(rawBill, 'averageMonthlyBillAmd');
  const usage =
    rawUsage === '' ? null : getCalculatorInputNumber(rawUsage, 'averageMonthlyConsumptionKwh');
  if (!region || (bill === null && usage === null)) return { valid: false, issue: 'consumption' };
  if (rawBill !== '' && bill === null) return { valid: false, issue: 'bill' };
  if (rawUsage !== '' && usage === null) return { valid: false, issue: 'consumption' };

  const hasBill = bill !== null;
  const consumption = hasBill
    ? {
        mode: 'bill',
        averageMonthlyBillAmd: bill,
        ...(usage === null ? {} : { billedKwh: usage })
      }
    : { mode: 'usage', averageMonthlyKwh: usage };
  const financialRate = resolveFinancialRateSource({
    mode:
      hasBill && usage !== null ? FINANCIAL_RATE_MODES.BILL_DERIVED : FINANCIAL_RATE_MODES.STANDARD,
    consumption
  });

  return {
    valid: true,
    payload: {
      regionId: region,
      consumption: hasBill
        ? {
            averageMonthlyBillAmd: bill,
            ...(usage === null ? {} : { billedKwh: usage })
          }
        : { averageMonthlyKwh: usage },
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
  const bill = root.querySelector('[data-hero-quick-bill]');
  const consumption = root.querySelector('[data-hero-quick-consumption]');
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
    if (bill) bill.value = state.consumption?.averageMonthlyBillAmd ?? '';
    if (consumption)
      consumption.value =
        state.consumption?.billedKwh ?? state.consumption?.averageMonthlyKwh ?? '';
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
    bill?.removeAttribute('aria-invalid');
    consumption?.removeAttribute('aria-invalid');
  };

  const showForm = () => {
    controller?.abort();
    controller = null;
    setView('input');
    setStatus();
    window.requestAnimationFrame(() => bill?.focus());
  };

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = buildHeroQuickAnalysisRequest({
      regionId: region?.value,
      averageMonthlyBillAmd: bill?.value,
      billedKwh: consumption?.value
    });
    clearFieldState();
    if (!input.valid) {
      const target = input.issue === 'bill' ? bill : consumption;
      target?.setAttribute('aria-invalid', 'true');
      setStatus(input.issue === 'bill' ? copy.invalidBill : copy.invalid, true);
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

  [region, bill, consumption]
    .filter(Boolean)
    .forEach((field) => field.addEventListener('input', clearFieldState));
  edit?.addEventListener('click', showForm);

  return () => {
    controller?.abort();
  };
};
