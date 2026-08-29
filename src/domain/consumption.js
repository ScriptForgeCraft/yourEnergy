import { SOURCE_KIND, SOURCE_STATUS } from './models.js';
import {
  MONTHS_PER_YEAR,
  sum,
  toNonNegativeNumberOrNull,
  toPositiveNumberOrNull
} from './numbers.js';
import { getConfirmedTariffRate } from './tariffs.js';

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

  const profile = value.map(toNonNegativeNumberOrNull);
  if (profile.some((item) => item === null)) {
    return { profile: null, issue: 'MONTHLY_PROFILE_INVALID' };
  }
  if (sum(profile) <= 0) return { profile: null, issue: 'ZERO_CONSUMPTION' };
  return { profile, issue: null };
};

/**
 * Turns manual household consumption inputs into a safe, comparable model.
 * Precedence is monthly profile, annual kWh, average monthly kWh, then a bill
 * divided by a confirmed tariff. No seasonal profile is invented when only an
 * annual or bill value exists.
 *
 * @param {{monthlyKwh?: unknown[], annualKwh?: unknown, averageMonthlyKwh?: unknown, averageMonthlyBillAmd?: unknown}} [input]
 * @param {{tariff?: Object|null}} [options]
 * @returns {import('./models.js').Consumption}
 */
export const normalizeConsumption = (input = {}, { tariff = null } = {}) => {
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

  const annualKwh = toPositiveNumberOrNull(input.annualKwh);
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

  const averageMonthlyKwh = toPositiveNumberOrNull(input.averageMonthlyKwh);
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

  const averageMonthlyBillAmd = toPositiveNumberOrNull(input.averageMonthlyBillAmd);
  if (averageMonthlyBillAmd !== null) {
    const rateAmdPerKwh = getConfirmedTariffRate(tariff);
    if (rateAmdPerKwh === null) {
      return unavailableConsumption([...issues, 'CONFIRMED_TARIFF_REQUIRED_FOR_BILL']);
    }
    const billKwh = averageMonthlyBillAmd / rateAmdPerKwh;
    return {
      normalized: true,
      kind: 'monthly-bill',
      available: true,
      annualKwh: billKwh * MONTHS_PER_YEAR,
      monthlyKwh: null,
      averageMonthlyKwh: billKwh,
      averageMonthlyBillAmd,
      issues,
      source: manualSource
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
