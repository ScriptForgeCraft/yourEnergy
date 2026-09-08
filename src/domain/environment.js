import { round, toFiniteNumberOrNull, toPositiveNumberOrNull } from './numbers.js';

const stringOrNull = (value) => {
  const result = typeof value === 'string' ? value.trim() : '';
  return result || null;
};

const validAt = (value) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const validStatus = (value) =>
  value === 'verified' || value === 'verified-historical' ? value : 'unverified';

const nonNegativeIntegerOrNull = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
};

/**
 * A factor is usable only when its value, source and verification metadata are
 * all supplied. This prevents an environmental equivalence from silently
 * becoming a product claim while the owner has not approved a source.
 */
export const normalizeGridEmissionFactor = (input = {}, { at = new Date() } = {}) => {
  const valueKgCo2PerKwh = toPositiveNumberOrNull(input?.valueKgCo2PerKwh);
  const effectiveFrom = validAt(input?.effectiveFrom);
  const effectiveTo = input?.effectiveTo ? validAt(input.effectiveTo) : null;
  const sourceUrl = stringOrNull(input?.sourceUrl);
  const verifiedAt = validAt(input?.verifiedAt);
  const requestedStatus = validStatus(input?.status);
  const current = validAt(at) ?? new Date();
  const inDateRange =
    effectiveFrom !== null &&
    effectiveFrom <= current &&
    (effectiveTo === null || effectiveTo >= current);
  const historical = requestedStatus === 'verified-historical';
  const available =
    requestedStatus !== 'unverified' &&
    valueKgCo2PerKwh !== null &&
    sourceUrl !== null &&
    verifiedAt !== null &&
    (historical || inDateRange);

  return {
    id: stringOrNull(input?.id),
    version: stringOrNull(input?.version),
    dataYear: nonNegativeIntegerOrNull(input?.dataYear),
    valueKgCo2PerKwh: available ? valueKgCo2PerKwh : null,
    effectiveFrom: effectiveFrom?.toISOString() ?? null,
    effectiveTo: effectiveTo?.toISOString() ?? null,
    sourceUrl: available ? sourceUrl : null,
    provider: available ? stringOrNull(input?.provider) : null,
    methodology: available ? stringOrNull(input?.methodology) : null,
    verifiedAt: verifiedAt?.toISOString() ?? null,
    status: available ? requestedStatus : 'unavailable'
  };
};

/** A separate, versioned communication equivalency—not an emissions factor. */
export const normalizeTreeEquivalency = (input = {}) => {
  const metricTonsCo2PerTreePerYear = toPositiveNumberOrNull(input?.metricTonsCo2PerTreePerYear);
  const sourceUrl = stringOrNull(input?.sourceUrl);
  const verifiedAt = validAt(input?.verifiedAt);
  const available =
    input?.status === 'verified' &&
    metricTonsCo2PerTreePerYear !== null &&
    sourceUrl !== null &&
    verifiedAt !== null;

  return {
    id: stringOrNull(input?.id),
    version: stringOrNull(input?.version),
    metricTonsCo2PerTreePerYear: available ? metricTonsCo2PerTreePerYear : null,
    methodology: available ? stringOrNull(input?.methodology) : null,
    sourceUrl: available ? sourceUrl : null,
    provider: available ? stringOrNull(input?.provider) : null,
    verifiedAt: verifiedAt?.toISOString() ?? null,
    status: available ? 'verified' : 'unavailable'
  };
};

export const buildTreeEquivalence = ({ avoidedCo2Tons, treeEquivalency } = {}) => {
  const avoided = toFiniteNumberOrNull(avoidedCo2Tons);
  const factor = normalizeTreeEquivalency(treeEquivalency);
  const treeEquivalent =
    avoided !== null && avoided >= 0 && factor.metricTonsCo2PerTreePerYear !== null
      ? round(avoided / factor.metricTonsCo2PerTreePerYear, 3)
      : null;

  return { factor, treeEquivalent };
};

/**
 * This domain-level conversion is deliberately outside the Hero. UI layers
 * receive its normalized result from SolarAnalysis and never invent CO₂ data.
 */
export const buildEnvironmentalImpact = ({
  annualGenerationKwh,
  gridEmissionFactor,
  treeEquivalency,
  at = new Date()
} = {}) => {
  const annualKwh = toFiniteNumberOrNull(annualGenerationKwh);
  const factor = normalizeGridEmissionFactor(gridEmissionFactor, { at });
  const avoidedCo2Tons =
    annualKwh !== null && annualKwh >= 0 && factor.valueKgCo2PerKwh !== null
      ? round((annualKwh * factor.valueKgCo2PerKwh) / 1000, 3)
      : null;

  const trees = buildTreeEquivalence({ avoidedCo2Tons, treeEquivalency });

  return {
    factor,
    avoidedCo2Tons,
    treeEquivalency: trees.factor,
    treeEquivalent: trees.treeEquivalent
  };
};
