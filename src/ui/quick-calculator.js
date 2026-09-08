import { ProductApiClient, ProductApiError } from '../services/api-client.js';
import { formatConsumerCommercialRange } from './commercial-range.js';
import { createCalculatorSession } from './calculator-session.js';

const positive = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const leadText = (value) => (typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '');
const validLeadPhone = (value) => /^[+()\d\s-]{6,32}$/u.test(value) && /\d/u.test(value);

export const validateQuickLeadForm = ({ name, phone, message } = {}) => {
  const normalized = {
    name: leadText(name),
    phone: leadText(phone),
    message: leadText(message)
  };
  if (normalized.name.length < 2 || normalized.name.length > 100) {
    return { valid: false, field: 'name', values: normalized };
  }
  if (!validLeadPhone(normalized.phone)) {
    return { valid: false, field: 'phone', values: normalized };
  }
  if (normalized.message.length > 2_000) {
    return { valid: false, field: 'message', values: normalized };
  }
  return { valid: true, field: null, values: normalized };
};

const finite = (value) => {
  if (value === null || value === undefined || value === '') return null;
  return Number.isFinite(Number(value)) ? Number(value) : null;
};

/**
 * The lead handoff is intentionally a small summary, not a copy of the whole
 * calculator session. In particular, it excludes address, coordinates, roof
 * geometry, tariff and uploaded-file data.
 */
