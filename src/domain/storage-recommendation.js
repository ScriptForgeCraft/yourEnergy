import { getBatteries } from '../data/equipment/calculator-catalog.js';
import { round, toPositiveNumberOrNull } from './numbers.js';

export const STORAGE_RECOMMENDATION_STATUS = Object.freeze({
  PROFILE_REQUIRED: 'profile-required',
  SIZED: 'sized',
  CATALOG_CAPACITY_EXCEEDED: 'catalog-capacity-exceeded'
});

export const STORAGE_TECHNOLOGY = Object.freeze({
  BATTERY_MODULE: 'battery-module',
  RESIDENTIAL_ESS: 'residential-ess',
  COMMERCIAL_ESS: 'commercial-ess'
});

export const STORAGE_COMPATIBILITY_LIMITATIONS = Object.freeze([
  'HYBRID_INVERTER_AND_BACKUP_OUTPUT_POWER_REQUIRED',
  'BATTERY_VOLTAGE_AND_COMMUNICATION_COMPATIBILITY_REQUIRED',
  'SITE_LOAD_PROFILE_AND_BACKUP_CIRCUIT_DESIGN_REQUIRED'
]);

const modularProfileFor = (product) => {
  const calculation = product?.calculation;
  const capacityMinKwh = toPositiveNumberOrNull(calculation?.capacity_min_kwh);
  const capacityMaxKwh = toPositiveNumberOrNull(calculation?.capacity_max_kwh);
  const moduleNominalCapacityKwh = toPositiveNumberOrNull(calculation?.module_nominal_capacity_kwh);
  const systemNominalCapacityMaxKwh = toPositiveNumberOrNull(
    calculation?.system_nominal_capacity_max_kwh
  );
  const systemUsableCapacityMaxKwh = toPositiveNumberOrNull(
    calculation?.system_usable_capacity_max_kwh
  );
  if (
    capacityMinKwh === null ||
    capacityMaxKwh === null ||
    moduleNominalCapacityKwh === null ||
    systemNominalCapacityMaxKwh === null ||
    systemUsableCapacityMaxKwh === null
  ) {
    return null;
  }

  const minimumModuleCount = Math.max(1, Math.ceil(capacityMinKwh / moduleNominalCapacityKwh));
  const maximumModuleCount = Math.floor(
    Math.min(capacityMaxKwh, systemNominalCapacityMaxKwh) / moduleNominalCapacityKwh
  );
  if (minimumModuleCount > maximumModuleCount) return null;
  const moduleUsableCapacityKwh = round(systemUsableCapacityMaxKwh / maximumModuleCount, 6);
  if (!Number.isFinite(moduleUsableCapacityKwh) || moduleUsableCapacityKwh <= 0) return null;

  return {
    product,
    capacityMinKwh,
    capacityMaxKwh,
    moduleNominalCapacityKwh,
    moduleUsableCapacityKwh,
    minimumModuleCount,
    maximumModuleCount,
    systemNominalCapacityMaxKwh,
    systemUsableCapacityMaxKwh
  };
};

const modularBatteryProfiles = () => getBatteries().map(modularProfileFor).filter(Boolean);

const profileRequiredRecommendation = () =>
  Object.freeze({
    status: STORAGE_RECOMMENDATION_STATUS.PROFILE_REQUIRED,
    storageOptional: true,
    technology: null,
    reason: 'EXACT_BATTERY_SIZING_REQUIRES_CRITICAL_LOAD_AND_BACKUP_DURATION',
    compatibilityStatus: 'preliminary',
    compatibilityLimitations: STORAGE_COMPATIBILITY_LIMITATIONS
  });

/**
 * Uses explicit critical-load and backup-duration inputs when supplied. The
 * normal calculator does not collect them, so callers receive no storage
 * recommendation unless storage has been explicitly requested.
 */
