import {
  cleanString,
  deepFreeze,
  toNonNegativeNumberOrNull,
  toPositiveNumberOrNull
} from './numbers.js';

export const CALCULATION_BASIS_SOURCE_TYPE = Object.freeze({
  USER_INPUT: 'user-input',
  REGIONAL_REFERENCE: 'regional-reference',
  PVGIS_RESULT: 'pvgis-result',
  CATALOG_TECHNICAL_VALUE: 'catalog-technical-value',
  CALCULATOR_ASSUMPTION: 'calculator-assumption',
  REGISTRY_VALUE: 'registry-value',
  PRELIMINARY_RECOMMENDATION: 'preliminary-recommendation',
  UNAVAILABLE: 'unavailable'
});

const sourceReference = (source) => ({
  kind: cleanString(source?.kind) ?? 'unavailable',
  status: cleanString(source?.status) ?? 'unavailable',
  provider: cleanString(source?.provider),
  reference: cleanString(source?.reference),
  verifiedAt: cleanString(source?.verifiedAt)
});

const catalogReference = (productId) => ({
  kind: 'catalog',
  status: 'confirmed',
  provider: 'equipment-catalog',
  reference: productId,
  verifiedAt: null
});

const catalogProduct = (recommendation) => {
  const productId = cleanString(recommendation?.productId);
  return productId
    ? {
        productId,
        brand: cleanString(recommendation?.brand),
        productName: cleanString(recommendation?.productName),
        model: cleanString(recommendation?.model),
        source: catalogReference(productId)
      }
    : null;
};

const pvgisConfiguration = (value) => {
  const systemLossPercent = toNonNegativeNumberOrNull(value?.systemLossPercent);
  const mountingPlace = cleanString(value?.mountingPlace);
  return systemLossPercent === null && mountingPlace === null
    ? null
    : { systemLossPercent, mountingPlace };
};

/**
 * Produces a presentation-safe provenance summary from the exact values that
 * entered a completed calculation. It refers to catalog records by stable ID
 * and deliberately does not copy catalog specifications into configuration.
 */
