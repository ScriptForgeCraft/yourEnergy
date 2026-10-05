import { round, toPositiveNumberOrNull } from './numbers.js';
import { PRELIMINARY_ELEVATED_GROUND_COVERAGE_RATIO } from './calculator-assumptions.js';

const usableRoofRatio = (value) => {
  const ratio = toPositiveNumberOrNull(value);
  return ratio !== null && ratio <= 1 ? ratio : null;
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
  usableAreaRatio,
  panelAreaSqm,
  panelWatts
} = {}) => {
  const planeArea = toPositiveNumberOrNull(roofAreaSqm);
  const projectedArea = toPositiveNumberOrNull(projectedRoofAreaSqm);
  const roofArea =
    mountingMode === 'elevated'
      ? areaMethod === 'map-projected'
        ? projectedArea
        : planeArea
      : planeArea;
  const ratio =
    mountingMode === 'elevated'
      ? PRELIMINARY_ELEVATED_GROUND_COVERAGE_RATIO
      : usableRoofRatio(usableAreaRatio);
  const moduleArea = toPositiveNumberOrNull(panelAreaSqm);
  const watts = toPositiveNumberOrNull(panelWatts);
  if (roofArea === null || ratio === null || moduleArea === null || watts === null) return null;

  // Panel tilt cannot reduce the physical module area used for a preliminary
  // capacity limit. The elevated coverage ratio above already reserves area;
  // row pitch and shading are not modelled here.
  const panelFootprintSqm = moduleArea;

  const usableRoofAreaSqm = roofArea * ratio;
  const maximumPanelCount = Math.floor(usableRoofAreaSqm / panelFootprintSqm);
  return Object.freeze({
    roofAreaSqm: roofArea,
    usableAreaRatio: ratio,
    usableRoofAreaSqm: round(usableRoofAreaSqm, 6),
    ...(mountingMode === 'elevated'
      ? {
          mountingMode,
          panelFootprintSqm: round(panelFootprintSqm, 6)
        }
      : {}),
    maximumPanelCount,
    maximumCapacityKwp: round((maximumPanelCount * watts) / 1000, 6)
  });
};
