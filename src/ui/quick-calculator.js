import { ProductApiClient, ProductApiError } from '../services/api-client.js';
import { formatConsumerCommercialRange } from './commercial-range.js';
import { createCalculatorSession } from './calculator-session.js';

const positive = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const format = (value, locale, options = {}) =>
  Number.isFinite(Number(value))
    ? new Intl.NumberFormat(locale, options).format(Number(value))
    : '—';

const metric = (label, value) => {
  const wrap = document.createElement('div');
  const term = document.createElement('dt');
  term.textContent = label;
  const description = document.createElement('dd');
  description.textContent = value;
  wrap.append(term, description);
  return wrap;
};

const errorMessage = (error, copy) => {
  if (error instanceof ProductApiError) {
    if (error.code === 'PVGIS_CACHE_NOT_CONFIGURED') return copy.unavailable;
    if (error.code === 'PVGIS_UNAVAILABLE' || error.code === 'PVGIS_TIMEOUT')
      return copy.unavailable;
  }
  return copy.unavailable;
};

export const shouldClearRefinementForRegion = (previousRegionId, nextRegionId) =>
  Boolean(previousRegionId && previousRegionId !== nextRegionId);

/** Consumer entry point. It never imports map tooling or requests PVGIS from
 * the browser; the server turns a selected regional benchmark into one honest
 * early estimate. */