export const buildCalculationBasis = ({
  scope,
  property,
  consumption,
  roof,
  production,
  equipment,
  equipmentRecommendation,
  financial,
  calculationConfig,
  regionalReference
} = {}) => {
  const regional = cleanString(scope) === 'regional-preliminary';
  const panelId = cleanString(equipment?.panelId);
  const panelWatts = toPositiveNumberOrNull(equipment?.panelWatts);
  const panelAreaSqm = toPositiveNumberOrNull(equipment?.panelAreaSqm);
  const inverter = catalogProduct(equipmentRecommendation?.inverter);
  const storage = catalogProduct(equipmentRecommendation?.storage);
  const mounting = catalogProduct(equipmentRecommendation?.mounting);
  const tariff = financial?.tariff ?? {};
  const surplus = financial?.surplusCompensation ?? {};
  const config = pvgisConfiguration(calculationConfig);
  const coordinates = property?.coordinates ?? null;

  return deepFreeze({
    coordinates:
      coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lng)
        ? {
            sourceType: regional
              ? CALCULATION_BASIS_SOURCE_TYPE.REGIONAL_REFERENCE
              : CALCULATION_BASIS_SOURCE_TYPE.USER_INPUT,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            regionId: regional ? cleanString(regionalReference?.regionId) : null,
            source: sourceReference(property?.source)
          }
        : null,
    consumption:
      toPositiveNumberOrNull(consumption?.annualKwh) === null
        ? null
        : {
            sourceType: CALCULATION_BASIS_SOURCE_TYPE.USER_INPUT,
            annualKwh: toPositiveNumberOrNull(consumption.annualKwh),
            source: sourceReference(consumption?.source)
          },
    solarYield:
      toPositiveNumberOrNull(production?.annualYieldKwhPerKwp) === null
        ? null
        : {
            sourceType:
              production?.source?.provider === 'PVGIS'
                ? CALCULATION_BASIS_SOURCE_TYPE.PVGIS_RESULT
                : CALCULATION_BASIS_SOURCE_TYPE.UNAVAILABLE,
            annualYieldKwhPerKwp: toPositiveNumberOrNull(production?.annualYieldKwhPerKwp),
            source: sourceReference(production?.source),
            configuration: config
          },
    roof:
      roof?.areaSqm === null || roof?.areaSqm === undefined
        ? null
        : {
            sourceType: CALCULATION_BASIS_SOURCE_TYPE.USER_INPUT,
            areaSqm: toPositiveNumberOrNull(roof.areaSqm),
            areaMethod: cleanString(roof.areaMethod),
            tiltDegrees: toNonNegativeNumberOrNull(roof.tiltDegrees),
            orientationDegrees: toNonNegativeNumberOrNull(roof.orientationDegrees),
            mountingMode: cleanString(roof.mountingMode),
            source: sourceReference(roof.source)
          },
    usableRoofRatio:
      toPositiveNumberOrNull(roof?.usableAreaRatio) === null
        ? null
        : {
            sourceType: CALCULATION_BASIS_SOURCE_TYPE.CALCULATOR_ASSUMPTION,
            ratio: toPositiveNumberOrNull(roof.usableAreaRatio)
          },
    solarModule:
      !panelId || panelWatts === null || panelAreaSqm === null
        ? null
        : {
            sourceType: CALCULATION_BASIS_SOURCE_TYPE.CATALOG_TECHNICAL_VALUE,
            productId: panelId,
            brand: cleanString(equipment?.panelBrand),
            model: cleanString(equipment?.panelModel),
            panelWatts,
            panelAreaSqm,
            source: catalogReference(panelId)
          },
    inverter:
      inverter === null
        ? null
        : {
            sourceType: CALCULATION_BASIS_SOURCE_TYPE.PRELIMINARY_RECOMMENDATION,
            ...inverter,
            selectedAcPowerKw: toPositiveNumberOrNull(
              equipmentRecommendation?.inverter?.selectedAcPowerKw
            )
          },
    storage:
      storage === null
        ? null
        : {
            sourceType: CALCULATION_BASIS_SOURCE_TYPE.PRELIMINARY_RECOMMENDATION,
            ...storage,
            selectedUsableCapacityKwh: toPositiveNumberOrNull(
              equipmentRecommendation?.storage?.selectedUsableCapacityKwh
            )
          },
    mounting:
      mounting === null
        ? null
        : {
            sourceType: CALCULATION_BASIS_SOURCE_TYPE.PRELIMINARY_RECOMMENDATION,
            ...mounting,
            practicalInclinationDeg: toNonNegativeNumberOrNull(
              equipmentRecommendation?.mounting?.practicalInclinationDeg
            )
          },
    tariff: {
      sourceType:
        tariff.kind === 'registry'
          ? CALCULATION_BASIS_SOURCE_TYPE.REGISTRY_VALUE
          : tariff.kind === 'user'
            ? CALCULATION_BASIS_SOURCE_TYPE.USER_INPUT
            : CALCULATION_BASIS_SOURCE_TYPE.UNAVAILABLE,
      tariffId: cleanString(tariff.tariffId),
      revision: cleanString(tariff.revision),
      period: cleanString(tariff.period),
      rateAmdPerKwh: toPositiveNumberOrNull(tariff.rateAmdPerKwh),
      source: sourceReference(tariff.source)
    },
    surplusCompensation: {
      sourceType:
        surplus.kind === 'registry'
          ? CALCULATION_BASIS_SOURCE_TYPE.REGISTRY_VALUE
          : CALCULATION_BASIS_SOURCE_TYPE.UNAVAILABLE,
      id: cleanString(surplus.id),
      revision: cleanString(surplus.revision),
      rateAmdPerKwh: toNonNegativeNumberOrNull(surplus.rateAmdPerKwh),
      source: sourceReference(surplus.source)
    }
  });
};
