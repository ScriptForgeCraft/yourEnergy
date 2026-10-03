import { normalizeConsumption, isNormalizedConsumption } from './consumption.js';
import { buildEnvironmentalImpact } from './environment.js';
import { ANALYSIS_STATUS, DATA_COMPLETENESS_LEVEL, SOURCE_KIND, SOURCE_STATUS } from './models.js';
import {
  cleanString,
  MONTHS_PER_YEAR,
  sum,
  toFiniteNumberOrNull,
  toPositiveNumberOrNull
} from './numbers.js';
import { getCalculatorInputNumber } from './calculator-inputs.js';
import {
  getFinancialTariffRateRange,
  getUsableSurplusCompensationRate,
  getUsableTariffRate,
  createAutomaticStandardResidentialTariff,
  createAutomaticStandardResidentialTariffProfile,
  selectEffectiveSurplusCompensation
} from './tariffs.js';
import { buildCommercialEstimate } from './pricebook.js';
import { recommendInverter } from './inverter-recommendation.js';
import { recommendStorage } from './storage-recommendation.js';
import { recommendMountingHardware } from './mounting-recommendation.js';
import { buildEquipmentRecommendation } from './equipment-recommendation.js';
import { buildCalculationBasis } from './calculation-provenance.js';
import { calculatePreliminaryRoofCapacity } from './roof-capacity.js';
import { ANALYSIS_SCHEMA_VERSION } from './analysis-version.js';

export { ANALYSIS_SCHEMA_VERSION } from './analysis-version.js';

/**
 * Planning coverage choices, not production quotes or property-specific
 * recommendations. They only turn user-confirmed inputs into comparable
 * scenarios.
 */
const DEFAULT_SCENARIO_TARGETS = Object.freeze([
  Object.freeze({ id: 'conservative', targetCoverage: 0.7 }),
  Object.freeze({ id: 'balanced', targetCoverage: 0.9 }),
  Object.freeze({ id: 'maximum', targetCoverage: 1 })
]);

const ANALYSIS_ASSUMPTIONS = Object.freeze([
  'NO_TARIFF_ESCALATION',
  'NO_PANEL_DEGRADATION',
  'NO_MAINTENANCE_FINANCING_DISCOUNTING_EXPORT_OR_TAXES',
  'MISSING_EVIDENCE_SUPPRESSES_FINANCIAL_RESULT'
]);

const sourceKinds = new Set(Object.values(SOURCE_KIND));
const sourceStatuses = new Set(Object.values(SOURCE_STATUS));
const areaMethods = new Set(['map-projected', 'measured-plane']);
const mountingModes = new Set(['roof-parallel', 'elevated']);
const MAX_PROJECTED_AREA_TILT_DEGREES = 75;

const unavailableSource = Object.freeze({
  kind: SOURCE_KIND.UNAVAILABLE,
  status: SOURCE_STATUS.UNAVAILABLE,
  provider: null,
  reference: null,
  verifiedAt: null
});

const normalizeSource = (
  source,
  defaultKind = SOURCE_KIND.UNAVAILABLE,
  defaultStatus = SOURCE_STATUS.UNAVAILABLE
) => ({
  kind: sourceKinds.has(source?.kind) ? source.kind : defaultKind,
  status: sourceStatuses.has(source?.status) ? source.status : defaultStatus,
  provider: cleanString(source?.provider),
  reference: cleanString(source?.reference),
  verifiedAt: cleanString(source?.verifiedAt)
});

const normalizeCoordinates = (coordinates) => {
  const lat = toFiniteNumberOrNull(coordinates?.lat);
  const lng = toFiniteNumberOrNull(coordinates?.lng);
  if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return { lat, lng };
};

/** @returns {import('./models.js').Property} */
const normalizeProperty = (input = {}) => {
  const address = cleanString(input.address);
  const coordinates = normalizeCoordinates(input.coordinates);
  const confirmed = Boolean(input.confirmed) && Boolean(address || coordinates);
  return {
    address,
    coordinates,
    confirmed,
    source: normalizeSource(
      input.source,
      address || coordinates ? SOURCE_KIND.MANUAL : SOURCE_KIND.UNAVAILABLE,
      confirmed
        ? SOURCE_STATUS.CONFIRMED
        : address || coordinates
          ? SOURCE_STATUS.PROVIDED
          : SOURCE_STATUS.UNAVAILABLE
    )
  };
};

const validAreaMethod = (value) => (areaMethods.has(value) ? value : null);
const validMountingMode = (value) => (mountingModes.has(value) ? value : null);

/**
 * Converts the plan-view area from a manual map outline into a preliminary
 * roof-plane area. A near-vertical roof must use a measured plane area rather
 * than magnifying a 2D outline. This is a geometric conversion, not a survey.
 */
export const calculateRoofPlaneArea = ({
  areaMethod,
  projectedAreaSqm,
  planeAreaSqm,
  tiltDegrees
} = {}) => {
  const method = validAreaMethod(areaMethod);
  const measured = getCalculatorInputNumber(planeAreaSqm, 'roofAreaSqm');
  const projected = getCalculatorInputNumber(projectedAreaSqm, 'roofAreaSqm');
  const tilt = toFiniteNumberOrNull(tiltDegrees);
  if (method === 'measured-plane') return measured;
  if (
    method !== 'map-projected' ||
    projected === null ||
    tilt === null ||
    tilt < 0 ||
    tilt >= MAX_PROJECTED_AREA_TILT_DEGREES
  ) {
    return null;
  }
  const cosine = Math.cos((tilt * Math.PI) / 180);
  return Number.isFinite(cosine) && cosine > 0 ? projected / cosine : null;
};

