import { getGridInverters, getHybridInverters } from '../data/equipment/calculator-catalog.js';
import { toPositiveNumberOrNull } from './numbers.js';

export const INVERTER_TECHNOLOGY = Object.freeze({
  GRID_TIED: 'grid-tied',
  HYBRID: 'hybrid'
});

export const INVERTER_COMPATIBILITY_LIMITATIONS = Object.freeze([
  'PANEL_VOC_VMP_ISC_AND_IMP_REQUIRED',
  'INVERTER_MPPT_VOLTAGE_AND_CURRENT_REQUIRED',
  'STRING_COUNT_AND_SITE_PHASE_REQUIREMENTS_REQUIRED'
]);

const catalogueFamiliesFor = (technology) =>
  technology === INVERTER_TECHNOLOGY.HYBRID ? getHybridInverters() : getGridInverters();

const acVariantsFor = (product) =>
  (Array.isArray(product?.calculation?.available_ac_power_kw)
    ? product.calculation.available_ac_power_kw
    : []
  )
    .map(toPositiveNumberOrNull)
    .filter((value) => value !== null)
    .sort((left, right) => left - right);

const candidateVariantsFor = (products, dcCapacityKwp) =>
  products
    .flatMap((product, productIndex) =>
      acVariantsFor(product)
        .filter((acPowerKw) => acPowerKw >= dcCapacityKwp)
        .map((acPowerKw) => ({ product, productIndex, acPowerKw }))
    )
    .sort(
      (left, right) => left.acPowerKw - right.acPowerKw || left.productIndex - right.productIndex
    );

/**
 * Selects the smallest published AC variant that is not below the calculated
 * installed PV DC capacity. No DC/AC ratio, phase assumption, or string rule
 * is introduced; the output is deliberately preliminary until electrical
 * compatibility is engineered.
 */
export const recommendInverter = ({ dcCapacityKwp, storageRequired = false } = {}) => {
  const requiredDcCapacityKwp = toPositiveNumberOrNull(dcCapacityKwp);
  if (requiredDcCapacityKwp === null) return null;

  const technology =
    storageRequired === true ? INVERTER_TECHNOLOGY.HYBRID : INVERTER_TECHNOLOGY.GRID_TIED;
  const candidate = candidateVariantsFor(
    catalogueFamiliesFor(technology),
    requiredDcCapacityKwp
  )[0];
  if (!candidate) return null;

  const calculation = candidate.product.calculation;
  return Object.freeze({
    technology,
    productId: candidate.product.id,
    brand: candidate.product.brand,
    productName: candidate.product.product_name,
    model: candidate.product.model,
    selectedAcPowerKw: candidate.acPowerKw,
    reason:
      candidate.acPowerKw === requiredDcCapacityKwp
        ? 'EXACT_CATALOG_AC_VARIANT_FOR_CALCULATED_PV_DC_CAPACITY'
        : 'SMALLEST_CATALOG_AC_VARIANT_NOT_BELOW_CALCULATED_PV_DC_CAPACITY',
    source: 'equipment-catalog',
    compatibilityStatus: 'preliminary',
    compatibilityLimitations: INVERTER_COMPATIBILITY_LIMITATIONS,
    ...(calculation.max_efficiency_percent
      ? { maxEfficiencyPercent: calculation.max_efficiency_percent }
      : {}),
    ...(calculation.mppt_count_max ? { mpptCountMax: calculation.mppt_count_max } : {})
  });
};
