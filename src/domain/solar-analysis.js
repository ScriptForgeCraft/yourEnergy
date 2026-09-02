import { normalizeConsumption, isNormalizedConsumption } from './consumption.js';
import { ANALYSIS_STATUS, DATA_COMPLETENESS_LEVEL, SOURCE_KIND, SOURCE_STATUS } from './models.js';
import {
  cleanString,
  MONTHS_PER_YEAR,
  round,
  sum,
  toFiniteNumberOrNull,
  toPositiveNumberOrNull
} from './numbers.js';
import { getUsableTariffRate, selectEffectiveTariff } from './tariffs.js';
import { buildCommercialEstimate } from './pricebook.js';

export const ANALYSIS_SCHEMA_VERSION = '1.0.0';

/**
 * Planning coverage choices, not production quotes or property-specific
 * recommendations. They only turn user-confirmed inputs into comparable
 * scenarios.
 */
export const DEFAULT_SCENARIO_TARGETS = Object.freeze([
  Object.freeze({ id: 'conservative', targetCoverage: 0.7 }),
  Object.freeze({ id: 'balanced', targetCoverage: 0.9 }),
  Object.freeze({ id: 'maximum', targetCoverage: 1 })
]);

export const ANALYSIS_ASSUMPTIONS = Object.freeze([
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
export const normalizeProperty = (input = {}) => {
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
  const measured = toPositiveNumberOrNull(planeAreaSqm);
  const projected = toPositiveNumberOrNull(projectedAreaSqm);
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
  const projectedAreaSqm = toPositiveNumberOrNull(input.projectedAreaSqm);
  const planeAreaSqm = toPositiveNumberOrNull(input.planeAreaSqm);
  const derivedPlaneArea = calculateRoofPlaneArea({
    areaMethod,
    projectedAreaSqm,
    planeAreaSqm,
    tiltDegrees
  });
  const areaSqm = derivedPlaneArea ?? toPositiveNumberOrNull(input.areaSqm);
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

export const normalizeProduction = (input = {}) => {
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

export const normalizeSystem = (input = {}) => ({
  panelWatts: toPositiveNumberOrNull(input.panelWatts),
  panelAreaSqm: toPositiveNumberOrNull(input.panelAreaSqm)
});

export const normalizeInvestment = (input = {}) => ({
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
  if (
    roof.areaSqm === null ||
    roof.usableAreaRatio === null ||
    system.panelAreaSqm === null ||
    system.panelWatts === null
  ) {
    return null;
  }
  return Math.floor((roof.areaSqm * roof.usableAreaRatio) / system.panelAreaSqm);
};

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
  investment: suppliedInvestment,
  system: suppliedSystem,
  priceBook = null,
  effectiveDate = new Date()
} = {}) => {
  const consumption = isNormalizedConsumption(suppliedConsumption)
    ? suppliedConsumption
    : normalizeConsumption(suppliedConsumption, { tariff });
  const roof = normalizeRoof(suppliedRoof);
  const production = normalizeProduction(suppliedProduction);
  const investment = normalizeInvestment(suppliedInvestment);
  const system = normalizeSystem(suppliedSystem);
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
      system: { capacityKwp: null, panelCount: null, panelWatts: system.panelWatts },
      generation: { annualKwh: null, monthlyKwh: null },
      coveragePercent: null,
      financial: {
        annualSavingsAmd: null,
        grossSavings25YearsAmd: null,
        capexAmd: null,
        paybackYears: null,
        timeline: [],
        price: financialPrice(null, null)
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
    ? Math.ceil((requestedCapacityKwp * 1000) / system.panelWatts)
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
  const rateAmdPerKwh = getUsableTariffRate(tariff);
  const annualSavingsAmd = rateAmdPerKwh === null ? null : annualKwh * rateAmdPerKwh;
  const commercialEstimate = buildCommercialEstimate({ capacityKwp, priceBook, at: effectiveDate });
  const capexAmd = getScenarioCapex(investment, capacityKwp) ?? commercialEstimate.primaryAmd;
  const paybackYears =
    capexAmd !== null && annualSavingsAmd !== null && annualSavingsAmd > 0
      ? capexAmd / annualSavingsAmd
      : null;
  const roofLimited =
    maxPanelCount !== null && requestedPanelCount !== null && panelCount < requestedPanelCount;

  const financialReady =
    capexAmd !== null && capexAmd > 0 && annualSavingsAmd !== null && annualSavingsAmd > 0;

  return {
    id,
    targetCoverage: target,
    status: financialReady ? ANALYSIS_STATUS.FINANCIAL_READY : ANALYSIS_STATUS.TECHNICAL_READY,
    limitations: [
      ...(roofLimited ? ['ROOF_CAPACITY_LIMIT'] : []),
      ...(rateAmdPerKwh === null ? ['TARIFF_REQUIRED'] : []),
      ...(capexAmd === null ? ['CAPEX_REQUIRED'] : [])
    ],
    system: {
      capacityKwp,
      panelCount,
      panelWatts: system.panelWatts,
      requestedCapacityKwp,
      maximumPanelCount: maxPanelCount
    },
    generation: { annualKwh, monthlyKwh },
    coveragePercent: (annualKwh / consumption.annualKwh) * 100,
    financial: {
      annualSavingsAmd,
      grossSavings25YearsAmd: annualSavingsAmd === null ? null : annualSavingsAmd * 25,
      capexAmd,
      paybackYears,
      timeline: makeTimeline(capexAmd, annualSavingsAmd),
      price: financialPrice(commercialEstimate, capexAmd)
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

/**
 * Builds a transparent completeness score. It measures evidence available to
 * this calculation, rather than the physical quality of the proposed system.
 */
export const calculateDataCompleteness = ({
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
    { key: 'tariff', complete: getUsableTariffRate(tariff) !== null },
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
 * Creates a deterministic, provider-agnostic P0 analysis from manual and/or
 * confirmed provider inputs. The default tariff registry is intentionally
 * unconfigured, so a default call can produce technical output but never a
 * fabricated savings or payback figure.
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
  const tariff =
    input.tariffSelection ?? selectEffectiveTariff(input.tariffDataset, input.effectiveDate);
  const consumption = isNormalizedConsumption(input.consumption)
    ? input.consumption
    : normalizeConsumption(input.consumption, { tariff });
  const production = normalizeProduction(input.production);
  const scenarios = normalizeScenarioTargets(input.scenarioTargets).map((scenario) =>
    calculateSolarScenario({
      ...scenario,
      consumption,
      roof,
      production,
      tariff,
      investment,
      system,
      priceBook,
      effectiveDate: input.effectiveDate
    })
  );
  const selectedScenarioId =
    cleanString(input.selectedScenarioId) ?? scenarios[1]?.id ?? scenarios[0]?.id;
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0] ?? null;
  const status = selectedScenario?.status ?? ANALYSIS_STATUS.UNAVAILABLE;
  const commercialEstimate = selectedScenario?.commercialEstimate ?? null;
  const tariffKind =
    tariff?.kind === 'user' || tariff?.kind === 'registry' ? tariff.kind : 'unavailable';
  const priceKind = commercialEstimate?.available
    ? commercialEstimate.kind
    : (selectedScenario?.financial?.price?.kind ?? 'unavailable');
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
    )
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
    investment,
    priceBook: commercialEstimate?.priceBook ?? null,
    commercialEstimate,
    scope: cleanString(input.scope) ?? 'manual-roof-plane',
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
    limitations,
    financial: {
      tariff: {
        kind: tariffKind,
        rateAmdPerKwh: getUsableTariffRate(tariff),
        source: tariff?.source ?? unavailableSource
      },
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
      ...(tariffKind === 'user' ? ['USER_PROVIDED_TARIFF'] : []),
      ...(commercialEstimate?.kind === 'temporary' ? ['TEMPORARY_PRICEBOOK_NOT_OFFER'] : []),
      ...(Array.isArray(input.assumptions)
        ? input.assumptions.filter((assumption) => typeof assumption === 'string' && assumption)
        : [])
    ]
  };
};

/** A small helper for UI layers that want stable display values without NaN. */
export const roundAnalysisValue = (value, precision = 2) => round(value, precision);
