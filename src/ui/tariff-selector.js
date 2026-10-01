import { getCalculatorInputNumber } from '../domain/calculator-inputs.js';
import {
  ARMENIA_TARIFF_DATASET,
  createRegistryTariffSelection,
  suggestStandardTariff
} from '../domain/index.js';

export const DEFAULT_OFFICIAL_TARIFF = Object.freeze({
  tariffId: 'standard-over-400',
  period: 'day'
});

const STANDARD_TARIFF_IDS = new Set([
  'standard-up-to-200',
  'standard-201-to-400',
  'standard-over-400'
]);

const isPeriod = (value) => value === 'day' || value === 'night';
const customRate = (value) => getCalculatorInputNumber(value, 'customTariffAmdPerKwh');
const isStandardTariffId = (value) => STANDARD_TARIFF_IDS.has(value);
const interpolate = (template, values = {}) =>
  String(template ?? '').replace(/\{([a-zA-Z0-9_]+)\}/gu, (_match, key) => values[key] ?? '');

/**
 * The browser sends one of the two intentionally small tariff descriptors.
 * Registry rates are resolved again on the server; this client lookup exists
 * only to keep the editable field and bill-to-kWh preview understandable.
 */
export const normalizeTariffSelection = (value) => {
  if (value?.tariffId && isPeriod(value.period)) {
    return { tariffId: String(value.tariffId), period: value.period };
  }
  const rateAmdPerKwh = customRate(value?.rateAmdPerKwh);
  return rateAmdPerKwh === null ? { ...DEFAULT_OFFICIAL_TARIFF } : { rateAmdPerKwh };
};

export const isOfficialTariffSelection = (selection) =>
  Boolean(selection?.tariffId && isPeriod(selection.period));

export const resolveTariffSelectionRate = (selection) => {
  if (!isOfficialTariffSelection(selection)) return customRate(selection?.rateAmdPerKwh);
  return (
    createRegistryTariffSelection(selection, ARMENIA_TARIFF_DATASET)?.tariff?.rateAmdPerKwh ?? null
  );
};

/** Never derives a bracket from a bill: amounts and tariff brackets are circular. */
export const monthlyKwhForTariffSuggestion = (consumption) => {
  if (!consumption || typeof consumption !== 'object') return null;
  if (consumption.mode === 'usage') {
    return getCalculatorInputNumber(consumption.averageMonthlyKwh, 'averageMonthlyConsumptionKwh');
  }
  if (consumption.mode !== 'monthly' || !Array.isArray(consumption.monthlyKwh)) return null;
  if (consumption.monthlyKwh.length !== 12) return null;
  const monthly = consumption.monthlyKwh.map((value) =>
    getCalculatorInputNumber(value, 'monthlyProfileKwh')
  );
  if (monthly.some((value) => value === null)) return null;
  return getCalculatorInputNumber(
    monthly.reduce((total, value) => total + value, 0) / 12,
    'averageMonthlyConsumptionKwh'
  );
};

export const suggestOfficialTariffSelection = (selection, monthlyKwh) => {
  if (!isOfficialTariffSelection(selection) || !isStandardTariffId(selection.tariffId)) {
    return normalizeTariffSelection(selection);
  }
  const suggestion = suggestStandardTariff(monthlyKwh, ARMENIA_TARIFF_DATASET);
  return suggestion
    ? { tariffId: suggestion.id, period: selection.period }
    : normalizeTariffSelection(selection);
};

export const tariffCustomerType = (selection) =>
  selection?.tariffId === 'social-vulnerable' ? 'social-vulnerable' : 'standard';

export const formatTariffProvenance = ({
  tariff,
  strings = {},
  rate,
  formatRate = numericText
} = {}) => {
  const resolvedRate = rate ?? tariff?.rateAmdPerKwh;
  if (resolvedRate === null || resolvedRate === undefined) return strings.noTariff ?? '';
  if (tariff?.kind === 'registry' || tariff?.sourceType === 'registry-value' || tariff?.tariffId) {
    const category = strings.tariffCategories?.[tariff?.tariffId] ?? '';
    const period = tariff?.period === 'night' ? strings.tariffNight : strings.tariffDay;
    return [strings.officialTariff, category, period, `${formatRate(resolvedRate)} AMD/kWh`]
      .filter(Boolean)
      .join(' · ');
  }
  return [strings.userProvidedTariff ?? strings.customTariff, `${formatRate(resolvedRate)} AMD/kWh`]
    .filter(Boolean)
    .join(' · ');
};

const numericText = (value) =>
  Number.isFinite(Number(value)) ? String(Number(value)).replace(/\.0+$/u, '') : '';

/**
 * Shared progressive tariff UI for Quick and Professional calculators. Both
 * modes preserve the same serializable descriptor in calculator-session.
 */