/** @returns {import('./models.js').Roof} */
export const normalizeRoof = (input = {}) => {
  const orientationCandidate = toFiniteNumberOrNull(input.orientationDegrees);
  const tiltCandidate = toFiniteNumberOrNull(input.tiltDegrees);
  const usableAreaCandidate = toFiniteNumberOrNull(input.usableAreaRatio);
  const orientationDegrees =
    orientationCandidate !== null && orientationCandidate >= 0 && orientationCandidate < 360
      ? orientationCandidate
      : null;
  const tiltDegrees =
    tiltCandidate !== null && tiltCandidate >= 0 && tiltCandidate <= 90 ? tiltCandidate : null;
  const usableAreaRatio =
    usableAreaCandidate !== null && usableAreaCandidate > 0 && usableAreaCandidate <= 1
      ? usableAreaCandidate
      : null;
  const polygonComplete = Boolean(input.polygonComplete);
  const areaMethod = validAreaMethod(input.areaMethod);
  const mountingMode = validMountingMode(input.mountingMode);
  const projectedAreaSqm = getCalculatorInputNumber(input.projectedAreaSqm, 'roofAreaSqm');
  const planeAreaSqm = getCalculatorInputNumber(input.planeAreaSqm, 'roofAreaSqm');
  const derivedPlaneArea = calculateRoofPlaneArea({
    areaMethod,
    projectedAreaSqm,
    planeAreaSqm,
    tiltDegrees
  });
  const areaSqm = derivedPlaneArea ?? getCalculatorInputNumber(input.areaSqm, 'roofAreaSqm');
  const hasRoofInput = Boolean(
    areaSqm ||
    projectedAreaSqm ||
    planeAreaSqm ||
    polygonComplete ||
    orientationDegrees !== null ||
    tiltDegrees !== null
  );

  return {
    areaSqm,
    areaMethod,
    projectedAreaSqm,
    planeAreaSqm: derivedPlaneArea ?? planeAreaSqm,
    mountingMode,
    orientationDegrees,
    tiltDegrees,
    usableAreaRatio,
    polygonComplete,
    source: normalizeSource(
      input.source,
      hasRoofInput ? SOURCE_KIND.MANUAL : SOURCE_KIND.UNAVAILABLE,
      polygonComplete
        ? SOURCE_STATUS.CONFIRMED
        : hasRoofInput
          ? SOURCE_STATUS.PROVIDED
          : SOURCE_STATUS.UNAVAILABLE
    )
  };
};

const normalizeProduction = (input = {}) => {
  const annualYieldKwhPerKwp = toPositiveNumberOrNull(input.annualYieldKwhPerKwp);
  const suppliedFactors = Array.isArray(input.monthlyYieldFactors)
    ? input.monthlyYieldFactors
    : null;
  const monthlyYieldFactors =
    suppliedFactors?.length === MONTHS_PER_YEAR ? suppliedFactors.map(toFiniteNumberOrNull) : null;
  const monthlyFactorSum = monthlyYieldFactors?.every((value) => value !== null && value >= 0)
    ? sum(monthlyYieldFactors)
    : 0;
  const normalizedFactors =
    monthlyFactorSum > 0 ? monthlyYieldFactors.map((value) => value / monthlyFactorSum) : null;
  const hasProductionInput = annualYieldKwhPerKwp !== null || suppliedFactors !== null;

  return {
    available: annualYieldKwhPerKwp !== null,
    annualYieldKwhPerKwp,
    monthlyYieldFactors: normalizedFactors,
    issues: [
      ...(annualYieldKwhPerKwp === null && hasProductionInput ? ['ANNUAL_YIELD_REQUIRED'] : []),
      ...(suppliedFactors !== null && normalizedFactors === null
        ? ['MONTHLY_YIELD_PROFILE_INVALID']
        : [])
    ],
    source: normalizeSource(
      input.source,
      hasProductionInput ? SOURCE_KIND.MANUAL : SOURCE_KIND.UNAVAILABLE,
      hasProductionInput ? SOURCE_STATUS.PROVIDED : SOURCE_STATUS.UNAVAILABLE
    )
  };
};

const normalizeEquipment = (input, panelWatts, panelAreaSqm) => {
  if (!input || typeof input !== 'object') return null;
  const panelId = cleanString(input.panelId);
  const panelBrand = cleanString(input.panelBrand);
  const panelModel = cleanString(input.panelModel);
  if (
    !panelId ||
    !panelBrand ||
    !panelModel ||
    panelWatts === null ||
    panelAreaSqm === null ||
    input.source !== 'equipment-catalog'
  ) {
    return null;
  }

  return {
    panelId,
    panelBrand,
    panelModel,
    panelWatts,
    panelAreaSqm,
    source: 'equipment-catalog'
  };
};

const normalizeSystem = (input = {}) => {
  const system = input && typeof input === 'object' ? input : {};
  const panelWatts = toPositiveNumberOrNull(system.panelWatts);
  const panelAreaSqm = toPositiveNumberOrNull(system.panelAreaSqm);
  return {
    panelWatts,
    panelAreaSqm,
    equipment: normalizeEquipment(system.equipment, panelWatts, panelAreaSqm)
  };
};

const normalizeInvestment = (input = {}) => ({
  capexAmd: toPositiveNumberOrNull(input.capexAmd),
  quotedCapacityKwp: toPositiveNumberOrNull(input.quotedCapacityKwp),
  capexAmdPerKwp: toPositiveNumberOrNull(input.capexAmdPerKwp),
  source: normalizeSource(
    input.source,
    input.capexAmd !== undefined || input.capexAmdPerKwp !== undefined
      ? SOURCE_KIND.MANUAL
      : SOURCE_KIND.UNAVAILABLE,
    input.capexAmd !== undefined || input.capexAmdPerKwp !== undefined
      ? SOURCE_STATUS.PROVIDED
      : SOURCE_STATUS.UNAVAILABLE
  )
});

