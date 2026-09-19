import { ProductApiClient, ProductApiError } from '../services/api-client.js';
import { formatConsumerCommercialRange } from './commercial-range.js';
import { createCalculatorSession } from './calculator-session.js';

const positive = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const leadText = (value) => (typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '');
const validLeadPhone = (value) => /^[+()\d\s-]{6,32}$/u.test(value) && /\d/u.test(value);

const TARIFF_OPTION_CUSTOM = 'custom';
const TARIFF_PERIODS = Object.freeze(['day', 'night']);

const tariffRecordMatchesConsumption = (record, monthlyKwh) =>
  record?.customerType === 'standard' &&
  Number.isFinite(Number(monthlyKwh)) &&
  Number(monthlyKwh) > 0 &&
  Number(monthlyKwh) >= Number(record.minMonthlyKwh) &&
  (record.maxMonthlyKwh === null || Number(monthlyKwh) <= Number(record.maxMonthlyKwh));

const tariffOptionValue = (record, period) => `${record.id}:${period}`;

const formatTariffRate = (rate, locale) =>
  `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(rate)} AMD/kWh`;

/**
 * Exposes the user-confirmed tariff choices without assigning one implicitly.
 * For known kWh consumption, only the matching standard bracket is suggested;
 * social choices and a manual bill rate remain available as explicit options.
 */
export const buildQuickTariffOptions = ({ records = [], monthlyKwh, copy = {}, locale } = {}) => {
  const activeRecords = Array.isArray(records) ? records.filter((record) => record?.id) : [];
  const suggested = activeRecords.find((record) =>
    tariffRecordMatchesConsumption(record, monthlyKwh)
  );
  const standardRecords = suggested
    ? [suggested]
    : activeRecords.filter((record) => record.customerType === 'standard');
  const socialRecords = activeRecords.filter(
    (record) => record.customerType === 'social-vulnerable'
  );
  const optionRecords = [...standardRecords, ...socialRecords];
  const options = optionRecords.flatMap((record) =>
    TARIFF_PERIODS.map((period) => {
      const rate = period === 'day' ? Number(record.dayRate) : Number(record.nightRate);
      return {
        value: tariffOptionValue(record, period),
        tariffId: record.id,
        period,
        customerType: record.customerType,
        rate,
        suggested: record.id === suggested?.id,
        label: `${copy.tariffOfficial ?? 'Official tariff'} · ${
          copy.tariffCategories?.[record.id] ?? record.id
        } · ${period === 'day' ? (copy.tariffDay ?? 'Daytime') : (copy.tariffNight ?? 'Nighttime')} — ${formatTariffRate(rate, locale)}`
      };
    })
  );
  return { options, suggested };
};

/** Returns a safe API descriptor; official rate values are resolved server-side. */
export const readQuickTariffSelection = ({ value, manualRate, options = [] } = {}) => {
  if (value === TARIFF_OPTION_CUSTOM) {
    const rate = positive(manualRate);
    return rate === null ? null : { rateAmdPerKwh: rate };
  }
  const option = options.find((candidate) => candidate.value === value);
  return option ? { tariffId: option.tariffId, period: option.period } : null;
};

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
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0, ...options }).format(Number(value))
    : '—';