export const initTariffSelector = ({
  root,
  strings = {},
  initialSelection,
  getMonthlyKwh = () => null,
  onChange = () => {}
} = {}) => {
  if (!root) return null;
  const selector = root.querySelector('[data-tariff-selector]') ?? root;
  const rateInput = selector.querySelector('[data-tariff-rate]');
  const disclosure = selector.querySelector('[data-tariff-disclosure]');
  const advanced = selector.querySelector('[data-tariff-advanced]');
  const suggestion = selector.querySelector('[data-tariff-suggestion]');
  const officialControls = selector.querySelector('[data-tariff-official-controls]');
  const customHelp = selector.querySelector('[data-tariff-custom-help]');
  const bracketControls = selector.querySelector('[data-tariff-brackets]');
  let selection = normalizeTariffSelection(initialSelection);

  const applySuggestion = () => {
    if (!isOfficialTariffSelection(selection) || tariffCustomerType(selection) !== 'standard') {
      return false;
    }
    const monthlyKwh = getMonthlyKwh();
    const suggested = suggestStandardTariff(monthlyKwh, ARMENIA_TARIFF_DATASET);
    if (!suggested) return false;
    selection = { tariffId: suggested.id, period: selection.period };
    return true;
  };

  const render = () => {
    const official = isOfficialTariffSelection(selection);
    const customerType = tariffCustomerType(selection);
    const hasSuggestion = official && customerType === 'standard' && applySuggestion();
    const rate = resolveTariffSelectionRate(selection);
    if (official && rateInput) rateInput.value = numericText(rate);
    selector.querySelectorAll('[data-tariff-mode]').forEach((control) => {
      control.checked = control.value === (official ? 'official' : 'custom');
    });
    selector.querySelectorAll('[data-tariff-customer]').forEach((control) => {
      control.checked = control.value === customerType;
      control.disabled = !official;
    });
    selector.querySelectorAll('[data-tariff-period]').forEach((control) => {
      control.checked = control.value === (official ? selection.period : 'day');
      control.disabled = !official;
    });
    selector.querySelectorAll('[data-tariff-bracket]').forEach((control) => {
      const active = official && control.dataset.tariffBracket === selection.tariffId;
      control.setAttribute('aria-pressed', String(active));
      control.classList.toggle('is-active', active);
      control.disabled = !official || customerType !== 'standard' || hasSuggestion;
    });
    if (officialControls) officialControls.hidden = !official;
    if (customHelp) customHelp.hidden = official;
    if (bracketControls) bracketControls.hidden = customerType !== 'standard' || hasSuggestion;
    if (suggestion) {
      suggestion.hidden = !hasSuggestion;
      if (hasSuggestion) {
        const label = strings.tariffCategories?.[selection.tariffId] ?? '';
        suggestion.textContent = interpolate(strings.tariffSuggested, { bracket: label });
      }
    }
  };

  const notify = () => {
    render();
    onChange(selection);
  };

  disclosure?.addEventListener('click', () => {
    const open = advanced?.hidden;
    if (advanced) advanced.hidden = !open;
    disclosure.setAttribute('aria-expanded', String(open));
  });
  selector.querySelectorAll('[data-tariff-mode]').forEach((control) =>
    control.addEventListener('change', () => {
      if (!control.checked) return;
      selection =
        control.value === 'official'
          ? { ...DEFAULT_OFFICIAL_TARIFF }
          : {
              rateAmdPerKwh: customRate(rateInput?.value) ?? resolveTariffSelectionRate(selection)
            };
      notify();
    })
  );
  selector.querySelectorAll('[data-tariff-customer]').forEach((control) =>
    control.addEventListener('change', () => {
      if (!control.checked || !isOfficialTariffSelection(selection)) return;
      selection = {
        tariffId: control.value === 'social-vulnerable' ? 'social-vulnerable' : 'standard-over-400',
        period: selection.period
      };
      notify();
    })
  );
  selector.querySelectorAll('[data-tariff-period]').forEach((control) =>
    control.addEventListener('change', () => {
      if (!control.checked || !isOfficialTariffSelection(selection) || !isPeriod(control.value))
        return;
      selection = { ...selection, period: control.value };
      notify();
    })
  );
  selector.querySelectorAll('[data-tariff-bracket]').forEach((control) =>
    control.addEventListener('click', () => {
      if (
        !isOfficialTariffSelection(selection) ||
        !isStandardTariffId(control.dataset.tariffBracket)
      )
        return;
      selection = { tariffId: control.dataset.tariffBracket, period: selection.period };
      notify();
    })
  );
  rateInput?.addEventListener('input', () => {
    const rateAmdPerKwh = customRate(rateInput.value);
    // Editing the apparent default is an explicit user action, even if the
    // resulting number happens to equal the previous official rate.
    selection = { rateAmdPerKwh: rateAmdPerKwh ?? rateInput.value };
    notify();
  });

  render();
  return Object.freeze({
    getSelection: () => ({ ...selection }),
    getRate: () => resolveTariffSelectionRate(selection),
    syncMonthlyConsumption: () => {
      const before = JSON.stringify(selection);
      render();
      if (before !== JSON.stringify(selection)) onChange(selection);
      return { ...selection };
    },
    focus: () => rateInput?.focus()
  });
};