const normalizeScenarioTargets = (targets) => {
  const values = Array.isArray(targets) && targets.length ? targets : DEFAULT_SCENARIO_TARGETS;
  const normalized = values
    .map((target, index) => {
      const value = toFiniteNumberOrNull(target?.targetCoverage ?? target);
      if (value === null || value <= 0 || value > 1) return null;
      return {
        id: cleanString(target?.id) ?? `scenario-${index + 1}`,
        targetCoverage: value
      };
    })
    .filter(Boolean);
  return normalized.length ? normalized : [...DEFAULT_SCENARIO_TARGETS];
};

const roofPanelLimit = (roof, system) => {
  return (
    calculatePreliminaryRoofCapacity({
      roofAreaSqm: roof.areaSqm,
      projectedRoofAreaSqm: roof.projectedAreaSqm,
      areaMethod: roof.areaMethod,
      mountingMode: roof.mountingMode,
      tiltDegrees: roof.tiltDegrees,
      usableAreaRatio: roof.usableAreaRatio,
      panelAreaSqm: system.panelAreaSqm,
      panelWatts: system.panelWatts
    })?.maximumPanelCount ?? null
  );
};

// Scenario coverage is a minimum target. When there is roof capacity for the
// next whole module, rounding down would knowingly underdeliver that target.
const roundPanelCount = (requestedPanelCount) => Math.ceil(requestedPanelCount);

const getScenarioCapex = (investment, capacityKwp) => {
  if (investment.capexAmdPerKwp !== null) return capacityKwp * investment.capexAmdPerKwp;
  if (
    investment.capexAmd !== null &&
    investment.quotedCapacityKwp !== null &&
    Math.abs(investment.quotedCapacityKwp - capacityKwp) < 0.01
  ) {
    return investment.capexAmd;
  }
  return null;
};

const financialPrice = (commercialEstimate, capexAmd) => ({
  kind: commercialEstimate?.available
    ? commercialEstimate.kind
    : capexAmd !== null
      ? 'confirmed'
      : 'unavailable',
  source: commercialEstimate?.available
    ? (commercialEstimate.priceBook?.source ?? unavailableSource)
    : capexAmd !== null
      ? null
      : unavailableSource,
  validUntil: commercialEstimate?.available ? commercialEstimate.validUntil : null
});

const makeTimeline = (capexAmd, annualSavingsAmd) => {
  if (capexAmd === null || annualSavingsAmd === null) return [];
  return [0, 5, 10, 25].map((year) => ({
    year,
    netAmd: year === 0 ? -capexAmd : annualSavingsAmd * year - capexAmd
  }));
};

// Armenian autonomous-generation settlement starts in May and ends in April.
// A credit created in one month is available only in following months of that
// settlement year; a balance left after April is annual surplus rather than a
// retail-rate offset. The input arrays retain calendar order (Jan..Dec).
const ARMENIA_SETTLEMENT_MONTH_ORDER = Object.freeze([4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3]);

const validMonthlyEnergy = (values) =>
  Array.isArray(values) &&
  values.length === MONTHS_PER_YEAR &&
  values.every((value) => Number.isFinite(value) && value >= 0);

// PVGIS factors and division into twelve months can produce binary floating
// point dust (for example 1_000.0000000000001 kWh). Keep the financial and
// limitation boundary deterministic without rounding meaningful energy data.
const stableEnergy = (value) => {
  const rounded = Number(value.toFixed(9));
  return Math.abs(rounded) < 1e-9 ? 0 : rounded;
};

/**
 * Settles one May-to-April Armenian net-metering year from calendar-month
 * consumption and generation. The result intentionally has no tariff: the
 * caller can apply either a verified effective rate or a user-provided one.
 */
export const calculateArmeniaNetMeteringSettlement = ({
  monthlyConsumptionKwh,
  monthlyGenerationKwh
} = {}) => {
  if (!validMonthlyEnergy(monthlyConsumptionKwh) || !validMonthlyEnergy(monthlyGenerationKwh)) {
    return null;
  }

  let carriedCreditKwh = 0;
  let gridPurchaseKwh = 0;
  let offsetEnergyKwh = 0;
  const monthlyOffsetEnergyKwh = Array(MONTHS_PER_YEAR).fill(0);

  for (const monthIndex of ARMENIA_SETTLEMENT_MONTH_ORDER) {
    const consumptionKwh = monthlyConsumptionKwh[monthIndex];
    const availableCreditKwh = carriedCreditKwh + monthlyGenerationKwh[monthIndex];
    const importedKwh = Math.max(consumptionKwh - availableCreditKwh, 0);
    gridPurchaseKwh += importedKwh;
    const monthlyOffset = consumptionKwh - importedKwh;
    monthlyOffsetEnergyKwh[monthIndex] = stableEnergy(monthlyOffset);
    offsetEnergyKwh += monthlyOffset;
    carriedCreditKwh = Math.max(availableCreditKwh - consumptionKwh, 0);
  }

  return {
    offsetEnergyKwh: stableEnergy(offsetEnergyKwh),
    surplusEnergyKwh: stableEnergy(carriedCreditKwh),
    gridPurchaseKwh: stableEnergy(gridPurchaseKwh),
    monthlyOffsetEnergyKwh
  };
};

const rangeFrom = (min, max) =>
  Number.isFinite(min) && Number.isFinite(max) && min <= max ? { min, max } : null;

const multiplyRange = (value, years) =>
  value ? { min: value.min * years, max: value.max * years } : null;

const paybackRange = (capexAmd, annualValueRange) =>
  capexAmd !== null && annualValueRange?.min > 0 && annualValueRange?.max >= annualValueRange.min
    ? {
        min: capexAmd / annualValueRange.max,
        max: capexAmd / annualValueRange.min
      }
    : null;

