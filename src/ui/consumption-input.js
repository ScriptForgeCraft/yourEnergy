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
 * Accessible consumption-mode control. The result is raw user-provided data;
 * tariff conversion is intentionally performed server-side with a dated
 * tariff record rather than through a browser constant.
 */
export const initConsumptionInput = ({ root, strings, onChange = () => {} } = {}) => {
  if (!root) return null;

  const modeInputs = [...root.querySelectorAll('input[name="consumption-mode"]')];
  const panels = [...root.querySelectorAll('[data-consumption-panel]')];
  const annualOutput = root.querySelector('[data-consumption-annual]');
  const tariffInput = root.querySelector('[data-consumption-tariff]');

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

  const updateMode = () => {
    const mode = activeMode();
    panels.forEach((panel) => togglePanel(panel, panel.dataset.consumptionPanel === mode));
    updateAnnualOutput();
    onChange();
  };

  modeInputs.forEach((input) => input.addEventListener('change', updateMode));
  root.querySelectorAll('input[type="number"]').forEach((input) => {
    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      updateAnnualOutput();
      onChange();
    });
  });
  updateMode();

  const setInvalid = (inputs, message) => {
    inputs.filter(Boolean).forEach((input) => input.setAttribute('aria-invalid', 'true'));
    return { valid: false, message };
  };

  return {
    read() {
      const mode = activeMode();
      const tariff = positiveNumber(tariffInput?.value);
      const userTariff = tariff === null ? null : { rateAmdPerKwh: tariff };
      if (mode === 'bill') {
        const input = root.querySelector('[data-consumption-bill]');
        const value = positiveNumber(input?.value);
        if (value === null) {
          return setInvalid([input], strings.invalidBill);
        }
        if (tariff === null) {
          return setInvalid([tariffInput], strings.invalidTariff);
        }
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
          ? setInvalid([input], strings.invalidUsage)
          : { valid: true, value: { mode, averageMonthlyKwh: value }, tariff: userTariff };
      }

      const inputs = [...root.querySelectorAll('[data-consumption-month]')];
      const monthlyKwh = inputs.map((input) => nonNegativeNumber(input.value));
      if (
        monthlyKwh.length !== 12 ||
        monthlyKwh.some((value) => value === null) ||
        monthlyKwh.reduce((total, value) => total + value, 0) <= 0
      ) {
        return setInvalid(inputs, strings.incompleteMonths);
      }
      return { valid: true, value: { mode, monthlyKwh }, tariff: userTariff };
    },
    resetValidation() {
      root
        .querySelectorAll('[aria-invalid="true"]')
        .forEach((input) => input.removeAttribute('aria-invalid'));
    }
  };
};
