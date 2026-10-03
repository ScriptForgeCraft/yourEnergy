import { SOURCE_KIND, SOURCE_STATUS } from './models.js';
import { MONTHS_PER_YEAR, sum } from './numbers.js';
import { getCalculatorInputNumber, isCalculatorInputInRange } from './calculator-inputs.js';
import { estimateStandardResidentialConsumptionFromBill, getUsableTariffRate } from './tariffs.js';

const unavailableSource = Object.freeze({
  kind: SOURCE_KIND.UNAVAILABLE,
  status: SOURCE_STATUS.UNAVAILABLE,
  provider: null,
  reference: null,
  verifiedAt: null
});

const manualSource = Object.freeze({
  kind: SOURCE_KIND.MANUAL,
  status: SOURCE_STATUS.PROVIDED,
  provider: null,
  reference: null,
  verifiedAt: null
});

const unavailableConsumption = (issues) => ({
  normalized: true,
  kind: 'unavailable',
  available: false,
  annualKwh: null,
  monthlyKwh: null,
  averageMonthlyKwh: null,
  averageMonthlyBillAmd: null,
  issues,
  source: unavailableSource
});

const normalizeMonthlyProfile = (value) => {
  if (!Array.isArray(value)) return { profile: null, issue: null };
  if (value.length !== MONTHS_PER_YEAR) return { profile: null, issue: 'MONTHLY_PROFILE_LENGTH' };

  const profile = value.map((item) => getCalculatorInputNumber(item, 'monthlyProfileKwh'));
  if (profile.some((item) => item === null)) {
    return { profile: null, issue: 'MONTHLY_PROFILE_INVALID' };
  }
  if (sum(profile) <= 0) return { profile: null, issue: 'ZERO_CONSUMPTION' };
  if (!isCalculatorInputInRange(sum(profile), 'annualConsumptionKwh')) {
    return { profile: null, issue: 'MONTHLY_PROFILE_OUT_OF_RANGE' };
  }
  return { profile, issue: null };
};

/**
 * Turns manual household consumption inputs into a safe, comparable model.
 * Precedence is monthly profile, annual kWh, average monthly kWh, then a bill.
 * No seasonal profile is invented when only an annual or bill value exists.
 * A bill with a user-provided effective rate is divided by that rate. Without
 * one, it is a clearly labelled estimate using the standard residential
 * daytime reference-rate assumption from the server-owned tariff registry.
 *
 * @param {{monthlyKwh?: unknown[], annualKwh?: unknown, averageMonthlyKwh?: unknown, averageMonthlyBillAmd?: unknown}} [input]
 * @param {{tariff?: Object|null}} [options]
 * @returns {import('./models.js').Consumption}
 */
export const normalizeConsumption = (
  input = {},
  { tariff = null, tariffDataset, effectiveDate } = {}
) => {
  const issues = [];
  const { profile, issue } = normalizeMonthlyProfile(input.monthlyKwh);
  if (issue) issues.push(issue);

  if (profile) {
    const annualKwh = sum(profile);
    return {
      normalized: true,
      kind: 'monthly-profile',
      available: true,
      annualKwh,
      monthlyKwh: [...profile],
      averageMonthlyKwh: annualKwh / MONTHS_PER_YEAR,
      averageMonthlyBillAmd: null,
      issues,
      source: manualSource
    };
  }

  const annualKwh = getCalculatorInputNumber(input.annualKwh, 'annualConsumptionKwh');
  if (annualKwh !== null) {
    return {
      normalized: true,
      kind: 'annual-kwh',
      available: true,
      annualKwh,
      monthlyKwh: null,
      averageMonthlyKwh: annualKwh / MONTHS_PER_YEAR,
      averageMonthlyBillAmd: null,
      issues,
      source: manualSource
    };
  }

  const averageMonthlyKwh = getCalculatorInputNumber(
    input.averageMonthlyKwh,
    'averageMonthlyConsumptionKwh'
  );
  if (averageMonthlyKwh !== null) {
    return {
      normalized: true,
      kind: 'monthly-average-kwh',
      available: true,
      annualKwh: averageMonthlyKwh * MONTHS_PER_YEAR,
      monthlyKwh: null,
      averageMonthlyKwh,
      averageMonthlyBillAmd: null,
      issues,
      source: manualSource
    };
  }

  const averageMonthlyBillAmd = getCalculatorInputNumber(
    input.averageMonthlyBillAmd,
    'averageMonthlyBillAmd'
  );
  if (averageMonthlyBillAmd !== null) {
    const rateAmdPerKwh = getUsableTariffRate(tariff);
    const estimate =
      rateAmdPerKwh === null
        ? estimateStandardResidentialConsumptionFromBill(
            averageMonthlyBillAmd,
            tariffDataset,
            effectiveDate
          )
        : null;
    if (rateAmdPerKwh === null && !estimate?.available) {
      return unavailableConsumption([...issues, 'STANDARD_RESIDENTIAL_ESTIMATE_UNAVAILABLE']);
    }
    const billKwh =
      rateAmdPerKwh === null ? estimate.estimatedMonthlyKwh : averageMonthlyBillAmd / rateAmdPerKwh;
    if (!isCalculatorInputInRange(billKwh, 'averageMonthlyConsumptionKwh')) {
      return unavailableConsumption([...issues, 'CONSUMPTION_VALUE_OUT_OF_RANGE']);
    }
    return {
      normalized: true,
      kind: rateAmdPerKwh === null ? 'estimated-from-monthly-bill' : 'monthly-bill',
      available: true,
      annualKwh: billKwh * MONTHS_PER_YEAR,
      monthlyKwh: null,
      averageMonthlyKwh: billKwh,
      averageMonthlyBillAmd,
      issues,
      source:
        rateAmdPerKwh === null
          ? {
              kind: SOURCE_KIND.REGISTRY,
              status: SOURCE_STATUS.ESTIMATED,
              provider: estimate.source.provider,
              reference: estimate.source.reference,
              verifiedAt: estimate.source.verifiedAt
            }
          : manualSource,
      ...(rateAmdPerKwh === null
        ? {
            estimation: {
              assumption: estimate.assumption,
              resolution: estimate.resolution,
              tariffId: estimate.tariff.tariffId,
              rateAmdPerKwh: estimate.rateAmdPerKwh
            }
          }
        : {})
    };
  }

  if (input.annualKwh !== undefined || input.averageMonthlyKwh !== undefined) {
    issues.push('CONSUMPTION_VALUE_INVALID');
  }
  if (input.averageMonthlyBillAmd !== undefined && averageMonthlyBillAmd === null) {
    issues.push('BILL_VALUE_INVALID');
  }
  return unavailableConsumption(issues.length ? issues : ['CONSUMPTION_REQUIRED']);
};

export const isNormalizedConsumption = (value) =>
  Boolean(value?.normalized) &&
  typeof value.kind === 'string' &&
  typeof value.available === 'boolean' &&
  Array.isArray(value.issues);
