import { round, toFiniteNumberOrNull, toPositiveNumberOrNull } from './numbers.js';

const stringOrNull = (value) => {
  const result = typeof value === 'string' ? value.trim() : '';
  return result || null;
};

const validAt = (value) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
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
  const requestedStatus = input?.status === 'verified' ? 'verified' : 'unverified';
  const current = validAt(at) ?? new Date();
  const inDateRange =
    effectiveFrom !== null &&
    effectiveFrom <= current &&
    (effectiveTo === null || effectiveTo >= current);
  const available =
    requestedStatus === 'verified' &&
    valueKgCo2PerKwh !== null &&
    sourceUrl !== null &&
    verifiedAt !== null &&
    inDateRange;

  return {
    id: stringOrNull(input?.id),
    version: stringOrNull(input?.version),
    valueKgCo2PerKwh: available ? valueKgCo2PerKwh : null,
    effectiveFrom: effectiveFrom?.toISOString() ?? null,
    effectiveTo: effectiveTo?.toISOString() ?? null,
    sourceUrl: available ? sourceUrl : null,
    verifiedAt: verifiedAt?.toISOString() ?? null,
    status: available ? 'verified' : 'unavailable'
  };
};

/**
 * This domain-level conversion is deliberately outside the Hero. UI layers
 * receive its normalized result from SolarAnalysis and never invent CO₂ data.
 */
export const buildEnvironmentalImpact = ({
  annualGenerationKwh,
  gridEmissionFactor,
  at = new Date()
} = {}) => {
  const annualKwh = toFiniteNumberOrNull(annualGenerationKwh);
  const factor = normalizeGridEmissionFactor(gridEmissionFactor, { at });
  const avoidedCo2Tons =
    annualKwh !== null && annualKwh >= 0 && factor.valueKgCo2PerKwh !== null
      ? round((annualKwh * factor.valueKgCo2PerKwh) / 1000, 3)
      : null;

  return { factor, avoidedCo2Tons };
};