export const buildQuickLeadContext = ({ analysis, state, locale } = {}) => {
  const scenario = analysis?.selectedScenario;
  const estimate = analysis?.commercialEstimate;
  const consumption = state?.consumption ?? {};
  const p25 = finite(estimate?.available ? estimate.rangeAmd?.p25 : null);
  const p50 = finite(estimate?.available ? estimate.rangeAmd?.p50 : null);
  const p75 = finite(estimate?.available ? estimate.rangeAmd?.p75 : null);
  const budgetRangeAmd =
    p25 !== null && p50 !== null && p75 !== null && p25 <= p50 && p50 <= p75
      ? { p25, p50, p75 }
      : null;
  const source = analysis?.production?.source?.provider ?? analysis?.production?.source?.kind;

  return {
    locale,
    region: analysis?.regionalBenchmark?.id ?? state?.regionId ?? null,
    consumption: {
      mode: consumption.mode ?? null,
      averageMonthlyBillAmd: finite(consumption.averageMonthlyBillAmd),
      averageMonthlyKwh: finite(consumption.averageMonthlyKwh),
      annualKwh: finite(analysis?.consumption?.annualKwh)
    },
    selectedScenario: scenario?.id ?? null,
    capacityKwp: finite(scenario?.system?.capacityKwp),
    annualGenerationKwh: finite(scenario?.generation?.annualKwh),
    budgetRangeAmd,
    source: typeof source === 'string' ? source : null,
    scope: typeof analysis?.scope === 'string' ? analysis.scope : null
  };
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
    if (error.code === 'PVGIS_CACHE_NOT_CONFIGURED') return copy.cacheNotConfigured;
    if (error.code === 'PVGIS_NOT_CONFIGURED') return copy.providerNotConfigured;
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
  const leadOpen = root.querySelector('[data-quick-lead-open]');
  const leadDialog = root.querySelector('[data-quick-lead-dialog]');
  const leadForm = root.querySelector('[data-quick-lead-form]');
  const leadName = root.querySelector('[data-quick-lead-name]');
  const leadPhone = root.querySelector('[data-quick-lead-phone]');
  const leadMessage = root.querySelector('[data-quick-lead-message]');
  const leadSubmit = root.querySelector('[data-quick-lead-submit]');
  const leadStatus = root.querySelector('[data-quick-lead-status]');
  const leadSuccess = root.querySelector('[data-quick-lead-success]');
  let request = null;
  let leadRequest = null;
  let leadTrigger = null;
  let leadComplete = false;

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
  const setLeadStatus = (message, invalid = false) => {
    if (!leadStatus) return;
    leadStatus.textContent = message ?? '';
    leadStatus.classList.toggle('is-error', invalid);
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
    if (leadDialog?.open) leadDialog.close();
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
    } else if (
      estimate?.reason === 'PRICEBOOK_EXPIRED' ||
      estimate?.reason === 'PRICEBOOK_UNAVAILABLE'
    ) {
      const note = document.createElement('p');
      note.className = 'input-help';
      note.textContent = copy.priceUnavailable;
      values.append(note);
    }
    const annualSavingsAmd = finite(scenario.financial?.annualSavingsAmd);
    const paybackYears = finite(scenario.financial?.paybackYears);
    if (annualSavingsAmd !== null) {
      values.append(metric(copy.savings, `${format(annualSavingsAmd, locale)} ֏`));
      if (paybackYears !== null) {
        values.append(
          metric(copy.payback, `≈ ${format(paybackYears, locale, { maximumFractionDigits: 1 })}`)
        );
      }
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

  const resetLeadDialog = () => {
    leadRequest?.abort();
    leadRequest = null;
    leadComplete = false;
    leadForm?.reset();
    leadForm?.removeAttribute('aria-busy');
    if (leadSubmit) leadSubmit.disabled = false;
    if (leadSuccess) leadSuccess.hidden = true;
    if (leadForm) leadForm.hidden = false;
    setLeadStatus('');
    [leadName, leadPhone, leadMessage].forEach((field) => field?.removeAttribute('aria-invalid'));
  };

  const closeLeadDialog = () => {
    if (leadDialog?.open) leadDialog.close();
  };

  leadOpen?.addEventListener('click', () => {
    const snapshot = session.read();
    const analysis = snapshot.quickAnalysis ?? snapshot.analysis;
    if (!analysis || typeof leadDialog?.showModal !== 'function') return;
    leadTrigger = leadOpen;
    resetLeadDialog();
    leadDialog.showModal();
    leadName?.focus();
  });

  leadDialog
    ?.querySelectorAll('[data-quick-lead-close]')
    .forEach((control) => control.addEventListener('click', closeLeadDialog));

  leadDialog?.addEventListener('close', () => {
    const trigger = leadTrigger;
    resetLeadDialog();
    leadTrigger = null;
    trigger?.focus?.();
  });

  leadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (leadRequest || leadComplete) return;
    const validated = validateQuickLeadForm({
      name: leadName?.value,
      phone: leadPhone?.value,
      message: leadMessage?.value
    });
    if (!validated.valid) {
      const field = { name: leadName, phone: leadPhone, message: leadMessage }[validated.field];
      field?.setAttribute('aria-invalid', 'true');
      field?.focus();
      setLeadStatus(copy.lead?.invalid, true);
      return;
    }

    const snapshot = session.read();
    const analysis = snapshot.quickAnalysis ?? snapshot.analysis;
    if (!analysis) {
      setLeadStatus(copy.lead?.unavailable, true);
      return;
    }

    leadRequest = new AbortController();
    leadSubmit.disabled = true;
    leadForm.setAttribute('aria-busy', 'true');
    setLeadStatus(copy.lead?.loading);
    try {
      await api.submitLead(
        {
          ...validated.values,
          locale: config.locale,
          calculatorContext: buildQuickLeadContext({
            analysis,
            state: snapshot,
            locale: config.locale
          })
        },
        { signal: leadRequest.signal }
      );
      if (leadRequest.signal.aborted) return;
      leadComplete = true;
      leadForm.hidden = true;
      leadSuccess.hidden = false;
      setLeadStatus(copy.lead?.success);
    } catch (error) {
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      setLeadStatus(copy.lead?.unavailable, true);
    } finally {
      if (!leadComplete) leadSubmit.disabled = false;
      leadForm.removeAttribute('aria-busy');
      leadRequest = null;
    }
  });

  updateMode();
  const savedQuickAnalysis = saved.quickAnalysis ?? saved.analysis;
  if (savedQuickAnalysis?.scope === 'regional-preliminary') render(savedQuickAnalysis);
  return { session, clearAnalysis };
};
