import { getCalculatorInputNumber, isCalculatorInputInRange } from '../domain/calculator-inputs.js';
import {
  createAutomaticStandardResidentialTariff,
  estimateStandardResidentialConsumptionFromBill
} from '../domain/tariffs.js';

const monthlyUsage = (value) => getCalculatorInputNumber(value, 'averageMonthlyConsumptionKwh');
const monthlyBill = (value) => getCalculatorInputNumber(value, 'averageMonthlyBillAmd');
const effectiveRate = (value) => getCalculatorInputNumber(value, 'customTariffAmdPerKwh');
const profileMonth = (value) => getCalculatorInputNumber(value, 'monthlyProfileKwh');

const togglePanel = (panel, active) => {
  panel.hidden = !active;
  panel.setAttribute('aria-hidden', String(!active));
  panel.querySelectorAll('input').forEach((input) => {
    input.disabled = !active;
  });
};

const hasText = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * The Professional consumption step accepts only household consumption and an
 * optional effective average rate. It never presents tariff brackets,
 * customer categories or day/night controls; the server derives an automatic
 * standard residential tariff when an override is absent.
 */
export const initConsumptionInput = ({
  root,
  strings = {},
  initialEffectiveRate = null,
  onChange = () => {}
} = {}) => {
  if (!root) return null;
  const wizardRoot = root.closest('[data-calculator-wizard]') ?? root;
  const modeInputs = [...root.querySelectorAll('input[name="consumption-mode"]')];
  const panels = [...root.querySelectorAll('[data-consumption-panel]')];
  const annualOutput = root.querySelector('[data-consumption-annual]');
  const effectiveRateInput = root.querySelector('[data-consumption-effective-rate]');
  const chartItems = [
    ...wizardRoot.querySelectorAll('[data-consumption-chart] .consumption-profile-chart__item')
  ];
  const fillAverageButton = wizardRoot.querySelector('[data-consumption-fill-average]');
  const unitButtons = [...wizardRoot.querySelectorAll('[data-consumption-unit]')];
  const monthlyProfileButton = wizardRoot.querySelector('[data-consumption-switch-monthly]');
  let chartUnit = 'kwh';

  if (effectiveRateInput && initialEffectiveRate?.rateAmdPerKwh !== undefined) {
    effectiveRateInput.value = String(initialEffectiveRate.rateAmdPerKwh);
  }

  const activeMode = () => modeInputs.find((input) => input.checked)?.value ?? 'bill';
  const selectedEffectiveRate = () => effectiveRate(effectiveRateInput?.value);
  const automaticEstimate = (bill) =>
    bill === null ? null : estimateStandardResidentialConsumptionFromBill(bill);

  const getValues = () => {
    const mode = activeMode();
    const usage = monthlyUsage(root.querySelector('[data-consumption-usage]')?.value);
    const bill = monthlyBill(root.querySelector('[data-consumption-bill]')?.value);
    const overrideRate = selectedEffectiveRate();
    const estimate = mode === 'bill' && overrideRate === null ? automaticEstimate(bill) : null;
    const monthly = [...root.querySelectorAll('[data-consumption-month]')].map((input) =>
      profileMonth(input.value)
    );
    let annual = null;
    let displayRate = overrideRate;
    if (mode === 'bill' && bill !== null) {
      if (overrideRate !== null) annual = (bill / overrideRate) * 12;
      else if (estimate?.available) {
        annual = estimate.estimatedMonthlyKwh * 12;
        displayRate = estimate.rateAmdPerKwh;
      }
    }
    if (mode === 'usage' && usage !== null) annual = usage * 12;
    if (mode === 'monthly' && monthly.length === 12 && monthly.every((value) => value !== null)) {
      annual = monthly.reduce((total, value) => total + value, 0);
    }
    if (!isCalculatorInputInRange(annual, 'annualConsumptionKwh')) annual = null;
    // Match the server's automatic standard-residential reference for the
    // usage and monthly-profile modes as well as bill input. This only drives
    // the optional AMD chart; the authoritative rate remains server-side.
    if (displayRate === null && annual !== null) {
      const automaticTariff = createAutomaticStandardResidentialTariff(annual / 12);
      if (automaticTariff.available) displayRate = automaticTariff.tariff.rateAmdPerKwh;
    }
    return { annual, bill, displayRate, estimate, mode, monthly, overrideRate, usage };
  };

  const updateChart = ({ annual, mode, monthly, displayRate }) => {
    if (!chartItems.length) return;
    const hasMonthlyProfile =
      mode === 'monthly' && monthly.length === 12 && monthly.every((value) => value !== null);
    const kwhValues = hasMonthlyProfile
      ? monthly
      : Array(12).fill(annual === null ? 0 : annual / 12);
    const useAmd = chartUnit === 'amd' && displayRate !== null;
    const values = useAmd ? kwhValues.map((value) => value * displayRate) : kwhValues;
    const maximum = Math.max(...values, 1);
    chartItems.forEach((item, index) => {
      const value = values[index] ?? 0;
      item
        .querySelector('[data-consumption-chart-value]')
        ?.replaceChildren(useAmd ? `${Math.round(value)} ֏` : String(Math.round(value)));
      item
        .querySelector('.consumption-profile-chart__bar')
        ?.style.setProperty('--chart-height', `${Math.max(8, (value / maximum) * 100)}%`);
    });
  };

  const updateAnnualOutput = () => {
    const values = getValues();
    if (annualOutput)
      annualOutput.textContent = values.annual === null ? '—' : String(Math.round(values.annual));
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
  };

  const updateMode = ({ notify = true } = {}) => {
    const mode = activeMode();
    panels.forEach((panel) => togglePanel(panel, panel.dataset.consumptionPanel === mode));
    updateAnnualOutput();
    if (notify) onChange();
  };

  modeInputs.forEach((input) => input.addEventListener('change', updateMode));
  root
    .querySelectorAll(
      '[data-consumption-bill], [data-consumption-usage], [data-consumption-month], [data-consumption-effective-rate]'
    )
    .forEach((input) => {
      input.addEventListener('input', () => {
        input.removeAttribute('aria-invalid');
        updateAnnualOutput();
        onChange();
      });
    });
  fillAverageButton?.addEventListener('click', () => {
    const values = getValues();
    const monthlyInputs = [...root.querySelectorAll('[data-consumption-month]')];
    if (values.annual === null || monthlyInputs.length !== 12) return;
    const monthlyMode = modeInputs.find((input) => input.value === 'monthly');
    if (monthlyMode) monthlyMode.checked = true;
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
    updateMode();
    root.querySelector('[data-consumption-month]')?.focus();
  });
  updateMode({ notify: false });

  const invalidResult = (inputs, message) => ({
    valid: false,
    message,
    inputs: inputs.filter(Boolean)
  });
  const validOverride = () =>
    !hasText(effectiveRateInput?.value) || selectedEffectiveRate() !== null;
  const tariffOverride = () => {
    const rateAmdPerKwh = selectedEffectiveRate();
    return rateAmdPerKwh === null ? null : { rateAmdPerKwh };
  };

  const inspect = () => {
    const mode = activeMode();
    if (!validOverride()) {
      return invalidResult(
        [effectiveRateInput],
        strings.invalidEffectiveRate ?? strings.invalidTariff
      );
    }
    if (mode === 'bill') {
      const input = root.querySelector('[data-consumption-bill]');
      const value = monthlyBill(input?.value);
      if (value === null) return invalidResult([input], strings.invalidBill);
      if (selectedEffectiveRate() === null && !automaticEstimate(value)?.available) {
        return invalidResult([input], strings.invalidBill);
      }
      return {
        valid: true,
        value: { mode, averageMonthlyBillAmd: value },
        tariff: tariffOverride()
      };
    }
    if (mode === 'usage') {
      const input = root.querySelector('[data-consumption-usage]');
      const value = monthlyUsage(input?.value);
      return value === null
        ? invalidResult([input], strings.invalidUsage)
        : { valid: true, value: { mode, averageMonthlyKwh: value }, tariff: tariffOverride() };
    }
    const inputs = [...root.querySelectorAll('[data-consumption-month]')];
    const monthlyKwh = inputs.map((input) => profileMonth(input.value));
    const annualKwh = monthlyKwh.reduce((total, value) => total + (value ?? 0), 0);
    if (
      monthlyKwh.length !== 12 ||
      monthlyKwh.some((value) => value === null) ||
      annualKwh <= 0 ||
      !isCalculatorInputInRange(annualKwh, 'annualConsumptionKwh')
    ) {
      return invalidResult(inputs, strings.incompleteMonths);
    }
    return { valid: true, value: { mode, monthlyKwh }, tariff: tariffOverride() };
  };

  return {
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