const retailOffsetRange = ({ tariff, offsetEnergyKwh, monthlyOffsetEnergyKwh }) => {
  const rates = getFinancialTariffRateRange(tariff);
  if (!rates) return null;
  if (
    Array.isArray(tariff?.monthlyTariffs) &&
    tariff.monthlyTariffs.length === MONTHS_PER_YEAR &&
    Array.isArray(monthlyOffsetEnergyKwh) &&
    monthlyOffsetEnergyKwh.length === MONTHS_PER_YEAR
  ) {
    let minimum = 0;
    let maximum = 0;
    for (let index = 0; index < MONTHS_PER_YEAR; index += 1) {
      const month = tariff.monthlyTariffs[index];
      const offset = monthlyOffsetEnergyKwh[index];
      const minRate = toPositiveNumberOrNull(month?.minRateAmdPerKwh);
      const maxRate = toPositiveNumberOrNull(month?.maxRateAmdPerKwh);
      if (minRate === null || maxRate === null || !Number.isFinite(offset)) return null;
      minimum += offset * minRate;
      maximum += offset * maxRate;
    }
    return rangeFrom(minimum, maximum);
  }
  return rangeFrom(offsetEnergyKwh * rates.min, offsetEnergyKwh * rates.max);
};

const surplusCompensationSummary = (selection) => ({
  kind: selection?.kind === 'regulatory-registry' ? 'registry' : 'unavailable',
  available: selection?.available === true,
  id: selection?.compensation?.id ?? null,
  revision: selection?.dataset?.revision ?? selection?.compensation?.datasetRevision ?? null,
  rateAmdPerKwh: getUsableSurplusCompensationRate(selection),
  reason: selection?.reason ?? 'SURPLUS_COMPENSATION_NOT_CONFIGURED',
  source: selection?.source ?? unavailableSource
});

/**
 * Calculates one scenario exclusively from the supplied inputs. It never
 * fills in a solar yield, tariff, roof area, or price on the caller's behalf.
 */