export const initQuickCalculator = ({ config = {} } = {}) => {
  const root = document.querySelector('[data-quick-calculator]');
  if (!root) return null;
  const copy = config.quick ?? {};
  const locale = config.locale ?? 'en-US';
  const session = createCalculatorSession();
  const api = new ProductApiClient({ endpoints: config.endpoints ?? {} });
  const form = root.querySelector('[data-quick-form]');
  const region = root.querySelector('[data-quick-region]');
  const bill = root.querySelector('[data-quick-bill]');
  const usage = root.querySelector('[data-quick-usage]');
  const tariff = root.querySelector('[data-quick-tariff]');
  const billWrap = root.querySelector('[data-quick-bill-wrap]');
  const usageWrap = root.querySelector('[data-quick-usage-wrap]');
  const tariffWrap = root.querySelector('[data-quick-tariff-wrap]');
  const tariffLabel = root.querySelector('[data-quick-tariff-label]');
  const tariffHelp = root.querySelector('[data-quick-tariff-help]');
  const submit = root.querySelector('[data-quick-submit]');
  const status = root.querySelector('[data-quick-status]');
  const resultTitle = root.querySelector('#quick-result-title');
  const resultCopy = root.querySelector('[data-quick-result-copy]');
  const resultValues = root.querySelector('[data-quick-result-values]');
  const resultActions = root.querySelector('[data-quick-result-actions]');
  const resultLinks = root.querySelector('[data-quick-result-links]');
  let request = null;

  const saved = session.read();
  if (saved.regionId) region.value = saved.regionId;
  const savedMode = saved.consumption?.mode;
  if (savedMode === 'usage') {
    root.querySelector('input[name="quick-consumption-mode"][value="usage"]').checked = true;
    usage.value = saved.consumption.averageMonthlyKwh ?? '';
  } else if (savedMode === 'bill') {
    bill.value = saved.consumption.averageMonthlyBillAmd ?? '';
  }
  if (saved.userTariff?.rateAmdPerKwh) tariff.value = saved.userTariff.rateAmdPerKwh;

  const mode = () =>
    root.querySelector('input[name="quick-consumption-mode"]:checked')?.value ?? 'bill';
  const setStatus = (message, invalid = false) => {
    status.textContent = message ?? '';
    status.classList.toggle('is-error', invalid);
  };
  const updateMode = () => {
    const billMode = mode() === 'bill';
    billWrap.hidden = !billMode;
    usageWrap.hidden = billMode;
    bill.disabled = !billMode;
    usage.disabled = billMode;
    const needsVisibleTariff = billMode && positive(bill.value) !== null;
    tariffWrap.hidden = !needsVisibleTariff;
    tariff.disabled = !needsVisibleTariff;
    tariff.required = needsVisibleTariff;
    tariff.setAttribute('aria-required', String(needsVisibleTariff));
    tariffLabel.textContent = copy.tariffLabel;
    tariffHelp.textContent = copy.tariffHelp;
  };
  const clearAnalysis = () => {
    session.write({
      quickAnalysis: null,
      analysis: null,
      analysisStatus: 'idle',
      solarPassport: null
    });
    resultValues.hidden = true;
    resultActions.hidden = true;
    resultLinks.hidden = true;
    resultValues.replaceChildren();
    resultTitle.textContent = copy.waiting;
    resultCopy.textContent = copy.regionalCopy;
  };
  const input = () => {
    const selectedRegion = region.value;
    const currentMode = mode();
    const tariffRate = currentMode === 'bill' ? positive(tariff.value) : null;
    if (!selectedRegion) return { valid: false, field: region };
    if (currentMode === 'bill') {
      const value = positive(bill.value);
      if (!value || !tariffRate) return { valid: false, field: !value ? bill : tariff };
      return {
        valid: true,
        payload: {
          regionId: selectedRegion,
          consumption: { averageMonthlyBillAmd: value },
          tariff: { rateAmdPerKwh: tariffRate }
        },
        state: {
          regionId: selectedRegion,
          consumption: { mode: 'bill', averageMonthlyBillAmd: value },
          userTariff: { rateAmdPerKwh: tariffRate }
        }
      };
    }
    const value = positive(usage.value);
    if (!value) return { valid: false, field: usage };
    return {
      valid: true,
      payload: {
        regionId: selectedRegion,
        consumption: { averageMonthlyKwh: value },
        ...(tariffRate ? { tariff: { rateAmdPerKwh: tariffRate } } : {})
      },
      state: {
        regionId: selectedRegion,
        consumption: { mode: 'usage', averageMonthlyKwh: value },
        userTariff: tariffRate ? { rateAmdPerKwh: tariffRate } : null
      }
    };
  };
  const render = (analysis) => {
    const scenario = analysis?.selectedScenario;
    if (!scenario) return;
    const estimate = analysis.commercialEstimate;
    const values = document.createElement('dl');
    values.className = 'quick-result__metrics';
    values.append(
      metric(
        copy.capacity,
        `${format(scenario.system?.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp`
      ),
      metric(copy.panels, format(scenario.system?.panelCount, locale)),
      metric(copy.generation, `${format(scenario.generation?.annualKwh, locale)} kWh`)
    );
    const budgetRange = formatConsumerCommercialRange(estimate, locale);
    if (budgetRange) {
      values.append(metric(copy.budget, budgetRange));
    }
    if (scenario.financial?.annualSavingsAmd !== null) {
      values.append(
        metric(copy.savings, `${format(scenario.financial.annualSavingsAmd, locale)} ֏`),
        metric(
          copy.payback,
          `≈ ${format(scenario.financial.paybackYears, locale, { maximumFractionDigits: 1 })}`
        )
      );
    } else {
      const note = document.createElement('p');
      note.className = 'input-help';
      note.textContent = copy.noTariff;
      values.append(note);
    }
    resultTitle.textContent = copy.regional;
    resultCopy.textContent = copy.regionalCopy;
    resultValues.replaceChildren(values);
    resultValues.hidden = false;
    resultActions.hidden = false;
    resultLinks.hidden = false;
  };

  root.querySelectorAll('input[name="quick-consumption-mode"]').forEach((control) =>
    control.addEventListener('change', () => {
      updateMode();
      clearAnalysis();
    })
  );
  [region, bill, usage, tariff].forEach((control) =>
    control.addEventListener('input', () => {
      control.removeAttribute('aria-invalid');
      clearAnalysis();
    })
  );
  bill.addEventListener('input', updateMode);
  region.addEventListener('change', clearAnalysis);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const current = input();
    if (!current.valid) {
      current.field?.setAttribute('aria-invalid', 'true');
      current.field?.focus();
      setStatus(copy.waiting, true);
      return;
    }
    request?.abort();
    request = new AbortController();
    const previous = session.read();
    // A different regional benchmark means a previously refined property may
    // no longer belong to the selected starting context. Keep the roof when
    // the homeowner only updates consumption for the same region, but never
    // carry it into a newly selected regional estimate.
    const changedRegion = shouldClearRefinementForRegion(previous.regionId, current.state.regionId);
    session.write({
      ...current.state,
      ...(changedRegion ? { property: null, roof: null, sitePotential: null } : {}),
      quickAnalysis: null,
      analysis: null,
      analysisStatus: 'loading',
      solarPassport: null
    });
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    setStatus(copy.loading);
    try {
      const response = await api.quickAnalyze(current.payload, { signal: request.signal });
      if (request.signal.aborted) return;
      const analysis = response?.analysis;
      if (!analysis) throw new ProductApiError('MALFORMED_RESPONSE');
      session.write({
        ...current.state,
        quickAnalysis: analysis,
        analysis,
        analysisStatus: 'complete',
        solarPassport: null
      });
      render(analysis);
      setStatus('');
    } catch (error) {
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      resultTitle.textContent = copy.unavailable;
      resultCopy.textContent = errorMessage(error, copy);
      resultValues.hidden = true;
      resultActions.hidden = true;
      resultLinks.hidden = true;
      session.write({ analysis: null, quickAnalysis: null, analysisStatus: 'unavailable' });
      setStatus(errorMessage(error, copy), true);
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'button button--outline';
      retry.textContent = copy.retry;
      retry.addEventListener('click', () => form.requestSubmit());
      resultValues.replaceChildren(retry);
      resultValues.hidden = false;
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      request = null;
    }
  });

  updateMode();
  const savedQuickAnalysis = saved.quickAnalysis ?? saved.analysis;
  if (savedQuickAnalysis?.scope === 'regional-preliminary') render(savedQuickAnalysis);
  return { session, clearAnalysis };
};
