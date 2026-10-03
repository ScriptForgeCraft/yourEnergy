import { ARMENIA_TARIFF_DATASET } from '../data/tariffs/armenia.js';
import { ARMENIA_SURPLUS_COMPENSATION_DATASET } from '../data/regulatory/armenia-surplus-compensation.js';
import { getCalculatorInputNumber } from './calculator-inputs.js';
import { cleanString, toFiniteNumberOrNull, toPositiveNumberOrNull } from './numbers.js';
import { SOURCE_KIND, SOURCE_STATUS } from './models.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;

const TARIFF_PERIOD = Object.freeze({
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

const toIsoDate = (value) => {
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

const normalizeCustomerType = (value) => (value === 'standard' ? value : null);

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
 * Returns dated, verified standard residential records. Day/night rates remain
 * in the regulatory dataset, but consumer flows use the daytime rate as their
 * documented deterministic reference assumption rather than presenting a
 * time-of-use choice.
 */
const listRegistryTariffOptions = (
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

const STANDARD_RESIDENTIAL_DAY_RATE_ASSUMPTION =
  'STANDARD_RESIDENTIAL_DAY_RATE_REFERENCE_FOR_PRELIMINARY_ESTIMATE';
const BRACKET_BOUNDARY_EPSILON_KWH = 0.01;

const createAutomaticSelectionFromRecord = (record, metadata, requestedDate) => ({
  kind: 'automatic-standard-residential',
  available: true,
  requestedDate,
  dataset: metadata,
  tariff: {
    id: `${record.id}-automatic-day-reference`,
    tariffId: record.id,
    datasetRevision: metadata.revision,
    customerType: 'standard',
    // This describes the server's product assumption, never a customer
    // selection exposed in the calculator UI.
    period: TARIFF_PERIOD.DAY,
    minMonthlyKwh: record.minMonthlyKwh,
    minMonthlyKwhInclusive: record.minMonthlyKwhInclusive,
    maxMonthlyKwh: record.maxMonthlyKwh,
    effectiveFrom: record.effectiveFrom,
    effectiveTo: record.effectiveTo,
    status: 'confirmed',
    rateAmdPerKwh: record.dayRate,
    currency: record.currency,
    source: record.source,
    tariffSource: 'automatic-standard-residential',
    assumption: STANDARD_RESIDENTIAL_DAY_RATE_ASSUMPTION
  },
  reason: 'AUTOMATIC_STANDARD_RESIDENTIAL_TARIFF',
  source: record.source,
  assumption: STANDARD_RESIDENTIAL_DAY_RATE_ASSUMPTION
});

/**
 * Resolves the standard residential bracket from known monthly kWh. The
 * regulatory rate remains server-owned; no ID, customer category or
 * day/night choice from a browser is accepted.
 */
export const createAutomaticStandardResidentialTariff = (
  monthlyKwh,
  dataset = ARMENIA_TARIFF_DATASET,
  effectiveDate = new Date()
) => {
  const requestedDate = toIsoDate(effectiveDate);
  const metadata = datasetMetadata(dataset);
  const record = suggestStandardTariff(monthlyKwh, dataset, effectiveDate);
  if (!requestedDate || !record) {
    return {
      kind: 'unavailable',
      available: false,
      requestedDate,
      dataset: metadata,
      tariff: null,
      reason: 'STANDARD_RESIDENTIAL_TARIFF_UNAVAILABLE',
      source: normalizeSource(dataset?.source),
      assumption: STANDARD_RESIDENTIAL_DAY_RATE_ASSUMPTION
    };
  }
  return createAutomaticSelectionFromRecord(record, metadata, requestedDate);
};

const standardResidentialRecords = (dataset, requestedDate) => {
  const { metadata, records } = normalizedRecords(dataset, requestedDate);
  return {
    metadata,
    records: records.filter(
      (record) => record.customerType === 'standard' && canUseTimeOfUseRecord(record)
    )
  };
};

const lowerBoundaryKwh = (record) => {
  if (record.minMonthlyKwh === null) return null;
  return record.minMonthlyKwhInclusive
    ? record.minMonthlyKwh
    : record.minMonthlyKwh + BRACKET_BOUNDARY_EPSILON_KWH;
};

/**
 * Estimates consumption from a bill using one explicit product assumption:
 * the standard residential daytime rate is a reference rate. The calculation
 * is deliberately non-iterative. If a bill falls in a pricing discontinuity
 * between brackets, it snaps to the nearest valid bracket boundary; ties use
 * the lower-consumption boundary. This makes the result stable around 200 and
 * 400 kWh rather than oscillating between brackets.
 */
export const estimateStandardResidentialConsumptionFromBill = (
  monthlyBillAmd,
  dataset = ARMENIA_TARIFF_DATASET,
  effectiveDate = new Date()
) => {
  const bill = getCalculatorInputNumber(monthlyBillAmd, 'averageMonthlyBillAmd');
  const requestedDate = toIsoDate(effectiveDate);
  const { metadata, records } = standardResidentialRecords(dataset, requestedDate);
  const unavailable = (reason) => ({
    available: false,
    estimatedMonthlyKwh: null,
    tariff: null,
    rateAmdPerKwh: null,
    assumption: STANDARD_RESIDENTIAL_DAY_RATE_ASSUMPTION,
    resolution: null,
    reason,
    source: normalizeSource(dataset?.source)
  });
  if (bill === null) return unavailable('BILL_VALUE_INVALID');
  if (!requestedDate || !records.length)
    return unavailable('STANDARD_RESIDENTIAL_TARIFF_UNAVAILABLE');

  const exact = records
    .map((record) => ({ record, kwh: bill / record.dayRate }))
    .find(({ record, kwh }) => tariffBracketIncludesMonthlyKwh(record, kwh));
  if (exact) {
    return {
      available: true,
      estimatedMonthlyKwh: exact.kwh,
      tariff: createAutomaticSelectionFromRecord(exact.record, metadata, requestedDate).tariff,
      rateAmdPerKwh: exact.record.dayRate,
      assumption: STANDARD_RESIDENTIAL_DAY_RATE_ASSUMPTION,
      resolution: 'within-bracket',
      reason: 'ESTIMATED_FROM_MONTHLY_BILL',
      source: { ...exact.record.source, status: SOURCE_STATUS.ESTIMATED }
    };
  }

  const boundaries = records
    .flatMap((record) => {
      const points = [];
      if (record.maxMonthlyKwh !== null) {
        points.push({
          record,
          kwh: record.maxMonthlyKwh,
          bill: record.maxMonthlyKwh * record.dayRate
        });
      }
      const lower = lowerBoundaryKwh(record);
      if (lower !== null) points.push({ record, kwh: lower, bill: lower * record.dayRate });
      return points;
    })
    .sort(
      (left, right) =>
        Math.abs(left.bill - bill) - Math.abs(right.bill - bill) || left.kwh - right.kwh
    );
  const nearest = boundaries[0];
  if (!nearest) return unavailable('STANDARD_RESIDENTIAL_TARIFF_UNAVAILABLE');
  return {
    available: true,
    estimatedMonthlyKwh: nearest.kwh,
    tariff: createAutomaticSelectionFromRecord(nearest.record, metadata, requestedDate).tariff,
    rateAmdPerKwh: nearest.record.dayRate,
    assumption: STANDARD_RESIDENTIAL_DAY_RATE_ASSUMPTION,
    resolution: 'nearest-valid-boundary',
    reason: 'ESTIMATED_FROM_MONTHLY_BILL_BOUNDARY_FALLBACK',
    source: { ...nearest.record.source, status: SOURCE_STATUS.ESTIMATED }
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
      source,
      tariffSource: 'user-provided-effective-rate'
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
