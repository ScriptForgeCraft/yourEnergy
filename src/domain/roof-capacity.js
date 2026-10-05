import { round, toPositiveNumberOrNull } from './numbers.js';
import { PRELIMINARY_ELEVATED_LIMIT_PROFILE_ANGLE_DEGREES } from './calculator-assumptions.js';

const usableRoofRatio = (value) => {
  const ratio = toPositiveNumberOrNull(value);
  return ratio !== null && ratio <= 1 ? ratio : null;
};

const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Ground-coverage ratio for conventional one-direction elevated rows.
 *
 * It models row pitch only: horizontal collector projection plus the shadow
 * gap required by a stated limit/profile angle. It deliberately does not
 * claim to account for roof edges, drains, access, obstacles or structure.
 */
export const calculateElevatedSingleDirectionRowGcr = ({
  arrayTiltDegrees,
  limitProfileAngleDegrees = PRELIMINARY_ELEVATED_LIMIT_PROFILE_ANGLE_DEGREES
} = {}) => {
  const tilt = Number(arrayTiltDegrees);
  const limit = Number(limitProfileAngleDegrees);
  if (
    !Number.isFinite(tilt) ||
    tilt < 0 ||
    tilt > 90 ||
    !Number.isFinite(limit) ||
    limit <= 0 ||
    limit >= 90
  )
    return null;
  // The simplified shadow-gap equation reaches its density minimum at
  // 90° - limit angle and would otherwise rise again close to vertical. That
  // is outside the practical fixed-row use case, so cap at that minimum to
  // keep the preliminary capacity physically conservative and non-increasing.
  const effectiveTilt = Math.min(tilt, 90 - limit);
  const tiltRadians = degreesToRadians(effectiveTilt);
  const limitRadians = degreesToRadians(limit);
  const denominator = Math.cos(tiltRadians) + Math.sin(tiltRadians) / Math.tan(limitRadians);
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  const gcr = 1 / denominator;
  return gcr > 0 && gcr <= 1 ? gcr : null;
};

/**
 * Returns physical module fit for a preliminary roof estimate. The same
 * calculation serves the analysis result and the Professional roof preview.
 */
export const calculatePreliminaryRoofCapacity = ({
  roofAreaSqm,
  projectedRoofAreaSqm,
  areaMethod,
  mountingMode = 'roof-parallel',
  roofTiltDegrees = 0,
  arrayTiltDegrees,
  limitProfileAngleDegrees = PRELIMINARY_ELEVATED_LIMIT_PROFILE_ANGLE_DEGREES,
  usableAreaRatio,
  panelAreaSqm,
  panelWatts
} = {}) => {
  const planeArea = toPositiveNumberOrNull(roofAreaSqm);
  const projectedArea = toPositiveNumberOrNull(projectedRoofAreaSqm);
  // Elevated row pitch is referenced to horizontal plan area. A measured
  // area is equivalent only for a level roof; a sloped base plane needs an
  // engineered layout model and intentionally has no numeric panel limit.
  const roofTilt = Number(roofTiltDegrees);
  if (mountingMode === 'elevated' && (!Number.isFinite(roofTilt) || roofTilt > 0)) return null;
  const roofArea =
    mountingMode === 'elevated'
      ? areaMethod === 'map-projected'
        ? projectedArea
        : planeArea
      : planeArea;
  const layoutGcr =
    mountingMode === 'elevated'
      ? calculateElevatedSingleDirectionRowGcr({ arrayTiltDegrees, limitProfileAngleDegrees })
      : null;
  const ratio = mountingMode === 'elevated' ? layoutGcr : usableRoofRatio(usableAreaRatio);
  const moduleArea = toPositiveNumberOrNull(panelAreaSqm);
  const watts = toPositiveNumberOrNull(panelWatts);
  if (roofArea === null || ratio === null || moduleArea === null || watts === null) return null;

  // GCR converts available plan area to preliminary module area. Individual
  // module area is never additionally projected with cos(tilt), which would
  // double-count geometry.
  const panelFootprintSqm = moduleArea;

  const usableRoofAreaSqm = roofArea * ratio;
  const maximumPanelCount = Math.floor(usableRoofAreaSqm / panelFootprintSqm);
  return Object.freeze({
    roofAreaSqm: roofArea,
    ...(mountingMode === 'elevated' ? {} : { usableAreaRatio: ratio }),
    ...(mountingMode === 'elevated'
      ? { preliminaryModuleAreaSqm: round(usableRoofAreaSqm, 6) }
      : { usableRoofAreaSqm: round(usableRoofAreaSqm, 6) }),
    ...(mountingMode === 'elevated'
      ? {
          mountingMode,
          layoutType: 'single-direction-rows',
          layoutGcr: round(layoutGcr, 6),
          limitProfileAngleDegrees,
          panelFootprintSqm: round(panelFootprintSqm, 6)
        }
      : {}),
    maximumPanelCount,
    maximumCapacityKwp: round((maximumPanelCount * watts) / 1000, 6)
  });
};
