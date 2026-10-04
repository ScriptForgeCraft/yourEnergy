import { getCalculatorInputNumber, isCalculatorInputInRange } from '../domain/calculator-inputs.js';
import {
  FINANCIAL_RATE_MODES,
  createDefaultFinancialRate,
  createStandardFinancialRate,
  deriveEffectiveRateFromBill,
  resolveFinancialRateSource
} from '../domain/financial-rate.js';
import {
  createAutomaticStandardResidentialTariff,
  createAutomaticStandardResidentialTariffProfile,
  createStandardResidentialTariffFromActualDayNight,
  estimateStandardResidentialConsumptionFromBill
} from '../domain/tariffs.js';
import { formatTariffBracket, formatTariffRate } from './tariff-provenance.js';

const monthlyUsage = (value) => getCalculatorInputNumber(value, 'averageMonthlyConsumptionKwh');
const monthlyBill = (value) => getCalculatorInputNumber(value, 'averageMonthlyBillAmd');
const effectiveRate = (value) => getCalculatorInputNumber(value, 'customTariffAmdPerKwh');
const profileMonth = (value) => getCalculatorInputNumber(value, 'monthlyProfileKwh');
const hasText = (value) => typeof value === 'string' && value.trim() !== '';

const togglePanel = (panel, active) => {
  panel.hidden = !active;
  panel.setAttribute('aria-hidden', String(!active));
  panel.querySelectorAll('input').forEach((input) => {
    input.disabled = !active;
  });
};

const interpolate = (template, values = {}) =>
  String(template ?? '').replace(/\{([a-zA-Z0-9_]+)\}/gu, (_match, key) =>
    values[key] === null || values[key] === undefined ? '' : String(values[key])
  );

