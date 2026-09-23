import { getCalculatorInputNumber, isCalculatorInputInRange } from '../domain/calculator-inputs.js';

const monthlyUsage = (value) => getCalculatorInputNumber(value, 'averageMonthlyConsumptionKwh');
const monthlyBill = (value) => getCalculatorInputNumber(value, 'averageMonthlyBillAmd');
const customTariff = (value) => getCalculatorInputNumber(value, 'customTariffAmdPerKwh');
const profileMonth = (value) => getCalculatorInputNumber(value, 'monthlyProfileKwh');

const demoMonthlyProfile = [320, 280, 310, 380, 450, 520, 600, 580, 470, 390, 330, 290];

const togglePanel = (panel, active) => {
  panel.hidden = !active;
  panel.setAttribute('aria-hidden', String(!active));
  panel.querySelectorAll('input').forEach((input) => {
    input.disabled = !active;
  });
};

/**
 * The tariff changes meaning with the consumption mode. A bill in AMD cannot
 * be converted to kWh without a rate; kWh inputs do not need one until the
 * visitor wants to see savings and payback.
 */
export const getTariffSemantics = (mode, strings = {}) => {
  const required = mode === 'bill';
  return {
    required,
    label: required
      ? (strings.tariffBillLabel ?? strings.tariffLabel ?? '')
      : (strings.tariffOptionalLabel ?? strings.tariffLabel ?? ''),
    help: required
      ? (strings.tariffBillHelp ?? strings.tariffHelp ?? '')
      : (strings.tariffOptionalHelp ?? strings.tariffHelp ?? '')
  };
};

/**
 * Accessible consumption-mode control. The result is raw user-provided data;
 * any tariff is an explicit rate copied by the visitor. The browser never
 * assumes a registry/default tariff, and the server owns the later finance
 * calculation.
 */
export const initConsumptionInput = ({ root, strings, onChange = () => {} } = {}) => {
  if (!root) return null;
  const wizardRoot = root.closest('[data-calculator-wizard]') ?? root;

  const modeInputs = [...root.querySelectorAll('input[name="consumption-mode"]')];
  const panels = [...root.querySelectorAll('[data-consumption-panel]')];
  const annualOutput = root.querySelector('[data-consumption-annual]');
  const tariffInput = root.querySelector('[data-consumption-tariff]');
  const tariffLabel = root.querySelector('[data-consumption-tariff-label]');
  const tariffHelp = root.querySelector('[data-consumption-tariff-help]');
  const chartItems = [
    ...wizardRoot.querySelectorAll('[data-consumption-chart] .consumption-profile-chart__item')
  ];
  const fillAverageButton = wizardRoot.querySelector('[data-consumption-fill-average]');
  const unitButtons = [...wizardRoot.querySelectorAll('[data-consumption-unit]')];
  const monthlyProfileButton = wizardRoot.querySelector('[data-consumption-switch-monthly]');
  let chartUnit = 'kwh';

  const activeMode = () => modeInputs.find((input) => input.checked)?.value ?? 'bill';

  const getValues = () => {
    const mode = activeMode();
    const usage = monthlyUsage(root.querySelector('[data-consumption-usage]')?.value);
    const tariff = customTariff(tariffInput?.value);
    const monthly = [...root.querySelectorAll('[data-consumption-month]')].map((input) =>
      profileMonth(input.value)
    );
    let annual = null;
    const bill = monthlyBill(root.querySelector('[data-consumption-bill]')?.value);
    if (mode === 'bill' && bill !== null && tariff !== null) annual = (bill / tariff) * 12;
    if (mode === 'usage' && usage !== null) annual = usage * 12;
    if (mode === 'monthly' && monthly.length === 12 && monthly.every((value) => value !== null)) {
      annual = monthly.reduce((total, value) => total + value, 0);
    }
    if (!isCalculatorInputInRange(annual, 'annualConsumptionKwh')) annual = null;
    return { annual, bill, monthly, mode, tariff, usage };
  };

  const updateChart = ({ annual, mode, monthly, tariff }) => {
    if (!chartItems.length) return;
    const hasMonthlyProfile =
      mode === 'monthly' && monthly.length === 12 && monthly.every((value) => value !== null);
    const kwhValues = hasMonthlyProfile
      ? monthly
      : annual === null
        ? demoMonthlyProfile
        : demoMonthlyProfile.map((value) => Math.round((value / 4920) * annual));
    const useAmd = chartUnit === 'amd' && tariff !== null;
    const values = useAmd ? kwhValues.map((value) => value * tariff) : kwhValues;
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
    const { annual } = values;
    if (annualOutput) annualOutput.textContent = annual === null ? '—' : String(Math.round(annual));
    if (chartUnit === 'amd' && values.tariff === null) chartUnit = 'kwh';
    unitButtons.forEach((button) => {
      const selected = button.dataset.consumptionUnit === chartUnit;
      const requiresTariff = button.dataset.consumptionUnit === 'amd';
      button.disabled = requiresTariff && values.tariff === null;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    updateChart(values);
  };

  const updateTariffSemantics = (mode) => {
    const semantics = getTariffSemantics(mode, strings);
    if (tariffLabel) tariffLabel.textContent = semantics.label;
    if (tariffHelp) tariffHelp.textContent = semantics.help;
    if (tariffInput) {
      tariffInput.required = semantics.required;
      tariffInput.setAttribute('aria-required', String(semantics.required));
    }
  };

  const updateMode = ({ notify = true } = {}) => {
    const mode = activeMode();
    panels.forEach((panel) => togglePanel(panel, panel.dataset.consumptionPanel === mode));
    updateTariffSemantics(mode);
    updateAnnualOutput();
    if (notify) onChange();
  };

  modeInputs.forEach((input) => input.addEventListener('change', updateMode));
  root
    .querySelectorAll(
      '[data-consumption-bill], [data-consumption-usage], [data-consumption-month], [data-consumption-tariff]'
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
    const annual =
      values.annual ??
      (values.usage === null
        ? demoMonthlyProfile.reduce((sum, value) => sum + value, 0)
        : values.usage * 12);
    if (monthlyInputs.length !== 12) return;

    const monthlyMode = modeInputs.find((input) => input.value === 'monthly');
    if (monthlyMode) monthlyMode.checked = true;
    const average = annual / 12;
    monthlyInputs.forEach((input, index) => {
      input.value = String(Math.round((demoMonthlyProfile[index] / 4920) * average * 12));
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

  const inspect = () => {
    const mode = activeMode();
    const tariff = customTariff(tariffInput?.value);
    const userTariff = tariff === null ? null : { rateAmdPerKwh: tariff };
    if (mode === 'bill') {
      const input = root.querySelector('[data-consumption-bill]');
      const value = monthlyBill(input?.value);
      if (value === null) return invalidResult([input], strings.invalidBill);
      if (tariff === null) return invalidResult([tariffInput], strings.invalidTariff);
      if (!isCalculatorInputInRange(value / tariff, 'averageMonthlyConsumptionKwh')) {
        return invalidResult([input, tariffInput], strings.invalidBill);
      }
      return {
        valid: true,
        value: { mode, averageMonthlyBillAmd: value },
        tariff: userTariff
      };
    }

    if (mode === 'usage') {
      const input = root.querySelector('[data-consumption-usage]');
      const value = monthlyUsage(input?.value);
      return value === null
        ? invalidResult([input], strings.invalidUsage)
        : { valid: true, value: { mode, averageMonthlyKwh: value }, tariff: userTariff };
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
    return { valid: true, value: { mode, monthlyKwh }, tariff: userTariff };
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
