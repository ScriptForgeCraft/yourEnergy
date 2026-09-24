import { getMountingSystems } from '../data/equipment/calculator/catalog.js';

export const MOUNTING_HARDWARE_RECOMMENDATION_STATUS = Object.freeze({
  MATCHED: 'matched',
  NO_CATALOG_MATCH: 'no-catalog-match'
});

const MOUNTING_HARDWARE_COMPATIBILITY_LIMITATIONS = Object.freeze([
  'MOUNTING_HARDWARE_AND_ROOF_STRUCTURE_REQUIRE_ENGINEERING_CONFIRMATION',
  'CATALOG_INCLINATION_DOES_NOT_REPLACE_SITE_LAYOUT_OR_WIND_LOAD_DESIGN'
]);

const inclination = (value) => {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'boolean' ||
    (typeof value === 'string' && !value.trim())
  ) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 90 ? number : null;
};

const positiveOrNull = (value) => {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'boolean' ||
    (typeof value === 'string' && !value.trim())
  ) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const availableInclinations = (product) =>
  [
    ...new Set(
      (product?.calculation?.available_inclination_deg ?? [])
        .map(inclination)
        .filter((value) => value !== null)
    )
  ].sort((left, right) => left - right);

const nearestInclination = (inclinations, optimum) =>
  [...inclinations].sort(
    (left, right) => Math.abs(left - optimum) - Math.abs(right - optimum) || right - left
  )[0] ?? null;

/**
 * Finds the closest supported catalog inclination. It never turns a PVGIS
 * optimum into an arbitrary hardware angle: both available and practical
 * values come from the normalized calculation record.
 */
export const selectPracticalMountingOption = ({
  mountingSystems = getMountingSystems(),
  pvgisOptimumTiltDegrees
} = {}) => {
  const optimum = inclination(pvgisOptimumTiltDegrees);
  if (optimum === null || !Array.isArray(mountingSystems)) return null;

  const candidates = mountingSystems
    .map((product) => {
      const inclinations = availableInclinations(product);
      const practicalInclinationDeg = nearestInclination(inclinations, optimum);
      if (practicalInclinationDeg === null) return null;
      return {
        product,
        availableInclinationDeg: inclinations,
        practicalInclinationDeg,
        differenceFromOptimumDeg: Math.abs(practicalInclinationDeg - optimum)
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        left.differenceFromOptimumDeg - right.differenceFromOptimumDeg ||
        left.product.id.localeCompare(right.product.id)
    );
  const selected = candidates[0];
  if (!selected) return null;

  return Object.freeze({
    productId: selected.product.id,
    brand: selected.product.brand,
    productName: selected.product.product_name,
    model: selected.product.model,
    availableInclinationDeg: Object.freeze(selected.availableInclinationDeg),
    practicalInclinationDeg: selected.practicalInclinationDeg,
    kitLengthMm: positiveOrNull(selected.product.calculation?.kit_length_mm),
    railLengthMm: positiveOrNull(selected.product.calculation?.rail_length_mm),
    source: 'equipment-catalog'
  });
};

export const recommendMountingHardware = ({
  mountingMode,
  pvgisOptimumTiltDegrees,
  mountingSystems = getMountingSystems()
} = {}) => {
  if (mountingMode !== 'elevated') return null;

  const optimum = inclination(pvgisOptimumTiltDegrees);
  if (optimum === null) return null;
  const option = selectPracticalMountingOption({
    mountingSystems,
    pvgisOptimumTiltDegrees: optimum
  });
  if (!option) {
    return Object.freeze({
      status: MOUNTING_HARDWARE_RECOMMENDATION_STATUS.NO_CATALOG_MATCH,
      mountingMode,
      pvgisOptimumTiltDegrees: optimum,
      source: 'equipment-catalog',
      compatibilityStatus: 'preliminary',
      compatibilityLimitations: MOUNTING_HARDWARE_COMPATIBILITY_LIMITATIONS
    });
  }

  return Object.freeze({
    status: MOUNTING_HARDWARE_RECOMMENDATION_STATUS.MATCHED,
    mountingMode,
    pvgisOptimumTiltDegrees: optimum,
    ...option,
    reason: 'CATALOG_INCLINATION_NEAREST_TO_PVGIS_OPTIMUM',
    compatibilityStatus: 'preliminary',
    compatibilityLimitations: MOUNTING_HARDWARE_COMPATIBILITY_LIMITATIONS
  });
};