/** One Professional consumption controller shared by Bill, kWh and Monthly. */
export const initConsumptionInput = ({
  root,
  strings = {},
  locale = 'en-US',
  initialFinancialRate = createStandardFinancialRate(),
  onChange = () => {}
} = {}) => {
  if (!root) return null;
  const wizardRoot = root.closest('[data-calculator-wizard]') ?? root;
  const modeInputs = [...root.querySelectorAll('input[name="consumption-mode"]')];
  const panels = [...root.querySelectorAll('[data-consumption-panel]')];
  const billInput = root.querySelector('[data-consumption-bill]');
  const billedKwhInput = root.querySelector('[data-consumption-billed-kwh]');
  const billedKwhToggle = root.querySelector('[data-consumption-billed-kwh-toggle]');
  const billedKwhPanel = root.querySelector('[data-consumption-billed-kwh-panel]');
  const usageInput = root.querySelector('[data-consumption-usage]');
  const annualOutput = root.querySelector('[data-consumption-annual]');
  const annualCard = root.querySelector('[data-consumption-annual-card]');
  const emptyState = root.querySelector('[data-consumption-empty]');
  const effectiveRateInput = root.querySelector('[data-consumption-effective-rate]');
  const tariffModeInputs = [...root.querySelectorAll('input[name="professional-tariff-mode"]')];
  const billDerivedOption = root.querySelector('[data-professional-bill-derived]');
  const billDerivedRate = root.querySelector('[data-professional-bill-derived-rate]');
  const billDerivedHelp = root.querySelector('[data-professional-bill-derived-help]');
  const customTariffPanel = root.querySelector('[data-professional-custom-tariff]');
  const customComparison = root.querySelector('[data-professional-custom-comparison]');
  const standardTariffOutput = root.querySelector('[data-professional-standard-tariff]');
  const actualDayNightOption = root.querySelector('[data-professional-actual-day-night]');
  const actualDayNightPanel = root.querySelector('[data-professional-actual-day-night-panel]');
  const actualDayInput = root.querySelector('[data-actual-day-kwh]');
  const actualNightInput = root.querySelector('[data-actual-night-kwh]');
  const chart = wizardRoot.querySelector('[data-consumption-chart]');
  const chartContext = wizardRoot.querySelector('[data-consumption-chart-context]');
  const chartItems = [
    ...wizardRoot.querySelectorAll('[data-consumption-chart] .consumption-profile-chart__item')
  ];
  const fillAverageButton = wizardRoot.querySelector('[data-consumption-fill-average]');
  const unitButtons = [...wizardRoot.querySelectorAll('[data-consumption-unit]')];
  const monthlyProfileButton = wizardRoot.querySelector('[data-consumption-switch-monthly]');
  const formatRate = (value) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Number(value));
  const formatWhole = (value) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(value));
  let chartUnit = 'kwh';
  let financialSelectionExplicit =
    initialFinancialRate?.mode !== FINANCIAL_RATE_MODES.STANDARD ||
    initialFinancialRate?.explicit === true;

  const activeMode = () => modeInputs.find((input) => input.checked)?.value ?? 'bill';
  const activeTariffMode = () =>
    tariffModeInputs.find((input) => input.checked)?.value ?? FINANCIAL_RATE_MODES.STANDARD;
  const selectTariffMode = (mode) => {
    const input = tariffModeInputs.find((item) => item.value === mode);
    const fallback = tariffModeInputs.find((item) => item.value === FINANCIAL_RATE_MODES.STANDARD);
    if (input) input.checked = true;
    else if (fallback) fallback.checked = true;
  };

  if (initialFinancialRate?.mode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE) {
    const rate = effectiveRate(initialFinancialRate.effectiveRateAmdPerKwh);
    if (rate !== null && effectiveRateInput) effectiveRateInput.value = formatRate(rate);
  }
  if (initialFinancialRate?.mode === FINANCIAL_RATE_MODES.ACTUAL_DAY_NIGHT) {
    if (actualDayInput) actualDayInput.value = String(initialFinancialRate.actualDayKwh ?? '');
    if (actualNightInput)
      actualNightInput.value = String(initialFinancialRate.actualNightKwh ?? '');
  }
  selectTariffMode(initialFinancialRate?.mode);
  const consumptionValues = () => {
    const mode = activeMode();
    const bill = monthlyBill(billInput?.value);
    const billedKwh = billedKwhPanel?.hidden === false ? monthlyUsage(billedKwhInput?.value) : null;
    const usage = monthlyUsage(usageInput?.value);
    const monthly = [...root.querySelectorAll('[data-consumption-month]')].map((input) =>
      profileMonth(input.value)
    );
    const value =
      mode === 'bill'
        ? {
            mode,
            averageMonthlyBillAmd: bill,
            ...(billedKwh === null ? {} : { billedKwh })
          }
        : mode === 'usage'
          ? { mode, averageMonthlyKwh: usage }
          : { mode, monthlyKwh: monthly };
    return { mode, bill, billedKwh, usage, monthly, value };
  };

  const derivedRate = (values) =>
    values.mode === 'bill'
      ? deriveEffectiveRateFromBill({ billAmd: values.bill, billedKwh: values.billedKwh })
      : null;

  const selectedFinancialRate = (values) => {
    const mode = activeTariffMode();
    if (mode === FINANCIAL_RATE_MODES.BILL_DERIVED) {
      return resolveFinancialRateSource({ mode, consumption: values.value });
    }
    if (mode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE) {
      return resolveFinancialRateSource({
        mode,
        consumption: values.value,
        effectiveRateAmdPerKwh: effectiveRateInput?.value
      });
    }
    if (mode === FINANCIAL_RATE_MODES.ACTUAL_DAY_NIGHT) {
      return resolveFinancialRateSource({
        mode,
        consumption: values.value,
        actualDayKwh: actualDayInput?.value,
        actualNightKwh: actualNightInput?.value
      });
    }
    return createStandardFinancialRate({ explicit: financialSelectionExplicit });
  };

  const getValues = () => {
    const values = consumptionValues();
    const selectedMode = activeTariffMode();
    const customRate =
      selectedMode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE
        ? effectiveRate(effectiveRateInput?.value)
        : null;
    const billRate = derivedRate(values);
    const estimate =
      values.mode === 'bill' && values.bill !== null && values.billedKwh === null
        ? selectedMode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE && customRate !== null
          ? null
          : estimateStandardResidentialConsumptionFromBill(values.bill)
        : null;
    let annual = null;
    if (values.mode === 'bill' && values.bill !== null) {
      if (values.billedKwh !== null) annual = values.billedKwh * 12;
      else if (customRate !== null) annual = (values.bill / customRate) * 12;
      else if (estimate?.available) annual = estimate.estimatedMonthlyKwh * 12;
    } else if (values.mode === 'usage' && values.usage !== null) {
      annual = values.usage * 12;
    } else if (
      values.mode === 'monthly' &&
      values.monthly.length === 12 &&
      values.monthly.every((value) => value !== null)
    ) {
      annual = values.monthly.reduce((total, value) => total + value, 0);
    }
    if (!isCalculatorInputInRange(annual, 'annualConsumptionKwh')) annual = null;
    const standardSelection =
      annual === null
        ? null
        : values.mode === 'monthly'
          ? createAutomaticStandardResidentialTariffProfile(values.monthly)
          : createAutomaticStandardResidentialTariff(annual / 12);
    let displayRate = null;
    if (selectedMode === FINANCIAL_RATE_MODES.BILL_DERIVED) displayRate = billRate;
    if (selectedMode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE) displayRate = customRate;
    if (selectedMode === FINANCIAL_RATE_MODES.ACTUAL_DAY_NIGHT && values.usage !== null) {
      const selection = createStandardResidentialTariffFromActualDayNight(values.usage, {
        dayKwh: actualDayInput?.value,
        nightKwh: actualNightInput?.value
      });
      displayRate = selection.available ? selection.tariff.effectiveRateAmdPerKwh : null;
    }
    return {
      ...values,
      annual,
      billRate,
      customRate,
      displayRate,
      estimate,
      financialRate: selectedFinancialRate(values),
      standardSelection
    };
  };

  const updateTariffUi = (values) => {
    const billDerivedAvailable = values.billRate !== null && values.mode === 'bill';
    const actualAvailable = values.mode === 'usage';
    const active = activeTariffMode();
    if (billDerivedOption) billDerivedOption.hidden = !billDerivedAvailable;
    const billDerivedInput = tariffModeInputs.find(
      (input) => input.value === FINANCIAL_RATE_MODES.BILL_DERIVED
    );
    if (billDerivedInput) billDerivedInput.disabled = !billDerivedAvailable;
    if (actualDayNightOption) actualDayNightOption.hidden = !actualAvailable;
    const actualInput = tariffModeInputs.find(
      (input) => input.value === FINANCIAL_RATE_MODES.ACTUAL_DAY_NIGHT
    );
    if (actualInput) actualInput.disabled = !actualAvailable;

    if (billDerivedRate) {
      billDerivedRate.textContent = billDerivedAvailable
        ? `${formatRate(values.billRate)} AMD/kWh`
        : '';
    }
    if (billDerivedHelp) {
      billDerivedHelp.textContent = billDerivedAvailable
        ? interpolate(strings.billDerivedHelp, {
            bill: formatWhole(values.bill),
            kwh: formatWhole(values.billedKwh)
          })
        : '';
    }

    const custom = active === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE;
    if (customTariffPanel) customTariffPanel.hidden = !custom;
    if (effectiveRateInput) effectiveRateInput.disabled = !custom;
    if (customComparison) {
      const visible = custom && billDerivedAvailable && values.customRate !== null;
      customComparison.hidden = !visible;
      customComparison.textContent = visible
        ? interpolate(strings.customBillComparison, {
            derived: formatRate(values.billRate),
            custom: formatRate(values.customRate)
          })
        : '';
    }

    const actual = active === FINANCIAL_RATE_MODES.ACTUAL_DAY_NIGHT && actualAvailable;
    if (actualDayNightPanel) actualDayNightPanel.hidden = !actual;
    [actualDayInput, actualNightInput].forEach((input) => {
      if (input) input.disabled = !actual;
    });

    if (standardTariffOutput) {
      standardTariffOutput.textContent = values.standardSelection?.available
        ? [
            formatTariffBracket({
              tariff: {
                ...values.standardSelection.tariff,
                monthlyTariffs: values.standardSelection.monthlyTariffs
              },
              strings,
              formatKwh: formatRate
            }),
            formatTariffRate({ tariff: values.standardSelection.tariff, formatRate })
          ]
            .filter(Boolean)
            .join(' · ')
        : '';
    }
  };

  const updateChart = ({ annual, mode, monthly, displayRate }) => {
    if (!chartItems.length) return;
    const hasMonthlyProfile =
      mode === 'monthly' && monthly.length === 12 && monthly.every((value) => value !== null);
    const empty = annual === null;
    const kwhValues = hasMonthlyProfile ? monthly : Array(12).fill(empty ? 0 : annual / 12);
    const useAmd = chartUnit === 'amd' && displayRate !== null;
    const values = useAmd ? kwhValues.map((value) => value * displayRate) : kwhValues;
    const maximum = Math.max(...values, 1);
    chartItems.forEach((item, index) => {
      const value = values[index] ?? 0;
      item
        .querySelector('[data-consumption-chart-value]')
        ?.replaceChildren(
          empty ? '—' : useAmd ? `${Math.round(value)} ֏` : String(Math.round(value))
        );
      item
        .querySelector('.consumption-profile-chart__bar')
        ?.style.setProperty(
          '--chart-height',
          empty ? '0%' : `${Math.max(8, (value / maximum) * 100)}%`
        );
    });
    chart?.classList.toggle('is-empty', empty);
    if (chartContext) {
      chartContext.hidden = hasMonthlyProfile;
      chartContext.textContent = empty ? strings.chartEmpty : strings.chartUniform;
    }
  };

  const updateAnnualOutput = () => {
    const values = getValues();
    if (annualOutput) {
      annualOutput.textContent = values.annual === null ? '' : String(Math.round(values.annual));
    }
    if (annualCard) annualCard.hidden = values.annual === null;
    if (emptyState) emptyState.hidden = values.annual !== null;
    if (chartUnit === 'amd' && values.displayRate === null) chartUnit = 'kwh';
    unitButtons.forEach((button) => {
      const selected = button.dataset.consumptionUnit === chartUnit;
      const requiresRate = button.dataset.consumptionUnit === 'amd';
      button.disabled = requiresRate && values.displayRate === null;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    if (fillAverageButton) fillAverageButton.disabled = values.annual === null;
    updateChart(values);
    updateTariffUi(values);
    return values;
  };

  const resetFinancialSource = () => {
    financialSelectionExplicit = false;
    selectTariffMode(FINANCIAL_RATE_MODES.STANDARD);
    if (effectiveRateInput) effectiveRateInput.value = '';
    if (actualDayInput) actualDayInput.value = '';
    if (actualNightInput) actualNightInput.value = '';
  };

  const updateMode = ({ notify = true, resetFinancial = false } = {}) => {
    const mode = activeMode();
    panels.forEach((panel) => togglePanel(panel, panel.dataset.consumptionPanel === mode));
    if (billedKwhInput) {
      billedKwhInput.disabled = mode !== 'bill' || billedKwhPanel?.hidden !== false;
    }
    if (resetFinancial) resetFinancialSource();
    const values = updateAnnualOutput();
    if (notify) onChange(values);
  };

  const maybeSelectBillDerived = () => {
    const values = consumptionValues();
    const available = derivedRate(values) !== null;
    if (values.mode === 'bill' && available && !financialSelectionExplicit) {
      selectTariffMode(createDefaultFinancialRate(values.value).mode);
    } else if (!available && activeTariffMode() === FINANCIAL_RATE_MODES.BILL_DERIVED) {
      selectTariffMode(FINANCIAL_RATE_MODES.STANDARD);
    }
  };

  modeInputs.forEach((input) =>
    input.addEventListener('change', () => updateMode({ resetFinancial: true }))
  );
  tariffModeInputs.forEach((input) =>
    input.addEventListener('change', () => {
      financialSelectionExplicit = true;
      updateAnnualOutput();
      onChange();
    })
  );
  root
    .querySelectorAll(
      '[data-consumption-bill], [data-consumption-billed-kwh], [data-consumption-usage], [data-consumption-month], [data-consumption-effective-rate], [data-actual-day-kwh], [data-actual-night-kwh]'
    )
    .forEach((input) => {
      input.addEventListener('input', () => {
        input.removeAttribute('aria-invalid');
        if (input === billInput || input === billedKwhInput) maybeSelectBillDerived();
        updateAnnualOutput();
        onChange();
      });
    });
  effectiveRateInput?.addEventListener('blur', () => {
    const rate = effectiveRate(effectiveRateInput.value);
    if (rate !== null) effectiveRateInput.value = formatRate(rate);
  });
  billedKwhToggle?.addEventListener('click', () => {
    const expanded = billedKwhToggle.getAttribute('aria-expanded') === 'true';
    billedKwhToggle.setAttribute('aria-expanded', String(!expanded));
    if (billedKwhPanel) billedKwhPanel.hidden = expanded;
    if (billedKwhInput) billedKwhInput.disabled = expanded;
    billedKwhToggle.textContent = expanded ? strings.billKwhAction : strings.billKwhRemove;
    if (!expanded) {
      billedKwhInput?.focus();
      return;
    }
    if (billedKwhInput) {
      billedKwhInput.value = '';
      billedKwhInput.removeAttribute('aria-invalid');
    }
    if (activeTariffMode() === FINANCIAL_RATE_MODES.BILL_DERIVED) {
      financialSelectionExplicit = false;
      selectTariffMode(FINANCIAL_RATE_MODES.STANDARD);
    }
    updateAnnualOutput();
    onChange();
  });
  fillAverageButton?.addEventListener('click', () => {
    const values = getValues();
    const monthlyInputs = [...root.querySelectorAll('[data-consumption-month]')];
    if (values.annual === null || monthlyInputs.length !== 12) return;
    const monthlyMode = modeInputs.find((input) => input.value === 'monthly');
    if (monthlyMode) monthlyMode.checked = true;
    resetFinancialSource();
    const annual = Math.round(values.annual);
    const base = Math.floor(annual / 12);
    const remainder = annual - base * 12;
    monthlyInputs.forEach((input, index) => {
      input.value = String(base + (index < remainder ? 1 : 0));
    });
    updateMode();
  });
  unitButtons.forEach((button) =>
    button.addEventListener('click', () => {
      const nextUnit = button.dataset.consumptionUnit;
      if ((nextUnit !== 'kwh' && nextUnit !== 'amd') || button.disabled) return;
      chartUnit = nextUnit;
      updateAnnualOutput();
    })
  );
  monthlyProfileButton?.addEventListener('click', () => {
    const monthlyMode = modeInputs.find((input) => input.value === 'monthly');
    if (!monthlyMode) return;
    monthlyMode.checked = true;
    updateMode({ resetFinancial: true });
    root.querySelector('[data-consumption-month]')?.focus();
  });

  const invalidResult = (inputs, message) => ({
    valid: false,
    message,
    inputs: inputs.filter(Boolean)
  });

  const inspect = () => {
    const values = getValues();
    if (values.mode === 'bill') {
      if (values.bill === null) return invalidResult([billInput], strings.invalidBill);
      if (
        billedKwhPanel?.hidden === false &&
        hasText(billedKwhInput?.value) &&
        values.billedKwh === null
      ) {
        return invalidResult([billedKwhInput], strings.invalidUsage);
      }
    } else if (values.mode === 'usage' && values.usage === null) {
      return invalidResult([usageInput], strings.invalidUsage);
    } else if (
      values.mode === 'monthly' &&
      (values.monthly.length !== 12 || values.monthly.some((value) => value === null))
    ) {
      return invalidResult(
        [...root.querySelectorAll('[data-consumption-month]')],
        strings.incompleteMonths
      );
    }
    if (values.annual === null) {
      return invalidResult([billInput, usageInput], strings.noConsumption);
    }
    const mode = activeTariffMode();
    if (mode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE && values.customRate === null) {
      return invalidResult(
        [effectiveRateInput],
        strings.invalidEffectiveRate ?? strings.invalidTariff
      );
    }
    if (mode === FINANCIAL_RATE_MODES.BILL_DERIVED && values.billRate === null) {
      return invalidResult([billInput, billedKwhInput], strings.invalidBillDerived);
    }
    if (
      mode === FINANCIAL_RATE_MODES.ACTUAL_DAY_NIGHT &&
      values.financialRate.mode !== FINANCIAL_RATE_MODES.ACTUAL_DAY_NIGHT
    ) {
      return invalidResult(
        [actualDayInput, actualNightInput],
        strings.invalidDayNight ?? strings.invalidUsage
      );
    }
    return { valid: true, value: values.value, financialRate: values.financialRate };
  };

  if (billedKwhInput?.value) {
    if (billedKwhPanel) billedKwhPanel.hidden = false;
    billedKwhToggle?.setAttribute('aria-expanded', 'true');
  }
  if (billedKwhToggle) {
    billedKwhToggle.textContent = billedKwhInput?.value
      ? strings.billKwhRemove
      : strings.billKwhAction;
  }
  updateMode({ notify: false });
  if (financialSelectionExplicit) {
    selectTariffMode(initialFinancialRate?.mode);
  } else {
    maybeSelectBillDerived();
  }
  updateAnnualOutput();

  return {
    draft() {
      const values = getValues();
      return {
        consumption: values.annual === null ? null : values.value,
        financialRate: values.financialRate
      };
    },
    read() {
      const result = inspect();
      result.inputs?.forEach((input) => input.setAttribute('aria-invalid', 'true'));
      return result;
    },
    inspect,
    resetValidation() {
      root
        .querySelectorAll('[aria-invalid="true"]')
        .forEach((input) => input.removeAttribute('aria-invalid'));
    }
  };
};
