import { ARMENIA_TARIFF_DATASET } from '../data/tariffs/armenia.js';
import { cleanString, toPositiveNumberOrNull } from './numbers.js';
import { SOURCE_KIND, SOURCE_STATUS } from './models.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;

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

const normalizeRecord = (record, currency) => ({
  id: cleanString(record?.id),
  effectiveFrom: toIsoDate(record?.effectiveFrom),
  effectiveTo: toIsoDate(record?.effectiveTo),
  status:
    record?.status === 'confirmed'
      ? 'confirmed'
      : record?.status === 'provided'
        ? 'provided'
        : 'unavailable',
  rateAmdPerKwh: toPositiveNumberOrNull(record?.rateAmdPerKwh),
  currency: cleanString(record?.currency) ?? currency ?? 'AMD',
  source: normalizeSource(record?.source)
});

const isEffectiveOn = (record, requestedDate) =>
  record.effectiveFrom &&
  record.effectiveFrom <= requestedDate &&
  (!record.effectiveTo || record.effectiveTo >= requestedDate);

const canUseRecord = (record) =>
  record.status === 'confirmed' &&
  record.rateAmdPerKwh !== null &&
  record.currency === 'AMD' &&
  record.source.status === SOURCE_STATUS.CONFIRMED &&
  Boolean(record.source.verifiedAt);

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
  const metadata = {
    id: cleanString(dataset?.id),
    schemaVersion: cleanString(dataset?.schemaVersion),
    revision: cleanString(dataset?.revision),
    countryCode: cleanString(dataset?.countryCode),
    currency: cleanString(dataset?.currency) ?? 'AMD',
    reviewedAt: toIsoDate(dataset?.reviewedAt)
  };

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

  const records = Array.isArray(dataset?.records)
    ? dataset.records.map((record) => normalizeRecord(record, metadata.currency))
    : [];
  const candidate = records
    .filter((record) => isEffectiveOn(record, requestedDate))
    .sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom))[0];

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
 * A rate copied from the visitor's electricity bill. It is usable for a
 * preliminary planning calculation, but it deliberately remains distinct
 * from a confirmed tariff-registry record in the Passport and source ledger.
 */
export const createUserTariffSelection = (input = {}, effectiveDate = new Date()) => {
  const rateAmdPerKwh = toPositiveNumberOrNull(
    typeof input === 'object' && input !== null ? input.rateAmdPerKwh : input
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
