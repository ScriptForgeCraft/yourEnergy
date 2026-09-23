import { ARMENIA_TARIFF_DATASET } from '../data/tariffs/armenia.js';
import { ARMENIA_SURPLUS_COMPENSATION_DATASET } from '../data/regulatory/armenia-surplus-compensation.js';
import { getCalculatorInputNumber } from './calculator-inputs.js';
import { cleanString, toFiniteNumberOrNull, toPositiveNumberOrNull } from './numbers.js';
import { SOURCE_KIND, SOURCE_STATUS } from './models.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;

export const TARIFF_PERIOD = Object.freeze({
  DAY: 'day',
  NIGHT: 'night',
  CUSTOM: 'custom'
});

const unavailableSource = Object.freeze({
  kind: SOURCE_KIND.UNAVAILABLE,
  status: SOURCE_STATUS.UNAVAILABLE,
  provider: null,
  reference: null,
  verifiedAt: null
});

const isIsoDate = (value) => {
  if (!ISO_DATE.test(String(value ?? ''))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const toIsoDate = (value) => {
  if (typeof value === 'string' && isIsoDate(value)) return value;
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
};

const normalizeSource = (source = {}) => ({
  kind: source.kind ?? SOURCE_KIND.UNAVAILABLE,
  status: source.status ?? SOURCE_STATUS.UNAVAILABLE,
  provider: cleanString(source.provider),
  reference: cleanString(source.reference),
  verifiedAt: toIsoDate(source.verifiedAt)
});

const nonNegativeNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = toFiniteNumberOrNull(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const normalizeCustomerType = (value) =>
  value === 'standard' || value === 'social-vulnerable' ? value : null;

const normalizeRecord = (record, currency) => ({
  id: cleanString(record?.id),
  tariffId: cleanString(record?.tariffId),
  datasetRevision: cleanString(record?.datasetRevision),
  customerType: normalizeCustomerType(record?.customerType),
  period:
    record?.period === TARIFF_PERIOD.DAY || record?.period === TARIFF_PERIOD.NIGHT
      ? record.period
      : null,
  minMonthlyKwh: nonNegativeNumberOrNull(record?.minMonthlyKwh),
  minMonthlyKwhInclusive: record?.minMonthlyKwhInclusive !== false,
  maxMonthlyKwh: nonNegativeNumberOrNull(record?.maxMonthlyKwh),
  effectiveFrom: toIsoDate(record?.effectiveFrom),
  effectiveTo: toIsoDate(record?.effectiveTo),
  status:
    record?.status === 'confirmed'
      ? 'confirmed'
      : record?.status === 'provided'
        ? 'provided'
        : 'unavailable',
  rateAmdPerKwh: toPositiveNumberOrNull(record?.rateAmdPerKwh),
  dayRate: toPositiveNumberOrNull(record?.dayRate),
  nightRate: toPositiveNumberOrNull(record?.nightRate),
  currency: cleanString(record?.currency) ?? currency ?? 'AMD',
  source: normalizeSource(record?.source)
});

const isEffectiveOn = (record, requestedDate) =>
  record.effectiveFrom &&
  record.effectiveFrom <= requestedDate &&
  (!record.effectiveTo || record.effectiveTo >= requestedDate);

const hasConfirmedSource = (record) =>
  record.status === 'confirmed' &&
  record.currency === 'AMD' &&
  record.source.status === SOURCE_STATUS.CONFIRMED &&
  Boolean(record.source.verifiedAt);

const canUseRecord = (record) => hasConfirmedSource(record) && record.rateAmdPerKwh !== null;

const canUseTimeOfUseRecord = (record) =>
  hasConfirmedSource(record) &&
  record.customerType !== null &&
  record.dayRate !== null &&
  record.nightRate !== null;

const datasetMetadata = (dataset) => ({
  id: cleanString(dataset?.id),
  schemaVersion: cleanString(dataset?.schemaVersion),
  revision: cleanString(dataset?.revision),
  countryCode: cleanString(dataset?.countryCode),
  currency: cleanString(dataset?.currency) ?? 'AMD',
  reviewedAt: toIsoDate(dataset?.reviewedAt)
});

const normalizedRecords = (dataset, requestedDate) => {
  const metadata = datasetMetadata(dataset);
  const records = Array.isArray(dataset?.records)
    ? dataset.records.map((record) => normalizeRecord(record, metadata.currency))
    : [];
  return { metadata, records: records.filter((record) => isEffectiveOn(record, requestedDate)) };
};

const normalizeSurplusCompensationRecord = (record, currency) => ({
  id: cleanString(record?.id),
  datasetRevision: cleanString(record?.datasetRevision),
  effectiveFrom: toIsoDate(record?.effectiveFrom),
  effectiveTo: toIsoDate(record?.effectiveTo),
  status: record?.status === 'confirmed' ? 'confirmed' : 'unavailable',
  rateAmdPerKwh: toPositiveNumberOrNull(record?.rateAmdPerKwh),
  currency: cleanString(record?.currency) ?? currency ?? 'AMD',
  source: normalizeSource(record?.source)
});

const hasConfirmedSurplusCompensation = (record) =>
  record.status === 'confirmed' &&
  record.currency === 'AMD' &&
  record.rateAmdPerKwh !== null &&
  record.source.kind === SOURCE_KIND.REGISTRY &&
  record.source.status === SOURCE_STATUS.CONFIRMED &&
  Boolean(record.source.verifiedAt);

/**
 * Selects a dated, verified surplus-compensation record. It is deliberately
 * separate from consumer retail tariffs: an empty registry does not imply that
 * excess generation is worth the retail electricity rate.
 */
export const selectEffectiveSurplusCompensation = (
  dataset = ARMENIA_SURPLUS_COMPENSATION_DATASET,
  effectiveDate = new Date()
) => {
  const requestedDate = toIsoDate(effectiveDate);
  const metadata = datasetMetadata(dataset);
  if (!requestedDate) {
    return {
      kind: 'regulatory-registry',
      available: false,
      requestedDate: null,
      dataset: metadata,
      compensation: null,
      reason: 'INVALID_EFFECTIVE_DATE',
      source: unavailableSource
    };
  }

  const records = Array.isArray(dataset?.records)
    ? dataset.records
        .map((record) => normalizeSurplusCompensationRecord(record, metadata.currency))
        .filter((record) => isEffectiveOn(record, requestedDate))
    : [];
  if (!records.length) {
    return {
      kind: 'regulatory-registry',
      available: false,
      requestedDate,
      dataset: metadata,
      compensation: null,
      reason: 'SURPLUS_COMPENSATION_NOT_CONFIGURED',
      source: normalizeSource(dataset?.source)
    };
  }

  const candidate = records.sort((left, right) =>
    right.effectiveFrom.localeCompare(left.effectiveFrom)
  )[0];
  if (!hasConfirmedSurplusCompensation(candidate)) {
    return {
      kind: 'regulatory-registry',
      available: false,
      requestedDate,
      dataset: metadata,
      compensation: candidate,
      reason: 'UNVERIFIED_SURPLUS_COMPENSATION',
      source: candidate.source
    };
  }

  return {
    kind: 'regulatory-registry',
    available: true,
    requestedDate,
    dataset: metadata,
    compensation: {
      ...candidate,
      datasetRevision: metadata.revision
    },
    reason: 'CONFIRMED_SURPLUS_COMPENSATION',
    source: candidate.source
  };
};

/** Returns only a verified, dated regulatory surplus-compensation rate. */
export const getUsableSurplusCompensationRate = (selectionOrCompensation) => {
  const selection = selectionOrCompensation?.compensation ? selectionOrCompensation : null;
  const compensation = selection?.compensation ?? selectionOrCompensation;
  const normalized = normalizeSurplusCompensationRecord(compensation, compensation?.currency);
  return selection && selection.available && hasConfirmedSurplusCompensation(normalized)
    ? normalized.rateAmdPerKwh
    : null;
};

/**
 * Selects the most recently effective tariff record for a date. It returns an
 * unavailable result for an empty, stale, unverified, or malformed registry;
 * callers must not infer a savings amount in that state.
 *
 * @param {Object} [dataset]
 * @param {string|Date} [effectiveDate]
 * @returns {{available: boolean, requestedDate: string|null, dataset: Object, tariff: Object|null, reason: string, source: Object}}
 */
export const selectEffectiveTariff = (
  dataset = ARMENIA_TARIFF_DATASET,
  effectiveDate = new Date()
) => {
  const requestedDate = toIsoDate(effectiveDate);
  const metadata = datasetMetadata(dataset);

  if (!requestedDate) {
    return {
      kind: 'registry',
      available: false,
      requestedDate: null,
      dataset: metadata,
      tariff: null,
      reason: 'INVALID_EFFECTIVE_DATE',
      source: unavailableSource
    };
  }

  const { records } = normalizedRecords(dataset, requestedDate);
  const candidate = records.sort((left, right) =>
    right.effectiveFrom.localeCompare(left.effectiveFrom)
  )[0];

  if (!candidate) {
    return {
      kind: 'registry',
      available: false,
      requestedDate,
      dataset: metadata,
      tariff: null,
      reason: 'NO_EFFECTIVE_TARIFF',
      source: normalizeSource(dataset?.source)
    };
  }

  if (canUseTimeOfUseRecord(candidate)) {
    return {
      kind: 'registry',
      available: false,
      requestedDate,
      dataset: metadata,
      tariff: null,
      reason: 'TARIFF_SELECTION_REQUIRED',
      source: candidate.source
    };
  }

  if (!canUseRecord(candidate)) {
    return {
      kind: 'registry',
      available: false,
      requestedDate,
      dataset: metadata,
      tariff: candidate,
      reason: 'UNVERIFIED_TARIFF',
      source: candidate.source
    };
  }

  return {
    kind: 'registry',
    available: true,
    requestedDate,
    dataset: metadata,
    tariff: candidate,
    reason: 'CONFIRMED_TARIFF',
    source: candidate.source
  };
};

/**
 * Returns only dated, verified time-of-use records. The browser may use this
 * public data to present choices, but the API repeats the same selection by
 * ID and period so a client cannot supply its own registry rate.
 */
export const listRegistryTariffOptions = (
  dataset = ARMENIA_TARIFF_DATASET,
  effectiveDate = new Date()
) => {
  const requestedDate = toIsoDate(effectiveDate);
  const metadata = datasetMetadata(dataset);
  if (!requestedDate)
    return { available: false, requestedDate: null, dataset: metadata, records: [] };
  const { records } = normalizedRecords(dataset, requestedDate);
  return {
    available: true,
    requestedDate,
    dataset: metadata,
    records: records.filter(canUseTimeOfUseRecord)
  };
};

/**
 * Uses the registry's explicit inclusive/exclusive lower boundary. This keeps
 * decimal consumption continuous between adjacent tariff brackets.
 */
export const tariffBracketIncludesMonthlyKwh = (record, monthlyKwh) => {
  const consumption = getCalculatorInputNumber(monthlyKwh, 'averageMonthlyConsumptionKwh');
  const normalized = normalizeRecord(record, record?.currency);
  if (
    consumption === null ||
    normalized.customerType !== 'standard' ||
    normalized.minMonthlyKwh === null
  ) {
    return false;
  }
  const meetsMinimum = normalized.minMonthlyKwhInclusive
    ? consumption >= normalized.minMonthlyKwh
    : consumption > normalized.minMonthlyKwh;
  return (
    meetsMinimum && (normalized.maxMonthlyKwh === null || consumption <= normalized.maxMonthlyKwh)
  );
};

/** Suggests the applicable standard bracket without choosing day/night. */
export const suggestStandardTariff = (
  monthlyKwh,
  dataset = ARMENIA_TARIFF_DATASET,
  effectiveDate = new Date()
) => {
  const options = listRegistryTariffOptions(dataset, effectiveDate);
  if (!options.available) return null;
  return (
    options.records.find((record) => tariffBracketIncludesMonthlyKwh(record, monthlyKwh)) ?? null
  );
};

/**
 * Resolves an explicit, official day/night tariff choice. No default period,
 * social status, or bracket is inferred by this helper.
 */
export const createRegistryTariffSelection = (
  { tariffId, period } = {},
  dataset = ARMENIA_TARIFF_DATASET,
  effectiveDate = new Date()
) => {
  const requestedDate = toIsoDate(effectiveDate);
  const metadata = datasetMetadata(dataset);
  const normalizedPeriod =
    period === TARIFF_PERIOD.DAY || period === TARIFF_PERIOD.NIGHT ? period : null;
  if (!requestedDate || !normalizedPeriod) {
    return {
      kind: 'unavailable',
      available: false,
      requestedDate,
      dataset: metadata,
      tariff: null,
      reason: 'TARIFF_SELECTION_REQUIRED',
      source: normalizeSource(dataset?.source)
    };
  }

  const { records } = normalizedRecords(dataset, requestedDate);
  const record = records.find((candidate) => candidate.id === cleanString(tariffId));
  if (!record) {
    return {
      kind: 'unavailable',
      available: false,
      requestedDate,
      dataset: metadata,
      tariff: null,
      reason: 'TARIFF_NOT_FOUND',
      source: normalizeSource(dataset?.source)
    };
  }
  if (!canUseTimeOfUseRecord(record)) {
    return {
      kind: 'registry',
      available: false,
      requestedDate,
      dataset: metadata,
      tariff: record,
      reason: 'UNVERIFIED_TARIFF',
      source: record.source
    };
  }

  const rateAmdPerKwh = normalizedPeriod === TARIFF_PERIOD.DAY ? record.dayRate : record.nightRate;
  return {
    kind: 'registry',
    available: true,
    requestedDate,
    dataset: metadata,
    tariff: {
      id: `${record.id}-${normalizedPeriod}`,
      tariffId: record.id,
      datasetRevision: metadata.revision,
      customerType: record.customerType,
      period: normalizedPeriod,
      minMonthlyKwh: record.minMonthlyKwh,
      minMonthlyKwhInclusive: record.minMonthlyKwhInclusive,
      maxMonthlyKwh: record.maxMonthlyKwh,
      effectiveFrom: record.effectiveFrom,
      effectiveTo: record.effectiveTo,
      status: 'confirmed',
      rateAmdPerKwh,
      currency: record.currency,
      source: record.source
    },
    reason: 'CONFIRMED_TARIFF',
    source: record.source
  };
};

/**
 * A rate copied from the visitor's electricity bill. It is usable for a
 * preliminary planning calculation, but it deliberately remains distinct
 * from a confirmed tariff-registry record in the Passport and source ledger.
 */
export const createUserTariffSelection = (input = {}, effectiveDate = new Date()) => {
  const rateAmdPerKwh = getCalculatorInputNumber(
    typeof input === 'object' && input !== null ? input.rateAmdPerKwh : input,
    'customTariffAmdPerKwh'
  );
  const requestedDate = toIsoDate(effectiveDate);
  const source = {
    kind: SOURCE_KIND.MANUAL,
    status: rateAmdPerKwh === null ? SOURCE_STATUS.UNAVAILABLE : SOURCE_STATUS.PROVIDED,
    provider: rateAmdPerKwh === null ? null : 'User-provided electricity bill',
    reference: null,
    verifiedAt: null
  };

  if (rateAmdPerKwh === null || !requestedDate) {
    return {
      kind: 'unavailable',
      available: false,
      requestedDate,
      dataset: null,
      tariff: null,
      reason: rateAmdPerKwh === null ? 'USER_TARIFF_INVALID' : 'INVALID_EFFECTIVE_DATE',
      source
    };
  }

  return {
    kind: 'user',
    available: true,
    requestedDate,
    dataset: null,
    tariff: {
      id: 'user-entered-amd-per-kwh',
      tariffId: null,
      datasetRevision: null,
      customerType: 'user-provided',
      period: TARIFF_PERIOD.CUSTOM,
      effectiveFrom: requestedDate,
      effectiveTo: null,
      status: 'provided',
      rateAmdPerKwh,
      currency: 'AMD',
      source
    },
    reason: 'USER_PROVIDED_TARIFF',
    source
  };
};

/** Accepts either a tariff selection or a tariff record. */
export const getConfirmedTariffRate = (selectionOrTariff) => {
  const selection = selectionOrTariff?.tariff ? selectionOrTariff : null;
  const tariff = selection?.tariff ?? selectionOrTariff;
  const available = selection ? selection.available : true;
  const normalized = normalizeRecord(tariff, tariff?.currency);
  return available && canUseRecord(normalized) ? normalized.rateAmdPerKwh : null;
};

/**
 * Returns either a dated confirmed registry rate or a clearly-labelled rate
 * supplied by the visitor. Callers that need an official record must continue
 * to use getConfirmedTariffRate instead.
 */
export const getUsableTariffRate = (selectionOrTariff) => {
  const selection = selectionOrTariff?.tariff ? selectionOrTariff : null;
  if (selection?.kind === 'user' && selection.available) {
    const tariff = normalizeRecord(selection.tariff, selection.tariff?.currency);
    return tariff.currency === 'AMD' ? tariff.rateAmdPerKwh : null;
  }
  return getConfirmedTariffRate(selectionOrTariff);
};

export const isConfirmedTariff = (selectionOrTariff) =>
  getConfirmedTariffRate(selectionOrTariff) !== null;
