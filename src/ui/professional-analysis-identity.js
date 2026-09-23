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

const normalizedRoof = (roof = {}) => ({
  areaMethod: typeof roof.areaMethod === 'string' ? roof.areaMethod : null,
  mountingMode: typeof roof.mountingMode === 'string' ? roof.mountingMode : null,
  projectedAreaSqm: finiteNumber(roof.projectedAreaSqm ?? roof.areaSqm),
  planeAreaSqm: finiteNumber(roof.planeAreaSqm),
  polygonComplete: Boolean(roof.polygonComplete ?? roof.complete),
  tiltDegrees: finiteNumber(roof.tiltDegrees),
  azimuthDegrees: finiteNumber(roof.azimuthDegrees ?? roof.orientationDegrees)
});

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