export const calculateSolarScenario = ({
  id,
  targetCoverage,
  consumption: suppliedConsumption,
  roof: suppliedRoof,
  production: suppliedProduction,
  tariff = null,
  surplusCompensation: suppliedSurplusCompensation,
  surplusCompensationDataset,
  investment: suppliedInvestment,
  system: suppliedSystem,
  priceBook = null,
  storageRequired = false,
  effectiveDate = new Date()
} = {}) => {
  const consumption = isNormalizedConsumption(suppliedConsumption)
    ? suppliedConsumption
    : normalizeConsumption(suppliedConsumption, { tariff });
  const roof = normalizeRoof(suppliedRoof);
  const production = normalizeProduction(suppliedProduction);
  const investment = normalizeInvestment(suppliedInvestment);
  const system = normalizeSystem(suppliedSystem);
  const surplusCompensation =
    suppliedSurplusCompensation ??
    selectEffectiveSurplusCompensation(surplusCompensationDataset, effectiveDate);
  const target = toFiniteNumberOrNull(targetCoverage);
  const readyForGeneration =
    consumption?.available &&
    consumption.annualKwh !== null &&
    production?.available &&
    production.annualYieldKwhPerKwp !== null &&
    target !== null &&
    target > 0 &&
    target <= 1;

  if (!readyForGeneration) {
    return {
      id,
      targetCoverage: target,
      status: ANALYSIS_STATUS.UNAVAILABLE,
      limitations: ['CONSUMPTION_AND_CONFIRMED_YIELD_REQUIRED'],
      system: {
        capacityKwp: null,
        panelCount: null,
        panelWatts: system.panelWatts,
        panelAreaSqm: system.panelAreaSqm,
        equipment: system.equipment
      },
      generation: { annualKwh: null, monthlyKwh: null },
      energyBalance: {
        annualConsumptionKwh: consumption?.annualKwh ?? null,
        annualGenerationKwh: null,
        offsetEnergyKwh: null,
        surplusEnergyKwh: null
      },
      coveragePercent: null,
      financial: {
        retailOffsetValueAmd: null,
        retailOffsetValueRangeAmd: null,
        surplusCompensationValueAmd: null,
        annualEconomicValueAmd: null,
        annualEconomicValueRangeAmd: null,
        annualSavingsAmd: null,
        annualSavingsRangeAmd: null,
        grossSavings25YearsAmd: null,
        grossSavings25YearsRangeAmd: null,
        capexAmd: null,
        paybackYears: null,
        paybackRangeYears: null,
        storagePriceUnavailable: storageRequired,
        solarOnlyAnnualSavingsAmd: null,
        solarOnlyAnnualSavingsRangeAmd: null,
        solarOnlyGrossSavings25YearsAmd: null,
        solarOnlyGrossSavings25YearsRangeAmd: null,
        solarOnlyCapexAmd: null,
        solarOnlyPaybackYears: null,
        solarOnlyPaybackRangeYears: null,
        timeline: [],
        price: financialPrice(null, null),
        surplusCompensation: surplusCompensationSummary(surplusCompensation)
      },
      commercialEstimate: buildCommercialEstimate({
        capacityKwp: null,
        priceBook,
        at: effectiveDate
      })
    };
  }

  const requestedCapacityKwp = (consumption.annualKwh * target) / production.annualYieldKwhPerKwp;
  const maxPanelCount = roofPanelLimit(roof, system);
  const requestedPanelCount = system.panelWatts
    ? roundPanelCount((requestedCapacityKwp * 1000) / system.panelWatts)
    : null;
  const panelCount =
    requestedPanelCount === null
      ? null
      : maxPanelCount === null
        ? requestedPanelCount
        : Math.min(requestedPanelCount, maxPanelCount);
  const capacityKwp =
    panelCount === null ? requestedCapacityKwp : (panelCount * system.panelWatts) / 1000;
  const annualKwh = capacityKwp * production.annualYieldKwhPerKwp;
  const monthlyKwh = production.monthlyYieldFactors
    ? production.monthlyYieldFactors.map((factor) => annualKwh * factor)
    : null;
  const retailRateAmdPerKwh = getUsableTariffRate(tariff);
  const financialTariffRange = getFinancialTariffRateRange(tariff);
  const surplusCompensationRateAmdPerKwh = getUsableSurplusCompensationRate(surplusCompensation);
  // A monthly consumption profile is used exactly when the visitor supplied
  // one. A single annual/monthly-average value cannot recover seasonality, so
  // its documented fallback is an even monthly profile rather than a false
  // annual netting calculation.
  const monthlyConsumptionKwh =
    consumption.monthlyKwh ?? Array(MONTHS_PER_YEAR).fill(consumption.annualKwh / MONTHS_PER_YEAR);
  const monthlyGenerationKwh =
    monthlyKwh ?? Array(MONTHS_PER_YEAR).fill(annualKwh / MONTHS_PER_YEAR);
  const settlement = calculateArmeniaNetMeteringSettlement({
    monthlyConsumptionKwh,
    monthlyGenerationKwh
  });
  const offsetEnergyKwh = settlement?.offsetEnergyKwh ?? Math.min(annualKwh, consumption.annualKwh);
  const surplusEnergyKwh =
    settlement?.surplusEnergyKwh ?? Math.max(annualKwh - consumption.annualKwh, 0);
  const retailOffsetValueAmd =
    retailRateAmdPerKwh === null ? null : offsetEnergyKwh * retailRateAmdPerKwh;
  const calculatedRetailOffsetRange = retailOffsetRange({
    tariff,
    offsetEnergyKwh,
    monthlyOffsetEnergyKwh: settlement?.monthlyOffsetEnergyKwh
  });
  const retailOffsetValueRangeAmd =
    financialTariffRange?.effective === null ? calculatedRetailOffsetRange : null;
  const surplusCompensationValueAmd =
    surplusEnergyKwh === 0
      ? 0
      : surplusCompensationRateAmdPerKwh === null
        ? null
        : surplusEnergyKwh * surplusCompensationRateAmdPerKwh;
  const annualEconomicValueAmd =
    retailOffsetValueAmd === null || surplusCompensationValueAmd === null
      ? null
      : retailOffsetValueAmd + surplusCompensationValueAmd;
  const annualEconomicValueRangeAmd =
    retailOffsetValueRangeAmd === null || surplusCompensationValueAmd === null
      ? null
      : rangeFrom(
          retailOffsetValueRangeAmd.min + surplusCompensationValueAmd,
          retailOffsetValueRangeAmd.max + surplusCompensationValueAmd
        );
  const commercialEstimate = buildCommercialEstimate({ capacityKwp, priceBook, at: effectiveDate });
  const solarOnlyCapexAmd =
    getScenarioCapex(investment, capacityKwp) ?? commercialEstimate.primaryAmd;
  const solarOnlyPaybackYears =
    solarOnlyCapexAmd !== null && annualEconomicValueAmd !== null && annualEconomicValueAmd > 0
      ? solarOnlyCapexAmd / annualEconomicValueAmd
      : null;
  const solarOnlyPaybackRangeYears = paybackRange(solarOnlyCapexAmd, annualEconomicValueRangeAmd);
  // The active residential price book explicitly excludes batteries. A hybrid
  // inverter recommendation is not evidence that battery hardware or its
  // installation cost is covered by the solar-only budget.
  const storagePriceUnavailable =
    storageRequired === true && !commercialEstimate.scope?.includes('battery');
  const capexAmd = storagePriceUnavailable ? null : solarOnlyCapexAmd;
  const paybackYears = storagePriceUnavailable ? null : solarOnlyPaybackYears;
  const calculatedPaybackRangeYears = storagePriceUnavailable ? null : solarOnlyPaybackRangeYears;
  const roofLimited =
    maxPanelCount !== null && requestedPanelCount !== null && panelCount < requestedPanelCount;

  const financialReady =
    !storagePriceUnavailable &&
    capexAmd !== null &&
    capexAmd > 0 &&
    ((annualEconomicValueAmd !== null && annualEconomicValueAmd > 0) ||
      (annualEconomicValueRangeAmd?.min > 0 && annualEconomicValueRangeAmd?.max > 0));

  return {
    id,
    targetCoverage: target,
    status: financialReady ? ANALYSIS_STATUS.FINANCIAL_READY : ANALYSIS_STATUS.TECHNICAL_READY,
    limitations: [
      ...(roofLimited ? ['ROOF_CAPACITY_LIMIT'] : []),
      ...(financialTariffRange === null ? ['TARIFF_REQUIRED'] : []),
      ...(surplusEnergyKwh > 0 && surplusCompensationValueAmd === null
        ? ['SURPLUS_COMPENSATION_UNAVAILABLE']
        : []),
      ...(storagePriceUnavailable ? ['STORAGE_PRICE_UNAVAILABLE'] : []),
      ...(!storagePriceUnavailable && capexAmd === null ? ['CAPEX_REQUIRED'] : [])
    ],
    system: {
      capacityKwp,
      panelCount,
      panelWatts: system.panelWatts,
      panelAreaSqm: system.panelAreaSqm,
      requestedCapacityKwp,
      maximumPanelCount: maxPanelCount,
      equipment: system.equipment
    },
    generation: { annualKwh, monthlyKwh },
    energyBalance: {
      annualConsumptionKwh: consumption.annualKwh,
      annualGenerationKwh: annualKwh,
      offsetEnergyKwh,
      surplusEnergyKwh
    },
    // “Consumption coverage” has a 100% ceiling. Generation above annual
    // demand is preserved separately as surplus energy, not mislabeled as
    // greater-than-100% coverage.
    coveragePercent: (offsetEnergyKwh / consumption.annualKwh) * 100,
    financial: {
      retailOffsetValueAmd,
      retailOffsetValueRangeAmd,
      surplusCompensationValueAmd,
      annualEconomicValueAmd: storagePriceUnavailable ? null : annualEconomicValueAmd,
      annualEconomicValueRangeAmd: storagePriceUnavailable ? null : annualEconomicValueRangeAmd,
      // Retained for presentation compatibility; it is now always the
      // corrected complete annual economic value, never all generation at a
      // retail rate.
      annualSavingsAmd: storagePriceUnavailable ? null : annualEconomicValueAmd,
      annualSavingsRangeAmd: storagePriceUnavailable ? null : annualEconomicValueRangeAmd,
      grossSavings25YearsAmd:
        storagePriceUnavailable || annualEconomicValueAmd === null
          ? null
          : annualEconomicValueAmd * 25,
      grossSavings25YearsRangeAmd: storagePriceUnavailable
        ? null
        : multiplyRange(annualEconomicValueRangeAmd, 25),
      capexAmd,
      paybackYears,
      paybackRangeYears: calculatedPaybackRangeYears,
      timeline: storagePriceUnavailable ? [] : makeTimeline(capexAmd, annualEconomicValueAmd),
      price: storagePriceUnavailable
        ? financialPrice(null, null)
        : financialPrice(commercialEstimate, capexAmd),
      storagePriceUnavailable,
      solarOnlyAnnualSavingsAmd: annualEconomicValueAmd,
      solarOnlyAnnualSavingsRangeAmd: annualEconomicValueRangeAmd,
      solarOnlyGrossSavings25YearsAmd:
        annualEconomicValueAmd === null ? null : annualEconomicValueAmd * 25,
      solarOnlyGrossSavings25YearsRangeAmd: multiplyRange(annualEconomicValueRangeAmd, 25),
      solarOnlyCapexAmd,
      solarOnlyPaybackYears,
      solarOnlyPaybackRangeYears,
      solarOnlyPrice: financialPrice(commercialEstimate, solarOnlyCapexAmd),
      surplusCompensation: surplusCompensationSummary(surplusCompensation)
    },
    commercialEstimate
  };
};

