import { ANALYSIS_SCHEMA_VERSION } from '../domain/solar-analysis.js';

export const PROFESSIONAL_ANALYSIS_SCOPE = 'manual-roof-plane';
export const PROFESSIONAL_ANALYSIS_CALCULATION_VERSION = ANALYSIS_SCHEMA_VERSION;

const finiteNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);

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

const coordinatesFor = (property) => property?.coordinates ?? property ?? {};

const normalizedRoof = (roof) => {
  const source = roof !== null && typeof roof === 'object' && !Array.isArray(roof) ? roof : {};

  return {
    areaMethod: typeof source.areaMethod === 'string' ? source.areaMethod : null,
    mountingMode: typeof source.mountingMode === 'string' ? source.mountingMode : null,
    projectedAreaSqm: finiteNumber(source.projectedAreaSqm ?? source.areaSqm),
    planeAreaSqm: finiteNumber(source.planeAreaSqm),
    polygonComplete: Boolean(source.polygonComplete ?? source.complete),
    tiltDegrees: finiteNumber(source.tiltDegrees),
    azimuthDegrees: finiteNumber(source.azimuthDegrees ?? source.orientationDegrees)
  };
};

/**
 * A stable representation of every Professional Calculator value sent to the
 * engineering endpoint. It is deliberately separate from the result itself:
 * a result can only be restored when its stored identity still matches the
 * current property-level inputs.
 */
export const createProfessionalAnalysisIdentity = ({
  property,
  consumption,
  tariff,
  roof,
  system,
  panelId,
  storageRequired,
  calculationVersion = PROFESSIONAL_ANALYSIS_CALCULATION_VERSION
} = {}) => {
  const coordinates = coordinatesFor(property);
  return JSON.stringify({
    scope: PROFESSIONAL_ANALYSIS_SCOPE,
    calculationVersion,
    property: {
      latitude: finiteNumber(coordinates.latitude ?? coordinates.lat),
      longitude: finiteNumber(coordinates.longitude ?? coordinates.lng)
    },
    consumption: stableValue(consumption),
    tariff: stableValue(tariff),
    roof: normalizedRoof(roof),
    system: stableValue(system),
    panelId: typeof panelId === 'string' && panelId.trim() ? panelId.trim() : null,
    storageRequired: storageRequired === true
  });
};

export const isRestorableProfessionalAnalysis = ({
  analysis,
  status,
  storedIdentity,
  currentIdentity,
  calculationVersion = PROFESSIONAL_ANALYSIS_CALCULATION_VERSION
} = {}) =>
  analysis?.scope === PROFESSIONAL_ANALYSIS_SCOPE &&
  analysis?.schemaVersion === calculationVersion &&
  status === 'complete' &&
  typeof storedIdentity === 'string' &&
  storedIdentity === currentIdentity;
