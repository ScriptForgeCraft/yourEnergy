const positiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const nonNegativeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

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

  const modeInputs = [...root.querySelectorAll('input[name="consumption-mode"]')];
  const panels = [...root.querySelectorAll('[data-consumption-panel]')];
  const annualOutput = root.querySelector('[data-consumption-annual]');
  const tariffInput = root.querySelector('[data-consumption-tariff]');
  const tariffLabel = root.querySelector('[data-consumption-tariff-label]');
  const tariffHelp = root.querySelector('[data-consumption-tariff-help]');

  const activeMode = () => modeInputs.find((input) => input.checked)?.value ?? 'bill';

  const updateAnnualOutput = () => {
    const mode = activeMode();
    const usage = positiveNumber(root.querySelector('[data-consumption-usage]')?.value);
    const tariff = positiveNumber(tariffInput?.value);
    const monthly = [...root.querySelectorAll('[data-consumption-month]')].map((input) =>
      nonNegativeNumber(input.value)
    );
    let annual = null;
    const bill = positiveNumber(root.querySelector('[data-consumption-bill]')?.value);
    if (mode === 'bill' && bill !== null && tariff !== null) annual = (bill / tariff) * 12;
    if (mode === 'usage' && usage !== null) annual = usage * 12;
    if (mode === 'monthly' && monthly.length === 12 && monthly.every((value) => value !== null)) {
      annual = monthly.reduce((total, value) => total + value, 0);
    }
    if (annualOutput) annualOutput.textContent = annual === null ? '—' : String(Math.round(annual));
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
  root.querySelectorAll('input[type="number"]').forEach((input) => {
    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      updateAnnualOutput();
      onChange();
    });
  });
  updateMode({ notify: false });

  const invalidResult = (inputs, message) => ({
    valid: false,
    message,
    inputs: inputs.filter(Boolean)
  });

  const inspect = () => {
    const mode = activeMode();
    const tariff = positiveNumber(tariffInput?.value);
    const userTariff = tariff === null ? null : { rateAmdPerKwh: tariff };
    if (mode === 'bill') {
      const input = root.querySelector('[data-consumption-bill]');
      const value = positiveNumber(input?.value);
      if (value === null) return invalidResult([input], strings.invalidBill);
      if (tariff === null) return invalidResult([tariffInput], strings.invalidTariff);
      return {
        valid: true,
        value: { mode, averageMonthlyBillAmd: value },
        tariff: userTariff
      };
    }

    if (mode === 'usage') {
      const input = root.querySelector('[data-consumption-usage]');
      const value = positiveNumber(input?.value);
      return value === null
        ? invalidResult([input], strings.invalidUsage)
        : { valid: true, value: { mode, averageMonthlyKwh: value }, tariff: userTariff };
    }

    const inputs = [...root.querySelectorAll('[data-consumption-month]')];
    const monthlyKwh = inputs.map((input) => nonNegativeNumber(input.value));
    if (
      monthlyKwh.length !== 12 ||
      monthlyKwh.some((value) => value === null) ||
      monthlyKwh.reduce((total, value) => total + value, 0) <= 0
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
