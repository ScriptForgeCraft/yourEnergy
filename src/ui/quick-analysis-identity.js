import { ANALYSIS_SCHEMA_VERSION } from '../domain/analysis-version.js';

export const QUICK_ANALYSIS_SCOPE = 'regional-preliminary';

const stableValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(stableValue);
  if (typeof value !== 'object') return null;

  return Object.keys(value)
    .sort()
    .reduce((result, key) => {
      result[key] = stableValue(value[key]);
      return result;
    }, {});
};

/**
 * A regional result is valid only for the exact regional benchmark and the
 * shared consumption/tariff inputs that produced it.
 */
export const createQuickAnalysisIdentity = ({
  regionId,
  consumption,
  tariff,
  calculationVersion = ANALYSIS_SCHEMA_VERSION
} = {}) =>
  JSON.stringify({
    scope: QUICK_ANALYSIS_SCOPE,
    calculationVersion,
    regionId: typeof regionId === 'string' && regionId.trim() ? regionId.trim() : null,
    consumption: stableValue(consumption),
    tariff: stableValue(tariff)
  });

export const isRestorableQuickAnalysis = ({
  analysis,
  status,
  storedIdentity,
  currentIdentity,
  calculationVersion = ANALYSIS_SCHEMA_VERSION
} = {}) =>
  analysis?.scope === QUICK_ANALYSIS_SCOPE &&
  analysis?.schemaVersion === calculationVersion &&
  status === 'complete' &&
  typeof storedIdentity === 'string' &&
  storedIdentity === currentIdentity;
