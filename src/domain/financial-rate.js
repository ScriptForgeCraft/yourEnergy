import { getCalculatorInputNumber } from './calculator-inputs.js';

export const FINANCIAL_RATE_MODES = Object.freeze({
  STANDARD: 'standard',
  BILL_DERIVED: 'bill-derived',
  CUSTOM_EFFECTIVE: 'custom-effective',
  ACTUAL_DAY_NIGHT: 'actual-day-night'
});

export const FINANCIAL_RATE_SOURCE_TYPES = Object.freeze({
  STANDARD: 'automatic-standard-residential',
  BILL_DERIVED: 'bill-derived-effective-rate',
  CUSTOM_EFFECTIVE: 'user-provided-effective-rate',
  ACTUAL_DAY_NIGHT: 'actual-day-night'
});

const MODE_TO_SOURCE = Object.freeze({
  [FINANCIAL_RATE_MODES.STANDARD]: FINANCIAL_RATE_SOURCE_TYPES.STANDARD,
  [FINANCIAL_RATE_MODES.BILL_DERIVED]: FINANCIAL_RATE_SOURCE_TYPES.BILL_DERIVED,
  [FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE]: FINANCIAL_RATE_SOURCE_TYPES.CUSTOM_EFFECTIVE,
  [FINANCIAL_RATE_MODES.ACTUAL_DAY_NIGHT]: FINANCIAL_RATE_SOURCE_TYPES.ACTUAL_DAY_NIGHT
});

const SOURCE_TO_MODE = Object.freeze(
  Object.fromEntries(Object.entries(MODE_TO_SOURCE).map(([mode, sourceType]) => [sourceType, mode]))
);

const billInputs = (consumption = {}) => ({
  billAmd: getCalculatorInputNumber(
    consumption.billAmd ?? consumption.averageMonthlyBillAmd,
    'averageMonthlyBillAmd'
  ),
  billedKwh: getCalculatorInputNumber(consumption.billedKwh, 'averageMonthlyConsumptionKwh')
});

export const deriveEffectiveRateFromBill = ({ billAmd, billedKwh } = {}) => {
  const bill = getCalculatorInputNumber(billAmd, 'averageMonthlyBillAmd');
  const consumption = getCalculatorInputNumber(billedKwh, 'averageMonthlyConsumptionKwh');
  if (bill === null || consumption === null) return null;
  return getCalculatorInputNumber(bill / consumption, 'customTariffAmdPerKwh');
};

export const hasBillDerivedRate = (consumption) => {
  const { billAmd, billedKwh } = billInputs(consumption);
  return deriveEffectiveRateFromBill({ billAmd, billedKwh }) !== null;
};

export const createStandardFinancialRate = ({ explicit = false } = {}) => ({
  mode: FINANCIAL_RATE_MODES.STANDARD,
  sourceType: FINANCIAL_RATE_SOURCE_TYPES.STANDARD,
  ...(explicit ? { explicit: true } : {})
});

/** Default selection for a consumption form that has no explicit choice yet. */
export const createDefaultFinancialRate = (consumption) =>
  consumption?.mode === 'bill' && hasBillDerivedRate(consumption)
    ? {
        mode: FINANCIAL_RATE_MODES.BILL_DERIVED,
        sourceType: FINANCIAL_RATE_SOURCE_TYPES.BILL_DERIVED
      }
    : createStandardFinancialRate();

/**
 * Normalizes the one active financial source. A calculated bill rate is never
 * persisted here: the bill amount and its same-period kWh remain authoritative
 * in the consumption input and are divided again by the server.
 */
export const resolveFinancialRateSource = ({
  mode,
  sourceType,
  consumption,
  effectiveRateAmdPerKwh,
  actualDayKwh,
  actualNightKwh,
  explicit = false
} = {}) => {
  const requestedMode = MODE_TO_SOURCE[mode] ? mode : SOURCE_TO_MODE[sourceType];

  if (requestedMode === FINANCIAL_RATE_MODES.BILL_DERIVED && hasBillDerivedRate(consumption)) {
    return {
      mode: FINANCIAL_RATE_MODES.BILL_DERIVED,
      sourceType: FINANCIAL_RATE_SOURCE_TYPES.BILL_DERIVED
    };
  }

  if (requestedMode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE) {
    const rate = getCalculatorInputNumber(effectiveRateAmdPerKwh, 'customTariffAmdPerKwh');
    if (rate !== null) {
      return {
        mode: FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE,
        sourceType: FINANCIAL_RATE_SOURCE_TYPES.CUSTOM_EFFECTIVE,
        effectiveRateAmdPerKwh: rate
      };
    }
  }

  if (requestedMode === FINANCIAL_RATE_MODES.ACTUAL_DAY_NIGHT) {
    const day = getCalculatorInputNumber(actualDayKwh, 'monthlyProfileKwh');
    const night = getCalculatorInputNumber(actualNightKwh, 'monthlyProfileKwh');
    const monthlyKwh = getCalculatorInputNumber(
      consumption?.averageMonthlyKwh,
      'averageMonthlyConsumptionKwh'
    );
    if (
      consumption?.mode === 'usage' &&
      day !== null &&
      night !== null &&
      day + night > 0 &&
      monthlyKwh !== null &&
      Math.abs(day + night - monthlyKwh) <= 0.01
    ) {
      return {
        mode: FINANCIAL_RATE_MODES.ACTUAL_DAY_NIGHT,
        sourceType: FINANCIAL_RATE_SOURCE_TYPES.ACTUAL_DAY_NIGHT,
        actualDayKwh: day,
        actualNightKwh: night
      };
    }
  }

  return createStandardFinancialRate({ explicit });
};

export const normalizeFinancialRate = (financialRate, consumption) =>
  resolveFinancialRateSource({
    mode: financialRate?.mode,
    sourceType: financialRate?.sourceType,
    consumption,
    effectiveRateAmdPerKwh: financialRate?.effectiveRateAmdPerKwh,
    actualDayKwh: financialRate?.actualDayKwh,
    actualNightKwh: financialRate?.actualNightKwh,
    explicit: financialRate?.explicit === true
  });

/** Browser-to-server contract. Derived rates deliberately contain no rate. */
export const toFinancialRateRequest = (financialRate, consumption) => {
  const normalized = normalizeFinancialRate(financialRate, consumption);
  if (normalized.mode === FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE) {
    return {
      sourceType: normalized.sourceType,
      effectiveRateAmdPerKwh: normalized.effectiveRateAmdPerKwh
    };
  }
  if (normalized.mode === FINANCIAL_RATE_MODES.ACTUAL_DAY_NIGHT) {
    return {
      sourceType: normalized.sourceType,
      actualDayKwh: normalized.actualDayKwh,
      actualNightKwh: normalized.actualNightKwh
    };
  }
  return { sourceType: normalized.sourceType };
};