const sourceEntry = (key, source, available, reason = null) => ({
  key,
  available: Boolean(available),
  status: source?.status ?? SOURCE_STATUS.UNAVAILABLE,
  source: source ?? unavailableSource,
  reason
});

const catalogSource = (productId) => ({
  kind: SOURCE_KIND.CATALOG,
  status: SOURCE_STATUS.CONFIRMED,
  provider: 'equipment-catalog',
  reference: productId,
  verifiedAt: null
});

/**
 * Builds a transparent completeness score. It measures evidence available to
 * this calculation, rather than the physical quality of the proposed system.
 */
const calculateDataCompleteness = ({
  property,
  consumption,
  roof,
  production,
  tariff,
  investment,
  priceBook = null,
  effectiveDate = new Date()
}) => {
  const checks = [
    { key: 'property', complete: property.confirmed },
    { key: 'consumption', complete: consumption.available },
    { key: 'roof', complete: roof.polygonComplete || roof.areaSqm !== null },
    {
      key: 'production',
      complete: production.available && production.source.status === SOURCE_STATUS.CONFIRMED
    },
    { key: 'tariff', complete: getFinancialTariffRateRange(tariff) !== null },
    {
      key: 'investment',
      complete:
        investment.capexAmdPerKwp !== null ||
        investment.capexAmd !== null ||
        buildCommercialEstimate({ capacityKwp: 1, priceBook, at: effectiveDate }).available
    }
  ];
  const score = checks.filter((check) => check.complete).length;
  const missing = checks.filter((check) => !check.complete).map((check) => check.key);
  const essentialMissing = !consumption.available || !production.available;
  const level = essentialMissing
    ? DATA_COMPLETENESS_LEVEL.UNAVAILABLE
    : score >= 3
      ? DATA_COMPLETENESS_LEVEL.PRELIMINARY
      : DATA_COMPLETENESS_LEVEL.INCOMPLETE;

  return { level, score, maximumScore: checks.length, missing };
};

/**
 * Creates a deterministic, provider-agnostic analysis from manual and/or
 * confirmed provider inputs. Standard residential tariffs are derived from
 * consumption as day/night financial bounds. A visitor may override those
 * bounds with one observed effective rate, but cannot choose registry internals.
 *
 * @param {Object} [input]
 * @returns {import('./models.js').SolarAnalysis}
 */
