import { ARMENIA_PRICEBOOKS } from '../data/pricebooks/armenia.js';
import { cleanString, cloneSerializable, deepFreeze, toPositiveNumberOrNull } from './numbers.js';

export const PRICEBOOK_SYSTEM_TYPE = 'residential-grid-tied';
export const PRICEBOOK_STATUS = Object.freeze({
  TEMPORARY: 'temporary',
  CONFIRMED: 'confirmed'
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;
const REQUIRED_SCOPE = Object.freeze([
  'panels',
  'inverter',
  'mounting',
  'standard-installation',
  'basic-grid-connection'
]);

const toIsoDate = (value) => {
  if (typeof value === 'string' && ISO_DATE.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value) {
      return value;
    }
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString().slice(0, 10);
  return null;
};

const listOfStrings = (value) =>
  Array.isArray(value)
    ? [...new Set(value.map(cleanString).filter(Boolean))]
    : [];

const normalizeSource = (source = {}) => ({
  kind: cleanString(source.kind) ?? 'registry',
  status: cleanString(source.status) ?? 'estimated',
  provider: cleanString(source.provider),
  reference: cleanString(source.reference),
  verifiedAt: toIsoDate(source.verifiedAt)
});

export const normalizePriceBook = (input = {}) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const rates = input?.ratesAmdPerWp ?? {};
  const p25 = toPositiveNumberOrNull(rates.p25);
  const p50 = toPositiveNumberOrNull(rates.p50);
  const p75 = toPositiveNumberOrNull(rates.p75);
  const validFrom = toIsoDate(input.validFrom);
  const validUntil = toIsoDate(input.validUntil);
  const validRateOrder = p25 !== null && p50 !== null && p75 !== null && p25 <= p50 && p50 <= p75;
  const validDateRange = validFrom !== null && validUntil !== null && validFrom <= validUntil;

  if (!validRateOrder || !validDateRange || !cleanString(input.id) || !cleanString(input.version)) {
    return null;
  }

  return deepFreeze({
    id: cleanString(input.id),
    version: cleanString(input.version),
    status: input.status === PRICEBOOK_STATUS.CONFIRMED ? PRICEBOOK_STATUS.CONFIRMED : PRICEBOOK_STATUS.TEMPORARY,
    countryCode: cleanString(input.countryCode) ?? 'AM',
    region: cleanString(input.region) ?? 'all-armenia',
    systemType: cleanString(input.systemType) ?? PRICEBOOK_SYSTEM_TYPE,
    currency: cleanString(input.currency) ?? 'AMD',
    checkedAt: toIsoDate(input.checkedAt),
    validFrom,
    validUntil,
    ratesAmdPerWp: deepFreeze({ p25, p50, p75 }),
    scope: deepFreeze(listOfStrings(input.scope)),
    exclusions: deepFreeze(listOfStrings(input.exclusions)),
    confirmationRequired: deepFreeze(listOfStrings(input.confirmationRequired)),
    source: deepFreeze(normalizeSource(input.source))
  });
};

export const isPriceBookActive = (priceBook, at = new Date()) => {
  const normalized = normalizePriceBook(priceBook);
  const date = toIsoDate(at);
  return Boolean(normalized && date && normalized.validFrom <= date && normalized.validUntil >= date);
};

/**
 * A replaceable registry boundary for temporary and approved price books. It
 * returns no record after its stated validity date, rather than guessing a
 * successor price.
 */
export class PriceBookRepository {
  constructor({ records = ARMENIA_PRICEBOOKS, clock = () => new Date() } = {}) {
    this.records = Array.isArray(records) ? records.map(normalizePriceBook).filter(Boolean) : [];
    this.clock = clock;
  }

  getActive({ region = 'AM', systemType = PRICEBOOK_SYSTEM_TYPE, at = this.clock() } = {}) {
    const requestedDate = toIsoDate(at);
    const requestedRegion = cleanString(region)?.toUpperCase() ?? 'AM';
    const requestedSystemType = cleanString(systemType) ?? PRICEBOOK_SYSTEM_TYPE;
    if (!requestedDate || !['AM', 'ARMENIA', 'ALL-ARMENIA'].includes(requestedRegion)) return null;

    const candidate = this.records
      .filter(
        (record) =>
          record.systemType === requestedSystemType &&
          record.validFrom <= requestedDate &&
          record.validUntil >= requestedDate
      )
      .sort((left, right) => right.validFrom.localeCompare(left.validFrom))[0];

    return candidate ? cloneSerializable(candidate) : null;
  }
}

const roundTo = (value, increment = 10_000) =>
  Number.isFinite(value) ? Math.round(value / increment) * increment : null;

const unavailableEstimate = (reason) => ({
  available: false,
  kind: 'unavailable',
  reason,
  capacityKwp: null,
  priceBook: null,
  ratesAmdPerWp: null,
  rangeAmd: null,
  primaryAmd: null,
  scope: [],
  exclusions: [],
  confirmationRequired: []
});

/**
 * Builds a dated planning range for a standard grid-tied residence. It is not
 * a product offer, invoice, or substitute for a site survey.
 */
export const buildCommercialEstimate = ({ capacityKwp, priceBook, at = new Date() } = {}) => {
  const capacity = toPositiveNumberOrNull(capacityKwp);
  if (capacity === null) return unavailableEstimate('INVALID_CAPACITY');
  const normalized = normalizePriceBook(priceBook);
  if (!normalized) return unavailableEstimate('PRICEBOOK_UNAVAILABLE');
  if (!isPriceBookActive(normalized, at)) return unavailableEstimate('PRICEBOOK_EXPIRED');
  if (normalized.currency !== 'AMD') return unavailableEstimate('UNSUPPORTED_CURRENCY');

  const scale = capacity * 1_000;
  const rangeAmd = {
    p25: roundTo(scale * normalized.ratesAmdPerWp.p25),
    p50: roundTo(scale * normalized.ratesAmdPerWp.p50),
    p75: roundTo(scale * normalized.ratesAmdPerWp.p75)
  };

  return deepFreeze({
    available: true,
    kind: normalized.status === PRICEBOOK_STATUS.CONFIRMED ? 'confirmed' : 'temporary',
    reason: null,
    capacityKwp: capacity,
    currency: normalized.currency,
    priceBook: cloneSerializable(normalized),
    ratesAmdPerWp: cloneSerializable(normalized.ratesAmdPerWp),
    rangeAmd: deepFreeze(rangeAmd),
    primaryAmd: rangeAmd.p50,
    scope: cloneSerializable(normalized.scope),
    exclusions: cloneSerializable(normalized.exclusions),
    confirmationRequired: cloneSerializable(normalized.confirmationRequired),
    validUntil: normalized.validUntil
  });
};

const inclusionValue = (inclusions, key) => inclusions?.[key] === true;

/**
 * Compares a supplied third-party offer only when its scope is comparable to
 * the active standard grid-tied price book. It intentionally refuses a price
 * verdict for batteries or missing core line items.
 */
export const compareOffer = ({
  totalAmd,
  capacityKwp,
  systemType = PRICEBOOK_SYSTEM_TYPE,
  inclusions = {},
  priceBook,
  at = new Date()
} = {}) => {
  const total = toPositiveNumberOrNull(totalAmd);
  const capacity = toPositiveNumberOrNull(capacityKwp);
  const normalized = normalizePriceBook(priceBook);
  const missingInclusions = REQUIRED_SCOPE.filter((key) => !inclusionValue(inclusions, key));
  const reasons = [];

  if (total === null || capacity === null) reasons.push('OFFER_PRICE_AND_CAPACITY_REQUIRED');
  if (!normalized) reasons.push('PRICEBOOK_UNAVAILABLE');
  else if (!isPriceBookActive(normalized, at)) reasons.push('PRICEBOOK_EXPIRED');
  if ((cleanString(systemType) ?? PRICEBOOK_SYSTEM_TYPE) !== (normalized?.systemType ?? PRICEBOOK_SYSTEM_TYPE)) {
    reasons.push('UNSUPPORTED_SYSTEM_TYPE');
  }
  if (inclusionValue(inclusions, 'battery')) reasons.push('BATTERY_SCOPE_UNSUPPORTED');
  if (missingInclusions.length) reasons.push('CORE_SCOPE_INCOMPLETE');

  const estimate = buildCommercialEstimate({ capacityKwp: capacity, priceBook: normalized, at });
  if (reasons.length || !estimate.available) {
    return deepFreeze({
      status: 'not-comparable',
      comparable: false,
      totalAmd: total,
      capacityKwp: capacity,
      amdPerWp: null,
      reasons: deepFreeze([...new Set([...reasons, ...(estimate.available ? [] : [estimate.reason])])]),
      missingInclusions: deepFreeze(missingInclusions),
      estimate,
      questions: deepFreeze([
        'Confirm the panel, inverter, mounting, installation and grid-connection scope.',
        'Confirm VAT, permits, warranty and any non-standard electrical work separately.'
      ])
    });
  }

  const amdPerWp = total / (capacity * 1_000);
  const status =
    amdPerWp < normalized.ratesAmdPerWp.p25
      ? 'below-range'
      : amdPerWp > normalized.ratesAmdPerWp.p75
        ? 'above-range'
        : 'within-range';

  return deepFreeze({
    status,
    comparable: true,
    totalAmd: total,
    capacityKwp: capacity,
    amdPerWp,
    reasons: deepFreeze([]),
    missingInclusions: deepFreeze([]),
    estimate,
    questions: deepFreeze([
      'Confirm the exact equipment models, warranty terms, VAT and permits before signing.'
    ])
  });
};

export const REQUIRED_OFFER_SCOPE = REQUIRED_SCOPE;
