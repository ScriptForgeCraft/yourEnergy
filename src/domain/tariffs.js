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
  status: record?.status === 'confirmed' ? 'confirmed' : 'unavailable',
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
      available: false,
      requestedDate,
      dataset: metadata,
      tariff: candidate,
      reason: 'UNVERIFIED_TARIFF',
      source: candidate.source
    };
  }

  return {
    available: true,
    requestedDate,
    dataset: metadata,
    tariff: candidate,
    reason: 'CONFIRMED_TARIFF',
    source: candidate.source
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

export const isConfirmedTariff = (selectionOrTariff) =>
  getConfirmedTariffRate(selectionOrTariff) !== null;