export const buildSolarAnalysis = (input = {}) => {
  const property = normalizeProperty(input.property);
  const roof = normalizeRoof(input.roof);
  const system = normalizeSystem(input.system);
  const investment = normalizeInvestment(input.investment);
  const priceBook = input.priceBook ?? null;
  const consumption = isNormalizedConsumption(input.consumption)
    ? input.consumption
    : normalizeConsumption(input.consumption, {
        tariff: input.tariffSelection,
        tariffDataset: input.tariffDataset,
        effectiveDate: input.effectiveDate
      });
  const tariff =
    input.tariffSelection ??
    (Array.isArray(consumption.monthlyKwh)
      ? createAutomaticStandardResidentialTariffProfile(
          consumption.monthlyKwh,
          input.tariffDataset,
          input.effectiveDate
        )
      : createAutomaticStandardResidentialTariff(
          consumption.averageMonthlyKwh,
          input.tariffDataset,
          input.effectiveDate
        ));
  const surplusCompensation =
    input.surplusCompensationSelection ??
    selectEffectiveSurplusCompensation(input.surplusCompensationDataset, input.effectiveDate);
  const production = normalizeProduction(input.production);
  const scenarios = normalizeScenarioTargets(input.scenarioTargets).map((scenario) =>
    calculateSolarScenario({
      ...scenario,
      consumption,
      roof,
      production,
      tariff,
      surplusCompensation,
      investment,
      system,
      priceBook,
      storageRequired: input.storageRequired === true,
      effectiveDate: input.effectiveDate
    })
  );
  const selectedScenarioId =
    cleanString(input.selectedScenarioId) ?? scenarios[1]?.id ?? scenarios[0]?.id;
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0] ?? null;
  const inverterRecommendation = recommendInverter({
    dcCapacityKwp: selectedScenario?.system?.capacityKwp,
    storageRequired: input.storageRequired === true
  });
  const storageInput = input.storage && typeof input.storage === 'object' ? input.storage : {};
  const storageRecommendation = recommendStorage({
    storageRequired: input.storageRequired === true,
    criticalLoadPowerKw: storageInput.criticalLoadPowerKw,
    backupDurationHours: storageInput.backupDurationHours
  });
  const mountingHardwareRecommendation = recommendMountingHardware({
    mountingMode: roof.mountingMode,
    pvgisOptimumTiltDegrees:
      input.mountingRecommendation?.basis === 'pvgis-fixed-free-standing-optimum'
        ? input.mountingRecommendation.tiltDegrees
        : null
  });
  const equipmentRecommendation = buildEquipmentRecommendation({
    selectedScenario,
    inverterRecommendation,
    mountingHardwareRecommendation,
    storageRecommendation
  });
  const scope = cleanString(input.scope) ?? 'manual-roof-plane';
  const status = selectedScenario?.status ?? ANALYSIS_STATUS.UNAVAILABLE;
  const commercialEstimate = selectedScenario?.commercialEstimate ?? null;
  const tariffKind =
    tariff?.kind === 'user' ||
    tariff?.kind === 'bill-derived' ||
    tariff?.kind === 'automatic-standard-residential'
      ? tariff.kind
      : 'unavailable';
  const tariffRecord = tariff?.tariff ?? {};
  const financialTariff = {
    kind: tariffKind,
    id: tariffRecord.id ?? null,
    tariffId: tariffRecord.tariffId ?? null,
    revision: tariff?.dataset?.revision ?? tariffRecord.datasetRevision ?? null,
    customerType: tariffRecord.customerType ?? null,
    period: tariffRecord.period ?? null,
    sourceType: tariffRecord.tariffSource ?? null,
    tariffSource: tariffRecord.tariffSource ?? null,
    billAmd: tariffRecord.billAmd ?? null,
    billedKwh: tariffRecord.billedKwh ?? null,
    bracketMinMonthlyKwh: tariffRecord.minMonthlyKwh ?? null,
    bracketMinMonthlyKwhInclusive: tariffRecord.minMonthlyKwhInclusive !== false,
    bracketMaxMonthlyKwh: tariffRecord.maxMonthlyKwh ?? null,
    dayRateAmdPerKwh: tariffRecord.dayRateAmdPerKwh ?? null,
    nightRateAmdPerKwh: tariffRecord.nightRateAmdPerKwh ?? null,
    minRateAmdPerKwh: tariffRecord.minRateAmdPerKwh ?? null,
    maxRateAmdPerKwh: tariffRecord.maxRateAmdPerKwh ?? null,
    effectiveRateAmdPerKwh: tariffRecord.effectiveRateAmdPerKwh ?? getUsableTariffRate(tariff),
    // Compatibility scalar: null for an unknown standard day/night mix.
    rateAmdPerKwh: getUsableTariffRate(tariff),
    accuracy: tariffRecord.accuracy ?? null,
    monthlyTariffs: Array.isArray(tariff?.monthlyTariffs)
      ? tariff.monthlyTariffs.map((month) => ({
          monthIndex: month.monthIndex,
          monthlyKwh: month.monthlyKwh,
          tariffId: month.tariffId,
          bracketMinMonthlyKwh: month.minMonthlyKwh,
          bracketMinMonthlyKwhInclusive: month.minMonthlyKwhInclusive !== false,
          bracketMaxMonthlyKwh: month.maxMonthlyKwh,
          dayRateAmdPerKwh: month.dayRateAmdPerKwh,
          nightRateAmdPerKwh: month.nightRateAmdPerKwh,
          minRateAmdPerKwh: month.minRateAmdPerKwh,
          maxRateAmdPerKwh: month.maxRateAmdPerKwh
        }))
      : null,
    source: tariff?.source ?? unavailableSource
  };
  const priceKind = commercialEstimate?.available
    ? commercialEstimate.kind
    : (selectedScenario?.financial?.price?.kind ?? 'unavailable');
  const environmental = buildEnvironmentalImpact({
    annualGenerationKwh: selectedScenario?.generation?.annualKwh,
    gridEmissionFactor: input.gridEmissionFactor,
    treeEquivalency: input.treeEquivalency,
    at: input.effectiveDate
  });
  const environmentalSource =
    environmental.factor.valueKgCo2PerKwh !== null
      ? {
          kind: SOURCE_KIND.REGISTRY,
          status: SOURCE_STATUS.CONFIRMED,
          provider: environmental.factor.provider,
          reference: environmental.factor.sourceUrl,
          verifiedAt: environmental.factor.verifiedAt
        }
      : unavailableSource;
  const sourceLedger = [
    sourceEntry(
      'property',
      property.source,
      property.confirmed,
      property.confirmed ? null : 'PROPERTY_CONFIRMATION_REQUIRED'
    ),
    sourceEntry(
      'consumption',
      consumption.source,
      consumption.available,
      consumption.issues?.[0] ?? null
    ),
    sourceEntry(
      'roof',
      roof.source,
      roof.polygonComplete || roof.areaSqm !== null,
      roof.polygonComplete ? null : 'ROOF_CONFIRMATION_RECOMMENDED'
    ),
    sourceEntry(
      'production',
      production.source,
      production.available,
      production.available ? null : (production.issues?.[0] ?? 'PRODUCTION_YIELD_REQUIRED')
    ),
    sourceEntry(
      'tariff',
      tariff?.source,
      tariff?.available,
      tariff?.available ? null : (tariff?.reason ?? 'TARIFF_REQUIRED')
    ),
    sourceEntry(
      'surplus-compensation',
      surplusCompensation?.source,
      surplusCompensation?.available,
      surplusCompensation?.reason ?? 'SURPLUS_COMPENSATION_NOT_CONFIGURED'
    ),
    sourceEntry(
      'investment',
      investment.source,
      investment.capexAmdPerKwp !== null || investment.capexAmd !== null,
      investment.capexAmdPerKwp !== null || investment.capexAmd !== null ? null : 'CAPEX_REQUIRED'
    ),
    sourceEntry(
      'pricebook',
      commercialEstimate?.priceBook?.source,
      Boolean(commercialEstimate?.available),
      commercialEstimate?.available ? null : (commercialEstimate?.reason ?? 'PRICEBOOK_UNAVAILABLE')
    ),
    sourceEntry(
      'environment',
      environmentalSource,
      environmental.avoidedCo2Tons !== null,
      environmental.avoidedCo2Tons !== null
        ? `VERIFIED_HISTORICAL_GRID_FACTOR_${environmental.factor.dataYear ?? 'UNKNOWN'}`
        : 'GRID_FACTOR_UNAVAILABLE'
    ),
    ...(system.equipment?.panelId
      ? [sourceEntry('panel', catalogSource(system.equipment.panelId), true)]
      : []),
    ...(equipmentRecommendation?.inverter?.productId
      ? [sourceEntry('inverter', catalogSource(equipmentRecommendation.inverter.productId), true)]
      : []),
    ...(equipmentRecommendation?.storage?.productId
      ? [sourceEntry('storage', catalogSource(equipmentRecommendation.storage.productId), true)]
      : []),
    ...(equipmentRecommendation?.mounting?.productId
      ? [
          sourceEntry(
            'mounting-hardware',
            catalogSource(equipmentRecommendation.mounting.productId),
            true
          )
        ]
      : [])
  ];

  const dataCompleteness = calculateDataCompleteness({
    property,
    consumption,
    roof,
    production,
    tariff,
    investment,
    priceBook,
    effectiveDate: input.effectiveDate
  });
  const limitations = Array.isArray(input.limitations)
    ? input.limitations.filter((limitation) => typeof limitation === 'string' && limitation)
    : [];
  const calculationBasis = buildCalculationBasis({
    scope,
    property,
    consumption,
    roof,
    production,
    equipment: system.equipment,
    equipmentRecommendation,
    financial: {
      tariff: financialTariff,
      surplusCompensation: surplusCompensationSummary(surplusCompensation)
    },
    calculationConfig: input.calculationConfig,
    regionalReference: input.regionalReference
  });

  return {
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    mode: 'real-analysis',
    status,
    property,
    consumption,
    roof,
    production,
    tariff,
    system,
    equipment: system.equipment,
    inverterRecommendation,
    storageRecommendation,
    mountingHardwareRecommendation,
    equipmentRecommendation,
    investment,
    priceBook: commercialEstimate?.priceBook ?? null,
    commercialEstimate,
    scope,
    dataCompleteness,
    cache: input.cache && typeof input.cache === 'object' ? input.cache : null,
    providerRetrievedAt: cleanString(input.providerRetrievedAt),
    mountingRecommendation:
      input.mountingRecommendation && typeof input.mountingRecommendation === 'object'
        ? {
            mountingMode: cleanString(input.mountingRecommendation.mountingMode),
            tiltDegrees: toFiniteNumberOrNull(input.mountingRecommendation.tiltDegrees),
            azimuthDegrees: toFiniteNumberOrNull(input.mountingRecommendation.azimuthDegrees),
            basis: cleanString(input.mountingRecommendation.basis)
          }
        : null,
    calculationBasis,
    environmental,
    limitations,
    financial: {
      tariff: financialTariff,
      surplusCompensation: surplusCompensationSummary(surplusCompensation),
      price: {
        kind: priceKind,
        source: commercialEstimate?.priceBook?.source ?? unavailableSource,
        validUntil: commercialEstimate?.validUntil ?? null
      }
    },
    scenarios,
    selectedScenario,
    sourceLedger,
    assumptions: [
      ...ANALYSIS_ASSUMPTIONS,
      'ARMENIA_MONTHLY_NET_METERING_MAY_TO_APRIL',
      ...(consumption.monthlyKwh === null ? ['UNIFORM_MONTHLY_CONSUMPTION_FOR_SETTLEMENT'] : []),
      ...(tariffKind === 'user' ? ['USER_PROVIDED_TARIFF'] : []),
      ...(tariffKind === 'bill-derived' ? ['BILL_DERIVED_EFFECTIVE_RATE'] : []),
      ...(tariffKind === 'automatic-standard-residential'
        ? [
            'CONFIRMED_REGISTRY_TARIFF',
            ...(typeof tariff?.assumption === 'string' && tariff.assumption
              ? [tariff.assumption]
              : [])
          ]
        : []),
      ...(environmental.factor.status === 'verified-historical'
        ? [`VERIFIED_HISTORICAL_GRID_FACTOR_${environmental.factor.dataYear ?? 'UNKNOWN'}`]
        : []),
      ...(commercialEstimate?.kind === 'owner-managed'
        ? ['OWNER_MANAGED_PRICEBOOK_NOT_OFFER']
        : []),
      ...(Array.isArray(input.assumptions)
        ? input.assumptions.filter((assumption) => typeof assumption === 'string' && assumption)
        : [])
    ]
  };
};
