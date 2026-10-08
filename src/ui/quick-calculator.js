import { ProductApiClient, ProductApiError } from '../services/api-client.js';
import { getCalculatorInputNumber } from '../domain/calculator-inputs.js';
import {
  FINANCIAL_RATE_MODES,
  createDefaultFinancialRate,
  createStandardFinancialRate,
  deriveEffectiveRateFromBill,
  resolveFinancialRateSource,
  toFinancialRateRequest
} from '../domain/financial-rate.js';
import {
  createAutomaticStandardResidentialTariff,
  estimateStandardResidentialConsumptionFromBill
} from '../domain/tariffs.js';
import { formatConsumerCommercialRange } from './commercial-range.js';
import { createAsyncRequestLifecycle } from './async-request-lifecycle.js';
import { createCalculatorSession } from './calculator-session.js';
import { createQuickAnalysisIdentity } from './quick-analysis-identity.js';
import { formatTariffBracket, formatTariffRate } from './tariff-provenance.js';

const monthlyUsage = (value) => getCalculatorInputNumber(value, 'averageMonthlyConsumptionKwh');
const monthlyBill = (value) => getCalculatorInputNumber(value, 'averageMonthlyBillAmd');
const effectiveRate = (value) => getCalculatorInputNumber(value, 'customTariffAmdPerKwh');
const interpolate = (template, values = {}) =>
  String(template ?? '').replace(/\{([a-zA-Z0-9_]+)\}/gu, (_match, key) =>
    values[key] === null || values[key] === undefined ? '' : String(values[key])
  );

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
 * geometry and uploaded-file data. Typed tariff provenance is retained so an
 * engineer can distinguish standard, bill-derived and custom financial inputs.
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
  const tariff = analysis?.financial?.tariff ?? {};

  const sourceType = tariff.sourceType ?? tariff.tariffSource ?? null;
  const billAmd = finite(tariff.billAmd ?? consumption.averageMonthlyBillAmd);
  const billedKwh = finite(tariff.billedKwh ?? consumption.billedKwh);
  const effectiveRateAmdPerKwh = finite(tariff.effectiveRateAmdPerKwh);
  return {
    locale,
    region: analysis?.regionalBenchmark?.id ?? state?.regionId ?? null,
    consumption: {
      mode: consumption.mode ?? null,
      averageMonthlyBillAmd: finite(consumption.averageMonthlyBillAmd),
      averageMonthlyKwh: finite(consumption.averageMonthlyKwh ?? consumption.billedKwh),
      ...(finite(consumption.billedKwh) === null
        ? {}
        : { billedKwh: finite(consumption.billedKwh) }),
      annualKwh: finite(analysis?.consumption?.annualKwh)
    },
    ...(sourceType
      ? {
          financialTariff: {
            sourceType,
            ...(billAmd === null ? {} : { billAmd }),
            ...(billedKwh === null ? {} : { billedKwh }),
            ...(effectiveRateAmdPerKwh === null ? {} : { effectiveRateAmdPerKwh })
          }
        }
      : {}),
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

/**
 * The consumer result intentionally contains only the few homeowner values
 * needed to understand a preliminary regional estimate. Engineering,
 * equipment and provenance data stay in the analysis for Professional mode.
 */
export const buildQuickResultMetrics = ({
  scenario,
  commercialEstimate,
  copy = {},
  locale = 'en-US'
} = {}) => {
  const annualSavingsAmd = finite(scenario?.financial?.annualSavingsAmd);
  const savingsRange = scenario?.financial?.annualSavingsRangeAmd;
  const savingsMinimum = finite(savingsRange?.min);
  const savingsMaximum = finite(savingsRange?.max);
  const systemCost = formatConsumerCommercialRange(
    commercialEstimate ?? scenario?.commercialEstimate,
    locale
  );
  const metrics = [
    {
      id: 'panel-count',
      label: copy.panels ?? 'Panel count',
      value: format(scenario?.system?.panelCount, locale),
      icon: 'panel',
      tone: 'sky'
    },
    {
      id: 'recommended-power',
      label: copy.capacity ?? 'Recommended power',
      value: `${format(scenario?.system?.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp`,
      icon: 'bolt',
      tone: 'sky'
    },
    {
      id: 'expected-production',
      label: copy.generation ?? 'Expected production',
      value: `${format(scenario?.generation?.annualKwh, locale)} ${copy.kwhPerYear ?? 'kWh/year'}`,
      icon: 'sun',
      tone: 'sun'
    },
    {
      id: 'consumption-coverage',
      label: copy.coverage ?? 'Consumption coverage',
      value: `${copy.approximately ?? '≈'} ${format(scenario?.coveragePercent, locale)}%`,
      icon: 'chart-bars',
      tone: 'sky'
    }
  ];

  if (annualSavingsAmd !== null || (savingsMinimum !== null && savingsMaximum !== null)) {
    metrics.push({
      id: 'estimated-annual-savings',
      label: copy.savings ?? 'Estimated annual savings',
      value:
        savingsMinimum !== null && savingsMaximum !== null
          ? `${copy.approximately ?? '≈'} ${format(savingsMinimum, locale)}–${format(savingsMaximum, locale)} ${copy.amdPerYear ?? 'AMD/year'}`
          : `${copy.approximately ?? '≈'} ${format(annualSavingsAmd, locale)} ${copy.amdPerYear ?? 'AMD/year'}`,
      icon: 'coin',
      tone: 'gold'
    });
  }

  if (systemCost) {
    metrics.push({
      id: 'estimated-system-cost',
      label: copy.systemCost ?? 'Estimated system cost',
      value: systemCost,
      icon: 'coin',
      tone: 'gold'
    });
  }

  return {
    metrics,
    savingsAvailable:
      annualSavingsAmd !== null || (savingsMinimum !== null && savingsMaximum !== null),
    systemCostAvailable: systemCost !== null
  };
};

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
  const lifecycle = createAsyncRequestLifecycle();
  const form = root.querySelector('[data-quick-form]');
  const region = root.querySelector('[data-quick-region]');
  const bill = root.querySelector('[data-quick-bill]');
  const billKwh = root.querySelector('[data-quick-bill-kwh]');
  const billKwhWrap = root.querySelector('[data-quick-bill-kwh-wrap]');
  const billKwhToggle = root.querySelector('[data-quick-bill-kwh-toggle]');
  const billKwhPanel = root.querySelector('[data-quick-bill-kwh-panel]');
  const estimatedConsumption = root.querySelector('[data-quick-estimated-consumption]');
  const estimatedConsumptionValue = root.querySelector('[data-quick-estimated-consumption-value]');
  const usage = root.querySelector('[data-quick-usage]');
  const billWrap = root.querySelector('[data-quick-bill-wrap]');
  const usageWrap = root.querySelector('[data-quick-usage-wrap]');
  const submit = root.querySelector('[data-quick-submit]');
  const status = root.querySelector('[data-quick-status]');
  const result = root.querySelector('[data-quick-result]');
  const resultLoading = root.querySelector('[data-quick-result-loading]');
  const resultContent = root.querySelector('[data-quick-result-content]');
  const resultTitle = root.querySelector('#quick-result-title');
  const resultCopy = root.querySelector('[data-quick-result-copy]');
  const resultValues = root.querySelector('[data-quick-result-values]');
  const resultActions = root.querySelector('[data-quick-result-actions]');
  const resultScope = root.querySelector('[data-quick-result-scope]');
  const resultDisclosure = root.querySelector('[data-quick-result-disclosure]');
  const tariffModeInputs = [...root.querySelectorAll('input[name="quick-tariff-mode"]')];
  const tariffName = root.querySelector('[data-quick-tariff-name]');
  const tariffSummary = root.querySelector('[data-quick-tariff-summary]');
  const tariffChange = root.querySelector('[data-quick-tariff-change]');
  const tariffOptions = root.querySelector('[data-quick-tariff-options]');
  const customTariffPanel = root.querySelector('[data-quick-custom-tariff]');
  const effectiveRateInput = root.querySelector('[data-quick-effective-rate]');
  const billDerivedOption = root.querySelector('[data-quick-bill-derived]');
  const billDerivedRateOutput = root.querySelector('[data-quick-bill-derived-rate]');
  const billDerivedHelp = root.querySelector('[data-quick-bill-derived-help]');
  const standardTariffOutput = root.querySelector('[data-quick-standard-tariff]');
  const customComparison = root.querySelector('[data-quick-custom-comparison]');
  const tariffInfoButton = root.querySelector('[data-quick-tariff-info]');
  const tariffPopover = root.querySelector('[data-quick-tariff-popover]');
  const leadOpen = root.querySelector('[data-quick-lead-open]');
  const leadDialog = root.querySelector('[data-quick-lead-dialog]');
  const leadForm = root.querySelector('[data-quick-lead-form]');
  const leadName = root.querySelector('[data-quick-lead-name]');
  const leadPhone = root.querySelector('[data-quick-lead-phone]');
  const leadAttachCalculation = root.querySelector('[data-quick-lead-attach-calculation]');
  const leadMessage = root.querySelector('[data-quick-lead-message]');
  const leadSubmit = root.querySelector('[data-quick-lead-submit]');
  const leadStatus = root.querySelector('[data-quick-lead-status]');
  const leadContent = root.querySelector('[data-quick-lead-content]');
  const leadSuccess = root.querySelector('[data-quick-lead-success]');
  const leadDismiss = root.querySelector('[data-quick-lead-dismiss]');
  let request = null;
  let leadRequest = null;
  let leadTrigger = null;
  let leadComplete = false;

  const saved = session.read();
  const formatRateNumber = (value) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Number(value));
  const formatWholeNumber = (value) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(value));
  if (saved.regionId) region.value = saved.regionId;
  let restoredFinancialRate = saved.financialRate ?? createStandardFinancialRate();
  const savedMode = saved.consumption?.mode;
  if (savedMode === 'usage') {
    root.querySelector('input[name="quick-consumption-mode"][value="usage"]').checked = true;
    usage.value = saved.consumption.averageMonthlyKwh ?? '';
  } else if (savedMode === 'bill') {
    bill.value = saved.consumption.averageMonthlyBillAmd ?? '';
    if (saved.consumption.billedKwh) {
      billKwh.value = saved.consumption.billedKwh;
      billKwhPanel.hidden = false;
      billKwhToggle.setAttribute('aria-expanded', 'true');
    }
  } else if (savedMode === 'monthly' && Array.isArray(saved.consumption?.monthlyKwh)) {
    root.querySelector('input[name="quick-consumption-mode"][value="usage"]').checked = true;
    usage.value =
      saved.consumption.monthlyKwh.reduce((total, value) => total + Number(value), 0) / 12;
    restoredFinancialRate = createStandardFinancialRate();
    session.write({
      consumption: { mode: 'usage', averageMonthlyKwh: Number(usage.value) },
      financialRate: restoredFinancialRate
    });
  }
  if (restoredFinancialRate.mode === FINANCIAL_RATE_MODES.ACTUAL_DAY_NIGHT) {
    restoredFinancialRate = createStandardFinancialRate();
    session.write({ financialRate: restoredFinancialRate });
  }
  if (restoredFinancialRate.mode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE && effectiveRateInput) {
    effectiveRateInput.value = formatRateNumber(restoredFinancialRate.effectiveRateAmdPerKwh);
  }
  const mode = () =>
    root.querySelector('input[name="quick-consumption-mode"]:checked')?.value ?? 'bill';
  const tariffMode = () =>
    tariffModeInputs.find((input) => input.checked)?.value ?? FINANCIAL_RATE_MODES.STANDARD;
  const selectTariffMode = (nextMode) => {
    const target = tariffModeInputs.find((input) => input.value === nextMode);
    const standard = tariffModeInputs.find(
      (input) => input.value === FINANCIAL_RATE_MODES.STANDARD
    );
    if (target) target.checked = true;
    else if (standard) standard.checked = true;
  };
  let financialSelectionExplicit =
    restoredFinancialRate.mode !== FINANCIAL_RATE_MODES.STANDARD ||
    restoredFinancialRate.explicit === true;
  const setStatus = (message, invalid = false) => {
    status.textContent = message ?? '';
    status.classList.toggle('is-error', invalid);
  };
  const setLeadStatus = (message, invalid = false) => {
    if (!leadStatus) return;
    leadStatus.textContent = message ?? '';
    leadStatus.classList.toggle('is-error', invalid);
  };
  const setResultPanelVisibility = (visible) => {
    root.dataset.layout = visible ? 'results' : 'form';
    result.setAttribute('aria-hidden', String(!visible));
    result.toggleAttribute('inert', !visible);
  };
  const setResultState = (state) => {
    const loading = state === 'loading';
    resultLoading.hidden = !loading;
    resultContent.hidden = loading;
    if (resultScope) resultScope.hidden = state !== 'complete';
    if (resultDisclosure) resultDisclosure.hidden = state !== 'complete';
    result.dataset.resultState = state;
    result.setAttribute('aria-busy', String(loading));
  };
  const currentConsumption = () => {
    if (mode() === 'usage') {
      return { mode: 'usage', averageMonthlyKwh: monthlyUsage(usage.value) };
    }
    const enteredKwh = billKwhPanel?.hidden === false ? monthlyUsage(billKwh?.value) : null;
    return {
      mode: 'bill',
      averageMonthlyBillAmd: monthlyBill(bill.value),
      ...(enteredKwh === null ? {} : { billedKwh: enteredKwh })
    };
  };
  const currentConsumptionKwh = () => {
    if (mode() === 'usage') return monthlyUsage(usage.value);
    const enteredKwh = billKwhPanel?.hidden === false ? monthlyUsage(billKwh?.value) : null;
    if (enteredKwh !== null) return enteredKwh;
    const enteredBill = monthlyBill(bill.value);
    const customRate =
      tariffMode() === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE
        ? effectiveRate(effectiveRateInput?.value)
        : null;
    if (enteredBill !== null && customRate !== null) return enteredBill / customRate;
    const estimate =
      enteredBill === null ? null : estimateStandardResidentialConsumptionFromBill(enteredBill);
    return estimate?.available ? estimate.estimatedMonthlyKwh : null;
  };
  const derivedBillRate = () => {
    const enteredBill = monthlyBill(bill.value);
    const enteredKwh = billKwhPanel?.hidden === false ? monthlyUsage(billKwh?.value) : null;
    return deriveEffectiveRateFromBill({ billAmd: enteredBill, billedKwh: enteredKwh });
  };
  const activeFinancialRate = () => {
    const selectedMode = tariffMode();
    const consumption = currentConsumption();
    if (selectedMode === FINANCIAL_RATE_MODES.BILL_DERIVED) {
      return resolveFinancialRateSource({ mode: selectedMode, consumption });
    }
    if (selectedMode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE) {
      return resolveFinancialRateSource({
        mode: selectedMode,
        consumption,
        effectiveRateAmdPerKwh: effectiveRateInput?.value
      });
    }
    return createStandardFinancialRate({ explicit: financialSelectionExplicit });
  };
  const persistSharedInputs = () => {
    session.write({
      regionId: region.value || null,
      consumption: currentConsumption(),
      financialRate: activeFinancialRate()
    });
  };
  const updateTariffDisplay = () => {
    const derivedRate = derivedBillRate();
    const selectedMode = tariffMode();
    const customRate = effectiveRate(effectiveRateInput?.value);
    const derivedAvailable = mode() === 'bill' && derivedRate !== null;
    const billDerivedInput = tariffModeInputs.find(
      (input) => input.value === FINANCIAL_RATE_MODES.BILL_DERIVED
    );
    if (billDerivedOption) billDerivedOption.hidden = !derivedAvailable;
    if (billDerivedInput) billDerivedInput.disabled = !derivedAvailable;
    if (customTariffPanel) {
      customTariffPanel.hidden = selectedMode !== FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE;
    }
    if (effectiveRateInput) {
      effectiveRateInput.disabled = selectedMode !== FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE;
    }
    if (billDerivedRateOutput) {
      billDerivedRateOutput.textContent = derivedAvailable
        ? `${formatRateNumber(derivedRate)} AMD/kWh`
        : '';
    }
    if (billDerivedHelp) {
      billDerivedHelp.textContent = derivedAvailable
        ? interpolate(copy.billDerivedHelp, {
            bill: formatWholeNumber(monthlyBill(bill.value)),
            kwh: formatWholeNumber(monthlyUsage(billKwh.value))
          })
        : '';
    }
    if (customComparison) {
      const visible =
        selectedMode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE &&
        derivedAvailable &&
        customRate !== null;
      customComparison.hidden = !visible;
      customComparison.textContent = visible
        ? interpolate(copy.customBillComparison, {
            derived: formatRateNumber(derivedRate),
            custom: formatRateNumber(customRate)
          })
        : '';
    }
    if (estimatedConsumption && estimatedConsumptionValue) {
      const enteredBill = monthlyBill(bill.value);
      const estimate =
        mode() === 'bill' && !derivedAvailable && enteredBill !== null
          ? estimateStandardResidentialConsumptionFromBill(enteredBill)
          : null;
      estimatedConsumption.hidden = !estimate?.available;
      estimatedConsumptionValue.textContent = estimate?.available
        ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
            estimate.estimatedMonthlyKwh
          )
        : '';
    }
    if (tariffName) {
      tariffName.textContent =
        selectedMode === FINANCIAL_RATE_MODES.BILL_DERIVED && derivedAvailable
          ? (copy.billEffectiveRate ?? copy.customEffectiveRate)
          : selectedMode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE
            ? copy.customEffectiveRate
            : copy.standardTariff;
    }
    if (!tariffSummary) return;
    if (selectedMode === FINANCIAL_RATE_MODES.BILL_DERIVED && derivedAvailable) {
      tariffSummary.textContent = `${formatRateNumber(derivedRate)} AMD/kWh`;
      return;
    }
    if (selectedMode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE) {
      tariffSummary.textContent =
        customRate === null ? '' : `${formatRateNumber(customRate)} AMD/kWh`;
      return;
    }
    const consumptionKwh = currentConsumptionKwh();
    const selection =
      consumptionKwh === null ? null : createAutomaticStandardResidentialTariff(consumptionKwh);
    const standardText = selection?.available
      ? [
          formatTariffBracket({ tariff: selection.tariff, strings: copy }),
          formatTariffRate({
            tariff: selection.tariff,
            formatRate: (value) =>
              new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
          })
        ]
          .filter(Boolean)
          .join(' · ')
      : (copy.standardRangePending ?? '');
    tariffSummary.textContent = standardText;
    if (standardTariffOutput) standardTariffOutput.textContent = standardText;
  };
  const updateMode = ({ resetFinancial = false } = {}) => {
    const billMode = mode() === 'bill';
    billWrap.hidden = !billMode;
    if (billKwhWrap) billKwhWrap.hidden = !billMode;
    usageWrap.hidden = billMode;
    bill.disabled = !billMode;
    if (billKwh) billKwh.disabled = !billMode || billKwhPanel?.hidden !== false;
    usage.disabled = billMode;
    if (resetFinancial) {
      financialSelectionExplicit = false;
      selectTariffMode(FINANCIAL_RATE_MODES.STANDARD);
      if (effectiveRateInput) effectiveRateInput.value = '';
    }
    updateTariffDisplay();
  };
  const clearAnalysis = () => {
    if (!lifecycle.isActive()) return;
    session.write({
      quickAnalysis: null,
      quickAnalysisStatus: 'idle',
      quickAnalysisIdentity: null,
      // Consumption is shared with Professional. Editing it makes a
      // Professional result incompatible, but never lets the two result
      // scopes overwrite one another.
      professionalAnalysis: null,
      professionalAnalysisStatus: 'idle',
      professionalAnalysisIdentity: null,
      professionalSolarPassport: null
    });
    resultValues.hidden = true;
    resultActions.hidden = true;
    resultValues.replaceChildren();
    resultTitle.textContent = copy.resultsTitle ?? copy.waiting;
    resultCopy.textContent = copy.waiting;
    setResultState('idle');
    if (leadDialog?.open) leadDialog.close();
  };
  const input = () => {
    const selectedRegion = region.value;
    const currentMode = mode();
    const selectedTariffMode = tariffMode();
    if (!selectedRegion) return { valid: false, field: region };
    if (currentMode === 'bill') {
      const value = monthlyBill(bill.value);
      if (!value) return { valid: false, field: bill };
      const hasBillKwh =
        billKwhPanel?.hidden === false &&
        typeof billKwh?.value === 'string' &&
        billKwh.value.trim() !== '';
      const actualKwh = hasBillKwh ? monthlyUsage(billKwh?.value) : null;
      if (hasBillKwh && actualKwh === null) return { valid: false, field: billKwh };
      const derivedRate =
        actualKwh === null
          ? null
          : deriveEffectiveRateFromBill({ billAmd: value, billedKwh: actualKwh });
      const customRate =
        selectedTariffMode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE
          ? effectiveRate(effectiveRateInput?.value)
          : null;
      if (selectedTariffMode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE && customRate === null) {
        return { valid: false, field: effectiveRateInput, message: copy.invalidEffectiveRate };
      }
      if (selectedTariffMode === FINANCIAL_RATE_MODES.BILL_DERIVED && derivedRate === null) {
        return { valid: false, field: billKwh, message: copy.invalidBillDerived };
      }
      const consumption = {
        mode: 'bill',
        averageMonthlyBillAmd: value,
        ...(actualKwh === null ? {} : { billedKwh: actualKwh })
      };
      const financialRate = resolveFinancialRateSource({
        mode: selectedTariffMode,
        consumption,
        effectiveRateAmdPerKwh: customRate,
        explicit: financialSelectionExplicit
      });
      return {
        valid: true,
        payload: {
          regionId: selectedRegion,
          consumption: {
            averageMonthlyBillAmd: value,
            ...(actualKwh === null ? {} : { billedKwh: actualKwh })
          },
          financialRate: toFinancialRateRequest(financialRate, consumption)
        },
        state: {
          regionId: selectedRegion,
          consumption,
          financialRate
        }
      };
    }
    const value = monthlyUsage(usage.value);
    if (!value) return { valid: false, field: usage };
    const customRate =
      selectedTariffMode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE
        ? effectiveRate(effectiveRateInput?.value)
        : null;
    if (selectedTariffMode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE && customRate === null) {
      return { valid: false, field: effectiveRateInput, message: copy.invalidEffectiveRate };
    }
    const consumption = { mode: 'usage', averageMonthlyKwh: value };
    const financialRate = resolveFinancialRateSource({
      mode: selectedTariffMode,
      consumption,
      effectiveRateAmdPerKwh: customRate,
      explicit: financialSelectionExplicit
    });
    return {
      valid: true,
      payload: {
        regionId: selectedRegion,
        consumption: { averageMonthlyKwh: value },
        financialRate: toFinancialRateRequest(financialRate, consumption)
      },
      state: {
        regionId: selectedRegion,
        consumption,
        financialRate
      }
    };
  };
  const syncSubmitAvailability = () => {
    if (!submit) return;
    const valid = input().valid;
    setResultPanelVisibility(valid);
    submit.disabled = request !== null || !valid;
  };
  const render = (analysis) => {
    const scenario = analysis?.selectedScenario;
    if (!scenario) return;
    const values = document.createElement('dl');
    values.className = 'quick-result__metrics';
    const summary = buildQuickResultMetrics({
      scenario,
      commercialEstimate: analysis?.commercialEstimate,
      copy,
      locale
    });
    values.append(
      ...summary.metrics.map(({ label, value, icon, tone }) => metric(label, value, { icon, tone }))
    );
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
      updateMode({ resetFinancial: true });
      persistSharedInputs();
      clearAnalysis();
      syncSubmitAvailability();
    })
  );
  tariffModeInputs.forEach((control) =>
    control.addEventListener('change', () => {
      financialSelectionExplicit = true;
      persistSharedInputs();
      updateTariffDisplay();
      clearAnalysis();
      syncSubmitAvailability();
    })
  );
  [region, bill, usage, billKwh, effectiveRateInput].filter(Boolean).forEach((control) =>
    control.addEventListener('input', () => {
      control.removeAttribute('aria-invalid');
      if (control === bill || control === billKwh) {
        const available = derivedBillRate() !== null && mode() === 'bill';
        if (available && !financialSelectionExplicit) {
          selectTariffMode(createDefaultFinancialRate(currentConsumption()).mode);
          if (tariffOptions?.hidden) {
            tariffOptions.hidden = false;
            tariffChange?.setAttribute('aria-expanded', 'true');
            if (tariffChange) tariffChange.textContent = copy.closeTariff;
          }
        } else if (!available && tariffMode() === FINANCIAL_RATE_MODES.BILL_DERIVED) {
          selectTariffMode(FINANCIAL_RATE_MODES.STANDARD);
        }
      }
      updateTariffDisplay();
      persistSharedInputs();
      clearAnalysis();
      syncSubmitAvailability();
    })
  );
  [bill, usage, billKwh]
    .filter(Boolean)
    .forEach((control) => control.addEventListener('input', () => updateMode()));
  effectiveRateInput?.addEventListener('input', () => {
    if (tariffMode() !== FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE) return;
    persistSharedInputs();
  });
  effectiveRateInput?.addEventListener('blur', () => {
    const rate = effectiveRate(effectiveRateInput.value);
    if (rate !== null) effectiveRateInput.value = formatRateNumber(rate);
  });
  region.addEventListener('change', () => {
    persistSharedInputs();
    clearAnalysis();
    syncSubmitAvailability();
  });
  billKwhToggle?.addEventListener('click', () => {
    const expanded = billKwhToggle.getAttribute('aria-expanded') === 'true';
    billKwhToggle.setAttribute('aria-expanded', String(!expanded));
    billKwhPanel.hidden = expanded;
    if (billKwh) billKwh.disabled = expanded;
    billKwhToggle.textContent = expanded ? `${copy.billKwhAction} →` : copy.billKwhRemove;
    if (!expanded) {
      billKwh?.focus();
      syncSubmitAvailability();
      return;
    }
    if (billKwh) {
      billKwh.value = '';
      billKwh.removeAttribute('aria-invalid');
    }
    if (tariffMode() === FINANCIAL_RATE_MODES.BILL_DERIVED) {
      financialSelectionExplicit = false;
      selectTariffMode(FINANCIAL_RATE_MODES.STANDARD);
    }
    updateTariffDisplay();
    persistSharedInputs();
    clearAnalysis();
    syncSubmitAvailability();
  });
  tariffChange?.addEventListener('click', () => {
    const expanded = tariffChange.getAttribute('aria-expanded') === 'true';
    tariffChange.setAttribute('aria-expanded', String(!expanded));
    tariffOptions.hidden = expanded;
    tariffChange.textContent = expanded ? copy.changeTariff : copy.closeTariff;
    if (!expanded) tariffModeInputs.find((input) => input.checked)?.focus();
  });
  const closeTariffPopover = ({ restoreFocus = true } = {}) => {
    if (!tariffPopover || tariffPopover.hidden) return;
    tariffPopover.hidden = true;
    tariffInfoButton?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) tariffInfoButton?.focus();
  };
  tariffInfoButton?.addEventListener('click', () => {
    const opening = tariffPopover?.hidden !== false;
    if (!tariffPopover) return;
    tariffPopover.hidden = !opening;
    tariffInfoButton.setAttribute('aria-expanded', String(opening));
    if (opening) tariffPopover.focus();
  });
  const handleTariffPopoverKeydown = (event) => {
    if (event.key !== 'Escape' || tariffPopover?.hidden !== false) return;
    event.preventDefault();
    closeTariffPopover();
  };
  const handleTariffPopoverOutsideClick = (event) => {
    if (!tariffPopover || tariffPopover.hidden) return;
    if (tariffPopover.contains(event.target) || tariffInfoButton?.contains(event.target)) return;
    closeTariffPopover();
  };
  document.addEventListener('keydown', handleTariffPopoverKeydown);
  document.addEventListener('click', handleTariffPopoverOutsideClick);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!lifecycle.isActive()) return;
    const current = input();
    if (!current.valid) {
      current.field?.setAttribute('aria-invalid', 'true');
      current.field?.focus();
      setStatus(current.message ?? copy.waiting, true);
      return;
    }
    request?.abort();
    const controller = lifecycle.createController();
    request = controller;
    const previous = session.read();
    // A different regional benchmark means a previously refined property may
    // no longer belong to the selected starting context. Keep the roof when
    // the homeowner only updates consumption for the same region, but never
    // carry it into a newly selected regional estimate.
    const changedRegion = shouldClearRefinementForRegion(previous.regionId, current.state.regionId);
    const quickAnalysisIdentity = createQuickAnalysisIdentity({
      regionId: current.state.regionId,
      consumption: current.state.consumption,
      financialRate: current.state.financialRate
    });
    session.write({
      ...current.state,
      ...(changedRegion ? { property: null, roof: null, sitePotential: null } : {}),
      quickAnalysis: null,
      quickAnalysisStatus: 'loading',
      quickAnalysisIdentity: null,
      professionalAnalysis: null,
      professionalAnalysisStatus: 'idle',
      professionalAnalysisIdentity: null,
      professionalSolarPassport: null
    });
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    resultValues.hidden = true;
    resultActions.hidden = true;
    resultValues.replaceChildren();
    setResultState('loading');
    setStatus(copy.loading);
    try {
      const response = await api.quickAnalyze(current.payload, { signal: controller.signal });
      if (!lifecycle.canCommit(controller, request)) return;
      const analysis = response?.analysis;
      if (!analysis) throw new ProductApiError('MALFORMED_RESPONSE');
      session.write({
        ...current.state,
        quickAnalysis: analysis,
        quickAnalysisStatus: 'complete',
        quickAnalysisIdentity
      });
      render(analysis);
      setStatus('');
    } catch (error) {
      if (!lifecycle.canCommit(controller, request)) return;
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      resultTitle.textContent = copy.unavailable;
      resultCopy.textContent = errorMessage(error, copy);
      resultValues.hidden = true;
      resultActions.hidden = true;
      setResultState('error');
      session.write({
        quickAnalysis: null,
        quickAnalysisStatus: 'unavailable',
        quickAnalysisIdentity: null
      });
      setStatus(errorMessage(error, copy), true);
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'button button--outline';
      retry.textContent = copy.retry;
      retry.addEventListener('click', () => form.requestSubmit());
      resultValues.replaceChildren(retry);
      resultValues.hidden = false;
    } finally {
      const ownsRequest = request === controller;
      if (ownsRequest) request = null;
      lifecycle.release(controller);
      if (lifecycle.isActive() && ownsRequest) {
        syncSubmitAvailability();
        submit.removeAttribute('aria-busy');
      }
    }
  });

  const resetLeadDialog = () => {
    if (!lifecycle.isActive()) return;
    leadRequest?.abort();
    leadRequest = null;
    leadComplete = false;
    leadForm?.reset();
    leadForm?.removeAttribute('aria-busy');
    if (leadSubmit) leadSubmit.disabled = false;
    if (leadSuccess) leadSuccess.hidden = true;
    if (leadDismiss) leadDismiss.hidden = false;
    if (leadContent) leadContent.hidden = false;
    if (leadForm) leadForm.hidden = false;
    leadDialog?.setAttribute('aria-labelledby', 'quick-lead-title');
    leadDialog?.setAttribute('aria-describedby', 'quick-lead-copy');
    setLeadStatus('');
    [leadName, leadPhone, leadMessage].forEach((field) => field?.removeAttribute('aria-invalid'));
  };

  const closeLeadDialog = () => {
    if (leadDialog?.open) leadDialog.close();
  };

  leadOpen?.addEventListener('click', () => {
    if (!lifecycle.isActive()) return;
    const snapshot = session.read();
    const analysis = snapshot.quickAnalysis;
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
    if (!lifecycle.isActive()) {
      leadTrigger = null;
      return;
    }
    resetLeadDialog();
    leadTrigger = null;
    trigger?.focus?.();
  });

  leadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!lifecycle.isActive()) return;
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
    const analysis = snapshot.quickAnalysis;
    if (!analysis) {
      setLeadStatus(copy.lead?.unavailable, true);
      return;
    }

    const controller = lifecycle.createController();
    leadRequest = controller;
    leadSubmit.disabled = true;
    leadForm.setAttribute('aria-busy', 'true');
    setLeadStatus(copy.lead?.loading);
    try {
      await api.submitLead(
        {
          ...validated.values,
          locale: config.locale,
          attachCalculation: Boolean(leadAttachCalculation?.checked),
          ...(leadAttachCalculation?.checked
            ? {
                calculatorContext: buildQuickLeadContext({
                  analysis,
                  state: snapshot,
                  locale: config.locale
                })
              }
            : {})
        },
        { signal: controller.signal }
      );
      if (!lifecycle.canCommit(controller, leadRequest)) return;
      leadComplete = true;
      leadForm.hidden = true;
      if (leadContent) leadContent.hidden = true;
      if (leadDismiss) leadDismiss.hidden = true;
      if (leadSuccess) {
        leadSuccess.hidden = false;
        leadSuccess.focus();
      }
      leadDialog?.setAttribute('aria-labelledby', 'quick-lead-success-title');
      leadDialog?.removeAttribute('aria-describedby');
      setLeadStatus('');
    } catch (error) {
      if (!lifecycle.canCommit(controller, leadRequest)) return;
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      setLeadStatus(copy.lead?.unavailable, true);
    } finally {
      const ownsRequest = leadRequest === controller;
      if (ownsRequest) leadRequest = null;
      lifecycle.release(controller);
      if (lifecycle.isActive() && ownsRequest) {
        if (!leadComplete) leadSubmit.disabled = false;
        leadForm.removeAttribute('aria-busy');
      }
    }
  });

  updateMode();
  selectTariffMode(restoredFinancialRate.mode);
  updateTariffDisplay();
  if (billKwhToggle) {
    billKwhToggle.textContent = billKwhPanel?.hidden
      ? `${copy.billKwhAction} →`
      : copy.billKwhRemove;
  }
  const savedQuickAnalysis = saved.quickAnalysis;
  if (savedQuickAnalysis?.scope === 'regional-preliminary') render(savedQuickAnalysis);
  else setResultState('idle');
  syncSubmitAvailability();
  const destroy = () => {
    if (!lifecycle.destroy()) return;
    request = null;
    leadRequest = null;
    leadTrigger = null;
    document.removeEventListener('keydown', handleTariffPopoverKeydown);
    document.removeEventListener('click', handleTariffPopoverOutsideClick);
    if (leadDialog?.open) leadDialog.close();
  };
  return { session, clearAnalysis, destroy };
};
