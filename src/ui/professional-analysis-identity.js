import { ANALYSIS_SCHEMA_VERSION } from '../domain/solar-analysis.js';

export const PROFESSIONAL_ANALYSIS_SCOPE = 'manual-roof-plane';
const PROFESSIONAL_ANALYSIS_CALCULATION_VERSION = ANALYSIS_SCHEMA_VERSION;

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
 * Keep the map outline alongside the exact technical roof inputs sent to the
 * analysis endpoint. A newly drawn outline initially contains only its
 * points, area and completion state, while the direction and tilt can still
 * be untouched default controls. Saving just that outline made a completed
 * result fail its input-identity check after a page refresh.
 */
export const mergeProfessionalRoofInput = (currentRoof, inputRoof) => {
  const stored =
    currentRoof !== null && typeof currentRoof === 'object' && !Array.isArray(currentRoof)
      ? currentRoof
      : {};
  const input =
    inputRoof !== null && typeof inputRoof === 'object' && !Array.isArray(inputRoof)
      ? inputRoof
      : {};

  return {
    ...stored,
    areaMethod: input.areaMethod ?? null,
    mountingMode: input.mountingMode ?? null,
    projectedAreaSqm: input.projectedAreaSqm ?? null,
    planeAreaSqm: input.planeAreaSqm ?? null,
    tiltDegrees: input.tiltDegrees ?? null,
    orientationDegrees: input.azimuthDegrees ?? input.orientationDegrees ?? null
  };
};

/**
 * Earlier session records may contain a completed map outline without the
 * unchanged form defaults. Fill only those missing values so an otherwise
 * valid result remains available after this fix is deployed.
 */
export const completeProfessionalRoofInput = (currentRoof, fallbackRoof) => {
  const stored =
    currentRoof !== null && typeof currentRoof === 'object' && !Array.isArray(currentRoof)
      ? currentRoof
      : {};
  const fallback =
    fallbackRoof !== null && typeof fallbackRoof === 'object' && !Array.isArray(fallbackRoof)
      ? fallbackRoof
      : {};

  return {
    ...stored,
    areaMethod: stored.areaMethod ?? fallback.areaMethod ?? null,
    mountingMode: stored.mountingMode ?? fallback.mountingMode ?? null,
    projectedAreaSqm:
      stored.projectedAreaSqm ?? stored.areaSqm ?? fallback.projectedAreaSqm ?? fallback.areaSqm ?? null,
    planeAreaSqm: stored.planeAreaSqm ?? fallback.planeAreaSqm ?? null,
    tiltDegrees: stored.tiltDegrees ?? fallback.tiltDegrees ?? null,
    orientationDegrees:
      stored.orientationDegrees ??
      stored.azimuthDegrees ??
      fallback.azimuthDegrees ??
      fallback.orientationDegrees ??
      null
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
