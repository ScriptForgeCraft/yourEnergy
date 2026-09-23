import { toFiniteNumberOrNull } from './numbers.js';

/**
 * Public-calculator plausibility guardrails. These are intentionally far above
 * household scale (100 GWh/year and 10 km² of roof), so they reject malformed
 * or operationally meaningless payloads without excluding commercial work.
 * They are safety bounds, not product, tariff, quote, or eligibility limits.
 */
export const CALCULATOR_INPUT_LIMITS = Object.freeze({
  annualConsumptionKwh: Object.freeze({ minimumExclusive: 0, maximum: 100_000_000 }),
  averageMonthlyConsumptionKwh: Object.freeze({
    minimumExclusive: 0,
    maximum: 100_000_000 / 12
  }),
  monthlyProfileKwh: Object.freeze({ minimum: 0, maximum: 100_000_000 }),
  averageMonthlyBillAmd: Object.freeze({ minimumExclusive: 0, maximum: 10_000_000_000 }),
  customTariffAmdPerKwh: Object.freeze({ minimumExclusive: 0, maximum: 1_000_000 }),
  roofAreaSqm: Object.freeze({ minimumExclusive: 0, maximum: 10_000_000 })
});

const withinLimits = (value, limits) => {
  if (value === null || !limits) return false;
  if (limits.minimum !== undefined && value < limits.minimum) return false;
  if (limits.minimumExclusive !== undefined && value <= limits.minimumExclusive) return false;
  if (limits.maximum !== undefined && value > limits.maximum) return false;
  return true;
};

/** Returns a finite, locale-tolerant number only when it fits the named field. */
export const getCalculatorInputNumber = (value, field) => {
  const parsed = toFiniteNumberOrNull(value);
  return withinLimits(parsed, CALCULATOR_INPUT_LIMITS[field]) ? parsed : null;
};

export const isCalculatorInputInRange = (value, field) =>
  withinLimits(value, CALCULATOR_INPUT_LIMITS[field]);