const createIcon = (name) => {
  const iconName = { bolt: 'zap', coin: 'calculator', panel: 'chart-bars' }[name] ?? name;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('inline-icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `/icons.svg#${iconName}`);
  svg.append(use);
  return svg;
};

const metric = (label, value, { icon: iconName = 'sun', tone = 'sky' } = {}) => {
  const wrap = document.createElement('div');
  wrap.className = `quick-result__metric quick-result__metric--${tone}`;
  const symbol = document.createElement('span');
  symbol.className = 'quick-result__metric-icon';
  symbol.setAttribute('aria-hidden', 'true');
  symbol.append(createIcon(iconName));
  const content = document.createElement('div');
  const term = document.createElement('dt');
  term.textContent = label;
  const description = document.createElement('dd');
  description.textContent = value;
  content.append(description, term);
  wrap.append(symbol, content);
  return wrap;
};

const monthlyProductionChart = ({ production, months, label, locale }) => {
  const values = Array.isArray(production) ? production.slice(0, 12).map(finite) : [];
  if (values.length !== 12 || values.some((value) => value === null || value < 0)) return null;
  const peak = Math.max(...values);
  if (peak <= 0) return null;

  const chart = document.createElement('figure');
  chart.className = 'quick-production';
  const heading = document.createElement('div');
  heading.className = 'quick-production__heading';
  const caption = document.createElement('figcaption');
  caption.textContent = label;
  const unit = document.createElement('span');
  unit.className = 'quick-production__unit';
  unit.textContent = 'kWh';
  const bars = document.createElement('div');
  bars.className = 'quick-production__bars';
  bars.setAttribute('role', 'list');

  values.forEach((value, index) => {
    const month = months[index] ?? {};
    const item = document.createElement('div');
    item.className = 'quick-production__item';
    item.setAttribute('role', 'listitem');
    item.title = `${month.name ?? month.short ?? index + 1}: ${format(value, locale)} kWh`;
    const bar = document.createElement('span');
    bar.className = 'quick-production__bar';
    bar.style.setProperty('--production-height', `${Math.max(6, (value / peak) * 100)}%`);
    bar.setAttribute('aria-hidden', 'true');
    const monthLabel = document.createElement('span');
    monthLabel.className = 'quick-production__month';
    monthLabel.textContent = month.short ?? String(index + 1);
    item.append(bar, monthLabel);
    bars.append(item);
  });

  heading.append(caption, unit);
  chart.append(heading, bars);
  return chart;
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
  const months = config.product?.passport?.months ?? [];
  const session = createCalculatorSession();
  const api = new ProductApiClient({ endpoints: config.endpoints ?? {} });
  const form = root.querySelector('[data-quick-form]');
  const region = root.querySelector('[data-quick-region]');
  const bill = root.querySelector('[data-quick-bill]');
  const usage = root.querySelector('[data-quick-usage]');
  const tariff = root.querySelector('[data-quick-tariff]');
  const tariffSelect = root.querySelector('[data-quick-tariff-select]');
  const billWrap = root.querySelector('[data-quick-bill-wrap]');
  const usageWrap = root.querySelector('[data-quick-usage-wrap]');
  const tariffWrap = root.querySelector('[data-quick-tariff-wrap]');
  const customTariffWrap = root.querySelector('[data-quick-custom-tariff-wrap]');
  const tariffLabel = root.querySelector('[data-quick-tariff-label]');
  const tariffHelp = root.querySelector('[data-quick-tariff-help]');
  const tariffSuggestion = root.querySelector('[data-quick-tariff-suggestion]');
  const submit = root.querySelector('[data-quick-submit]');
  const status = root.querySelector('[data-quick-status]');
  const result = root.querySelector('[data-quick-result]');
  const resultLoading = root.querySelector('[data-quick-result-loading]');
  const resultContent = root.querySelector('[data-quick-result-content]');
  const resultTitle = root.querySelector('#quick-result-title');
  const resultCopy = root.querySelector('[data-quick-result-copy]');
  const resultValues = root.querySelector('[data-quick-result-values]');
  const resultActions = root.querySelector('[data-quick-result-actions]');
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
  const setResultState = (state) => {
    const loading = state === 'loading';
    const visible = state === 'complete' || state === 'error';
    resultLoading.hidden = !loading;
    resultContent.hidden = !visible;
    result.setAttribute('aria-busy', String(loading));
  };
  const registryRecords = config.tariffRegistry?.records ?? [];
  let tariffOptions = [];

  const selectedTariff = () =>
    readQuickTariffSelection({
      value: tariffSelect?.value,
      manualRate: tariff?.value,
      options: tariffOptions
    });

  const populateTariffOptions = ({ monthlyKwh, preserveSelection = true } = {}) => {
    if (!tariffSelect) return;
    const previousValue = preserveSelection ? tariffSelect.value : '';
    const previousRegistry = saved.userTariff?.tariffId
      ? `${saved.userTariff.tariffId}:${saved.userTariff.period}`
      : null;
    const { options, suggested } = buildQuickTariffOptions({
      records: registryRecords,
      monthlyKwh,
      copy,
      locale
    });
    tariffOptions = options;
    tariffSelect.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = copy.tariffChoose;
    tariffSelect.append(placeholder);
    for (const option of options) {
      const element = document.createElement('option');
      element.value = option.value;
      element.textContent = option.label;
      tariffSelect.append(element);
    }
    const custom = document.createElement('option');
    custom.value = TARIFF_OPTION_CUSTOM;
    custom.textContent = copy.tariffCustom;
    tariffSelect.append(custom);

    const permitted = new Set([...options.map((option) => option.value), TARIFF_OPTION_CUSTOM]);
    const restored = [
      previousValue,
      previousRegistry,
      saved.userTariff?.rateAmdPerKwh ? TARIFF_OPTION_CUSTOM : ''
    ].find((candidate) => candidate && permitted.has(candidate));
    tariffSelect.value = restored ?? '';
    if (tariffSuggestion) {
      tariffSuggestion.hidden = !suggested;
      tariffSuggestion.textContent = suggested
        ? `${copy.tariffSuggested}: ${copy.tariffCategories?.[suggested.id] ?? suggested.id}.`
        : '';
    }
  };

  const updateMode = ({ preserveSelection = true } = {}) => {
    const billMode = mode() === 'bill';
    billWrap.hidden = !billMode;
    usageWrap.hidden = billMode;
    bill.disabled = !billMode;
    usage.disabled = billMode;
    const consumption = billMode ? positive(bill.value) : positive(usage.value);
    const needsVisibleTariff = consumption !== null;
    populateTariffOptions({
      monthlyKwh: billMode ? null : consumption,
      preserveSelection
    });
    tariffWrap.hidden = !needsVisibleTariff;
    tariffSelect.disabled = !needsVisibleTariff;
    tariffSelect.required = billMode && needsVisibleTariff;
    tariffSelect.setAttribute('aria-required', String(billMode && needsVisibleTariff));
    const custom = tariffSelect.value === TARIFF_OPTION_CUSTOM;
    customTariffWrap.hidden = !custom;
    tariff.disabled = !custom;
    tariff.required = billMode && custom;
    tariff.setAttribute('aria-required', String(billMode && custom));
    tariffLabel.textContent = copy.tariffLabel;
    tariffHelp.textContent = billMode ? copy.tariffHelpBill : copy.tariffHelpUsage;
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
    resultValues.replaceChildren();
    resultTitle.textContent = copy.resultsTitle ?? copy.waiting;
    resultCopy.textContent = copy.waiting;
    setResultState('loading');
    if (leadDialog?.open) leadDialog.close();
  };
  const input = () => {
    const selectedRegion = region.value;
    const currentMode = mode();
    const tariffSelection = selectedTariff();
    if (!selectedRegion) return { valid: false, field: region };
    if (currentMode === 'bill') {
      const value = positive(bill.value);
      if (!value || !tariffSelection) {
        return {
          valid: false,
          field: !value ? bill : tariffSelect.value === TARIFF_OPTION_CUSTOM ? tariff : tariffSelect
        };
      }
      return {
        valid: true,
        payload: {
          regionId: selectedRegion,
          consumption: { averageMonthlyBillAmd: value },
          tariff: tariffSelection
        },
        state: {
          regionId: selectedRegion,
          consumption: { mode: 'bill', averageMonthlyBillAmd: value },
          userTariff: tariffSelection
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
        ...(tariffSelection ? { tariff: tariffSelection } : {})
      },
      state: {
        regionId: selectedRegion,
        consumption: { mode: 'usage', averageMonthlyKwh: value },
        userTariff: tariffSelection
      }
    };
  };
  const render = (analysis) => {
    const scenario = analysis?.selectedScenario;
    if (!scenario) return;
    const estimate = analysis.commercialEstimate;
    const values = document.createElement('dl');
    values.className = 'quick-result__metrics';
    const environmental = analysis.environmental ?? {};
    const avoidedCo2Tons = finite(environmental.avoidedCo2Tons);
    const treeEquivalent = finite(environmental.treeEquivalent);
    const annualSavingsAmd = finite(scenario.financial?.annualSavingsAmd);
    const budgetRange = formatConsumerCommercialRange(estimate, locale);
    const summaryMetrics = [
      metric(copy.generation, `${format(scenario.generation?.annualKwh, locale)} kWh`, {
        icon: 'sun',
        tone: 'sun'
      }),
      avoidedCo2Tons !== null
        ? metric(
            copy.co2,
            `${format(avoidedCo2Tons, locale, { maximumFractionDigits: 1 })} t/year`,
            {
              icon: 'leaf',
              tone: 'green'
            }
          )
        : metric(
            copy.capacity,
            `${format(scenario.system?.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp`,
            { icon: 'bolt', tone: 'sky' }
          ),
      treeEquivalent !== null
        ? metric(copy.trees, format(treeEquivalent, locale), { icon: 'tree', tone: 'green' })
        : metric(copy.panels, format(scenario.system?.panelCount, locale), {
            icon: 'panel',
            tone: 'sky'
          })
    ];
    if (annualSavingsAmd !== null) {
      summaryMetrics.push(
        metric(copy.savings, `${format(annualSavingsAmd, locale)} ֏`, {
          icon: 'coin',
          tone: 'gold'
        })
      );
    } else if (budgetRange) {
      summaryMetrics.push(metric(copy.budget, budgetRange, { icon: 'coin', tone: 'gold' }));
    }
    values.append(...summaryMetrics);
    if (estimate?.reason === 'PRICEBOOK_EXPIRED' || estimate?.reason === 'PRICEBOOK_UNAVAILABLE') {
      const note = document.createElement('p');
      note.className = 'input-help';
      note.textContent = copy.priceUnavailable;
      values.append(note);
    }
    if (annualSavingsAmd === null) {
      const note = document.createElement('p');
      note.className = 'input-help';
      note.textContent = copy.noTariff;
      values.append(note);
    }
    const chart = monthlyProductionChart({
      production: scenario.generation?.monthlyKwh,
      months,
      label: copy.monthlyProduction,
      locale
    });
    resultTitle.textContent = copy.resultsTitle ?? copy.regional;
    resultCopy.textContent = copy.resultsCopy ?? copy.regionalCopy;
    resultValues.replaceChildren(values, ...(chart ? [chart] : []));
    resultValues.hidden = false;
    resultActions.hidden = false;
    setResultState('complete');
  };

  root.querySelectorAll('input[name="quick-consumption-mode"]').forEach((control) =>
    control.addEventListener('change', () => {
      updateMode();
      clearAnalysis();
    })
  );
  [region, bill, usage, tariff, tariffSelect].forEach((control) =>
    control.addEventListener('input', () => {
      control.removeAttribute('aria-invalid');
      clearAnalysis();
    })
  );
  [bill, usage].forEach((control) => control.addEventListener('input', () => updateMode()));
  tariffSelect.addEventListener('change', () => {
    tariffSelect.removeAttribute('aria-invalid');
    updateMode();
    clearAnalysis();
  });
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
    resultValues.hidden = true;
    resultActions.hidden = true;
    resultValues.replaceChildren();
    setResultState('loading');
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
      setResultState('error');
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
