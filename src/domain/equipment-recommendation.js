import { getEquipmentById, getSolarPanelById } from '../data/equipment/calculator/catalog.js';
import { round, toNonNegativeNumberOrNull, toPositiveNumberOrNull } from './numbers.js';

const EQUIPMENT_RECOMMENDATION_COMPATIBILITY_LIMITATIONS = Object.freeze([
  'MODULE_STRING_DESIGN_AND_ROOF_LAYOUT_REQUIRE_ENGINEERING_CONFIRMATION'
]);

const PRODUCT_CATEGORY = Object.freeze({
  GRID_INVERTER: 'grid-inverters',
  HYBRID_INVERTER: 'inverters',
  BATTERY: 'batteries',
  MOUNTING: 'mounting'
});

const positiveInteger = (value) => {
  const number = toPositiveNumberOrNull(value);
  return number !== null && Number.isInteger(number) ? number : null;
};

const sourceProduct = (id, categories) => {
  const product = getEquipmentById(id);
  return product && categories.includes(product.category) ? product : null;
};

const productIdentity = (product) => ({
  productId: product.id,
  brand: product.brand,
  productName: product.product_name,
  model: product.model,
  source: 'equipment-catalog'
});

const compatibility = (recommendation, fallback) => ({
  compatibilityStatus: recommendation?.compatibilityStatus ?? 'preliminary',
  compatibilityLimitations: Object.freeze([
    ...(recommendation?.compatibilityLimitations ?? fallback)
  ])
});

const buildSolarModuleRecommendation = (selectedScenario) => {
  const system = selectedScenario?.system;
  const panel = getSolarPanelById(system?.equipment?.panelId);
  const quantity = positiveInteger(system?.panelCount);
  const watts = toPositiveNumberOrNull(panel?.calculation?.panelWatts);
  const areaSqm = toPositiveNumberOrNull(panel?.calculation?.panelAreaSqm);
  if (!panel || quantity === null || watts === null || areaSqm === null) return null;

  return Object.freeze({
    technology: 'solar-module',
    ...productIdentity(panel),
    watts,
    quantity,
    totalDcCapacityKwp: round((quantity * watts) / 1000, 6),
    physicalModuleAreaSqm: areaSqm,
    totalModuleFootprintSqm: round(quantity * areaSqm, 6),
    reason: 'CATALOG_MODULE_COUNT_AND_RATING_MATCH_CALCULATED_DC_CAPACITY',
    compatibilityStatus: 'preliminary',
    compatibilityLimitations: EQUIPMENT_RECOMMENDATION_COMPATIBILITY_LIMITATIONS
  });
};

const buildInverterRecommendation = (recommendation, selectedScenario) => {
  if (!recommendation?.productId) return null;
  const product = sourceProduct(recommendation.productId, [
    PRODUCT_CATEGORY.GRID_INVERTER,
    PRODUCT_CATEGORY.HYBRID_INVERTER
  ]);
  const selectedAcPowerKw = toPositiveNumberOrNull(recommendation.selectedAcPowerKw);
  const availableVariants = product?.calculation?.available_ac_power_kw ?? [];
  if (!product || selectedAcPowerKw === null || !availableVariants.includes(selectedAcPowerKw)) {
    return null;
  }

  return Object.freeze({
    technology: recommendation.technology,
    ...productIdentity(product),
    selectedAcPowerKw,
    requiredDcCapacityKwp: toPositiveNumberOrNull(selectedScenario?.system?.capacityKwp),
    reason: recommendation.reason ?? 'CATALOG_AC_VARIANT_SELECTED_FOR_CALCULATED_PV_DC_CAPACITY',
    ...compatibility(recommendation, [])
  });
};

const buildMountingRecommendation = (recommendation) => {
  if (recommendation?.status !== 'matched' || !recommendation.productId) return null;
  const product = sourceProduct(recommendation.productId, [PRODUCT_CATEGORY.MOUNTING]);
  const practicalInclinationDeg = toNonNegativeNumberOrNull(recommendation.practicalInclinationDeg);
  if (!product || practicalInclinationDeg === null) return null;

  return Object.freeze({
    technology: 'mounting-system',
    ...productIdentity(product),
    installationType: recommendation.mountingMode,
    pvgisOptimumTiltDegrees: toNonNegativeNumberOrNull(recommendation.pvgisOptimumTiltDegrees),
    availableInclinationDeg: Object.freeze([...(recommendation.availableInclinationDeg ?? [])]),
    practicalInclinationDeg,
    kitLengthMm: toPositiveNumberOrNull(recommendation.kitLengthMm),
    railLengthMm: toPositiveNumberOrNull(recommendation.railLengthMm),
    reason: recommendation.reason ?? 'CATALOG_INCLINATION_NEAREST_TO_PVGIS_OPTIMUM',
    ...compatibility(recommendation, [])
  });
};

const storageCapacity = (recommendation, key) => {
  const value = toPositiveNumberOrNull(recommendation?.[key]);
  return value === null ? null : value;
};

const buildStorageRecommendation = (recommendation) => {
  if (!recommendation) return null;
  const base = {
    status: recommendation.status,
    storageOptional: recommendation.storageOptional === true,
    technology: recommendation.technology ?? null,
    reason: recommendation.reason ?? null,
    ...compatibility(recommendation, [])
  };
  if (!recommendation.productId) return Object.freeze(base);

  const product = sourceProduct(recommendation.productId, [PRODUCT_CATEGORY.BATTERY]);
  if (!product) return Object.freeze(base);

  return Object.freeze({
    ...base,
    ...productIdentity(product),
    requiredUsableCapacityKwh: storageCapacity(recommendation, 'requiredUsableCapacityKwh'),
    selectedUsableCapacityKwh: storageCapacity(recommendation, 'selectedUsableCapacityKwh'),
    selectedNominalCapacityKwh: storageCapacity(recommendation, 'selectedNominalCapacityKwh'),
    moduleCount: positiveInteger(recommendation.moduleCount),
    maximumModuleCount: positiveInteger(recommendation.maximumModuleCount),
    systemUsableCapacityMaxKwh: storageCapacity(recommendation, 'systemUsableCapacityMaxKwh')
  });
};

/**
 * Produces a small, calculation-derived equipment layer for result UIs. It
 * intentionally excludes microinverters, EV chargers and ESS products unless
 * a future calculator input establishes a scenario that requires them.
 */
export const buildEquipmentRecommendation = ({
  selectedScenario,
  inverterRecommendation,
  mountingHardwareRecommendation,
  storageRecommendation
} = {}) => {
  const solarModule = buildSolarModuleRecommendation(selectedScenario);
  const inverter = buildInverterRecommendation(inverterRecommendation, selectedScenario);
  const mounting = buildMountingRecommendation(mountingHardwareRecommendation);
  const storage = buildStorageRecommendation(storageRecommendation);
  if (!solarModule && !inverter && !mounting && !storage) return null;

  return Object.freeze({
    source: 'equipment-catalog',
    compatibilityStatus: 'preliminary',
    solarModule,
    inverter,
    mounting,
    storage
  });
};