export const recommendStorage = ({
  storageRequired = false,
  criticalLoadPowerKw,
  backupDurationHours
} = {}) => {
  if (storageRequired !== true) return null;

  const criticalLoadKw = toPositiveNumberOrNull(criticalLoadPowerKw);
  const durationHours = toPositiveNumberOrNull(backupDurationHours);
  if (criticalLoadKw === null || durationHours === null) return profileRequiredRecommendation();

  const requiredUsableCapacityKwh = round(criticalLoadKw * durationHours, 6);
  const candidates = modularBatteryProfiles()
    .map((profile) => {
      const moduleCount = Math.ceil(requiredUsableCapacityKwh / profile.moduleUsableCapacityKwh);
      const selectedModuleCount = Math.max(profile.minimumModuleCount, moduleCount);
      return {
        ...profile,
        moduleCount: selectedModuleCount,
        selectedNominalCapacityKwh: round(
          selectedModuleCount * profile.moduleNominalCapacityKwh,
          6
        ),
        selectedUsableCapacityKwh: round(selectedModuleCount * profile.moduleUsableCapacityKwh, 6)
      };
    })
    .filter((candidate) => candidate.moduleCount <= candidate.maximumModuleCount)
    .sort(
      (left, right) =>
        left.selectedUsableCapacityKwh - right.selectedUsableCapacityKwh ||
        left.product.id.localeCompare(right.product.id)
    );
  const selected = candidates[0];
  if (!selected) {
    const largest = modularBatteryProfiles().sort(
      (left, right) => right.systemUsableCapacityMaxKwh - left.systemUsableCapacityMaxKwh
    )[0];
    if (!largest) return profileRequiredRecommendation();
    return Object.freeze({
      status: STORAGE_RECOMMENDATION_STATUS.CATALOG_CAPACITY_EXCEEDED,
      storageOptional: false,
      technology: STORAGE_TECHNOLOGY.BATTERY_MODULE,
      productId: largest.product.id,
      brand: largest.product.brand,
      productName: largest.product.product_name,
      model: largest.product.model,
      requiredUsableCapacityKwh,
      capacityMinKwh: largest.capacityMinKwh,
      capacityMaxKwh: largest.capacityMaxKwh,
      minimumModuleCount: largest.minimumModuleCount,
      maximumModuleCount: largest.maximumModuleCount,
      systemNominalCapacityMaxKwh: largest.systemNominalCapacityMaxKwh,
      systemUsableCapacityMaxKwh: largest.systemUsableCapacityMaxKwh,
      reason: 'REQUIRED_USABLE_CAPACITY_EXCEEDS_CATALOG_MODULAR_SYSTEM_MAXIMUM',
      source: 'equipment-catalog',
      compatibilityStatus: 'preliminary',
      compatibilityLimitations: STORAGE_COMPATIBILITY_LIMITATIONS
    });
  }

  return Object.freeze({
    status: STORAGE_RECOMMENDATION_STATUS.SIZED,
    storageOptional: false,
    technology: STORAGE_TECHNOLOGY.BATTERY_MODULE,
    productId: selected.product.id,
    brand: selected.product.brand,
    productName: selected.product.product_name,
    model: selected.product.model,
    requiredUsableCapacityKwh,
    requiredNominalCapacityKwh: round(
      (requiredUsableCapacityKwh / selected.systemUsableCapacityMaxKwh) *
        selected.systemNominalCapacityMaxKwh,
      6
    ),
    moduleCount: selected.moduleCount,
    capacityMinKwh: selected.capacityMinKwh,
    capacityMaxKwh: selected.capacityMaxKwh,
    moduleNominalCapacityKwh: selected.moduleNominalCapacityKwh,
    moduleUsableCapacityKwh: selected.moduleUsableCapacityKwh,
    minimumModuleCount: selected.minimumModuleCount,
    selectedNominalCapacityKwh: selected.selectedNominalCapacityKwh,
    selectedUsableCapacityKwh: selected.selectedUsableCapacityKwh,
    maximumModuleCount: selected.maximumModuleCount,
    systemNominalCapacityMaxKwh: selected.systemNominalCapacityMaxKwh,
    systemUsableCapacityMaxKwh: selected.systemUsableCapacityMaxKwh,
    reason: 'WHOLE_CATALOG_BATTERY_MODULE_COUNT_COVERS_REQUIRED_USABLE_CAPACITY',
    source: 'equipment-catalog',
    compatibilityStatus: 'preliminary',
    compatibilityLimitations: STORAGE_COMPATIBILITY_LIMITATIONS
  });
};
