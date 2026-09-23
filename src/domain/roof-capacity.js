import { round, toPositiveNumberOrNull } from './numbers.js';

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
  usableAreaRatio,
  panelAreaSqm,
  panelWatts
} = {}) => {
  const roofArea = toPositiveNumberOrNull(roofAreaSqm);
  const ratio = usableRoofRatio(usableAreaRatio);
  const moduleArea = toPositiveNumberOrNull(panelAreaSqm);
  const watts = toPositiveNumberOrNull(panelWatts);
  if (roofArea === null || ratio === null || moduleArea === null || watts === null) return null;

  const usableRoofAreaSqm = roofArea * ratio;
  const maximumPanelCount = Math.floor(usableRoofAreaSqm / moduleArea);
  return Object.freeze({
    roofAreaSqm: roofArea,
    usableAreaRatio: ratio,
    usableRoofAreaSqm: round(usableRoofAreaSqm, 6),
    maximumPanelCount,
    maximumCapacityKwp: round((maximumPanelCount * watts) / 1000, 6)
  });
};
