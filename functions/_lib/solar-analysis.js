import {
  ARMENIA_TARIFF_DATASET,
  PriceBookRepository,
  buildSolarAnalysis,
  createUserTariffSelection,
  normalizeConsumption
} from '../../src/domain/index.js';
import { ApiError } from './http.js';

const cleanString = (value, maximum = 220) =>
  typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim().slice(0, maximum) || null : null;

const priceBookRepository = new PriceBookRepository();

// Conservative, server-owned assumptions make a manually outlined roof part
// of the preliminary capacity constraint without presenting it as a layout.
const PRELIMINARY_PANEL_WATTS = 580;
const PRELIMINARY_PANEL_AREA_SQM = 2;
const PRELIMINARY_USABLE_ROOF_RATIO = 0.7;
const MAX_PROJECTED_AREA_TILT_DEGREES = 75;

const positiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const validAreaMethod = (value) =>
  value === 'map-projected' || value === 'measured-plane' ? value : null;

const validMountingMode = (value) =>
  value === 'roof-parallel' || value === 'elevated' ? value : null;

const roofAreaFromBody = (body, validatedInput) => {
  const method = validAreaMethod(body?.roof?.areaMethod);
  const mountingMode = validMountingMode(body?.roof?.mountingMode);
  const projectedAreaSqm = positiveNumber(body?.roof?.projectedAreaSqm ?? body?.roof?.areaSqm);
  const measuredPlaneAreaSqm = positiveNumber(body?.roof?.planeAreaSqm);
  if (!method || !mountingMode) throw new ApiError('INVALID_INPUT');

  if (method === 'measured-plane') {
    if (measuredPlaneAreaSqm === null) throw new ApiError('INVALID_INPUT');
    return {
      method,
      mountingMode,
      projectedAreaSqm: null,
      planeAreaSqm: measuredPlaneAreaSqm
    };
  }

  if (projectedAreaSqm === null) throw new ApiError('INVALID_INPUT');
  if (validatedInput.roof.tiltDegrees >= MAX_PROJECTED_AREA_TILT_DEGREES) {
    throw new ApiError('ROOF_AREA_REQUIRES_MEASURED_PLANE');
  }
  const cosine = Math.cos((validatedInput.roof.tiltDegrees * Math.PI) / 180);
  if (!Number.isFinite(cosine) || cosine <= 0)
    throw new ApiError('ROOF_AREA_REQUIRES_MEASURED_PLANE');
  return {
    method,
    mountingMode,
    projectedAreaSqm,
    planeAreaSqm: projectedAreaSqm / cosine
  };
};

const selectTariffForP1 = (body) => {
  const rawRate = body?.tariff?.rateAmdPerKwh;
  if (rawRate !== undefined && rawRate !== null && rawRate !== '') {
    return createUserTariffSelection({ rateAmdPerKwh: rawRate });
  }
  return null;
};

const confirmedProperty = (body, validatedInput) => ({
  address: cleanString(body?.property?.address),
  coordinates: {
    lat: validatedInput.property.latitude,
    lng: validatedInput.property.longitude
  },
  // Confirmation is a user assertion, not a claim that the provider verified ownership.
  confirmed: body?.property?.confirmed === true,
  source: {
    kind: body?.property?.source === 'provider' ? 'provider' : 'manual',
    status: body?.property?.confirmed === true ? 'confirmed' : 'provided',
    provider: cleanString(body?.property?.provider, 100),
    reference: null,
    verifiedAt: cleanString(body?.property?.verifiedAt, 40)
  }
});

const confirmedRoof = (body, validatedInput, validatedArea = null) => {
  const area = validatedArea ?? roofAreaFromBody(body, validatedInput);
  return {
    areaSqm: area.planeAreaSqm,
    areaMethod: area.method,
    projectedAreaSqm: area.projectedAreaSqm,
    planeAreaSqm: area.planeAreaSqm,
    mountingMode: area.mountingMode,
    usableAreaRatio: PRELIMINARY_USABLE_ROOF_RATIO,
    orientationDegrees: validatedInput.roof.azimuthDegrees,
    tiltDegrees: validatedInput.roof.tiltDegrees,
    polygonComplete: body?.roof?.polygonComplete === true,
    source: {
      kind: 'manual',
      status: body?.roof?.polygonComplete === true ? 'confirmed' : 'provided',
      provider: null,
      reference: null,
      verifiedAt: null
    }
  };
};

/**
 * The browser guides this sequence, but the public endpoint must enforce it
 * too. This prevents a caller from obtaining what looks like a property-level
 * result before explicitly confirming a point and outlining a usable roof.
 */
export const validateP0AnalysisWorkflow = (body, validatedInput) => {
  const tariffSelection = selectTariffForP1(body);
  const consumption = normalizeConsumption(body?.consumption, { tariff: tariffSelection });
  const hasConfirmedProperty =
    body?.property?.confirmed === true &&
    (cleanString(body?.property?.address)?.length >= 5 || body?.property?.source === 'manual');
  const hasCompleteRoof =
    body?.roof?.polygonComplete === true ||
    validAreaMethod(body?.roof?.areaMethod) === 'measured-plane';

  if (!hasConfirmedProperty || !hasCompleteRoof || !consumption.available) {
    throw new ApiError('INVALID_INPUT');
  }

  return {
    consumption,
    tariffSelection,
    roofArea: roofAreaFromBody(body, validatedInput)
  };
};

/**
 * Joins a real PVGIS response with browser-confirmed inputs. A visitor may
 * supply a tariff copied from a bill; the server chooses any temporary
 * commercial price book itself and never accepts client-provided capex.
 */
export const buildP0SolarAnalysis = ({
  body,
  validatedInput,
  providerAnalysis,
  tariffSelection,
  roofArea,
  effectiveDate = new Date()
}) => {
  const priceBook = priceBookRepository.getActive({
    region: 'AM',
    systemType: 'residential-grid-tied',
    at: effectiveDate
  });

  return buildSolarAnalysis({
    property: confirmedProperty(body, validatedInput),
    consumption: body?.consumption,
    roof: confirmedRoof(body, validatedInput, roofArea),
    production: {
      // P0 requests exactly 1 kWp, so PVGIS annual generation is a specific yield.
      annualYieldKwhPerKwp: providerAnalysis.generation.annualKwh,
      monthlyYieldFactors: providerAnalysis.generation.monthlyKwh,
      source: {
        kind: 'provider',
        status: 'confirmed',
        provider: 'PVGIS',
        reference: null,
        verifiedAt: providerAnalysis.sourceLedger?.[0]?.retrievedAt ?? new Date().toISOString()
      }
    },
    tariffSelection: tariffSelection ?? undefined,
    tariffDataset: tariffSelection ? undefined : ARMENIA_TARIFF_DATASET,
    system: {
      panelWatts: PRELIMINARY_PANEL_WATTS,
      panelAreaSqm: PRELIMINARY_PANEL_AREA_SQM
    },
    // The browser never controls capex. A dated server-side price book is the
    // only provisional commercial source used in this P1 route.
    investment: {},
    priceBook,
    effectiveDate,
    scope: 'manual-roof-plane',
    dataCompleteness: 'preliminary',
    cache: providerAnalysis.cache ?? null,
    providerRetrievedAt:
      providerAnalysis.providerRetrievedAt ??
      providerAnalysis.sourceLedger?.[0]?.retrievedAt ??
      null,
    mountingRecommendation: providerAnalysis.recommendedMounting ?? null,
    limitations: [
      'MANUAL_PROPERTY_POINT',
      'MANUAL_ROOF_PLANE',
      'LOCAL_OBSTACLES_AND_STRUCTURE_NOT_MEASURED',
      ...(body?.roof?.mountingMode === 'elevated'
        ? ['PVGIS_FREE_STANDING_BENCHMARK_FOR_ELEVATED_MOUNT']
        : ['ROOF_PARALLEL_MOUNT_REQUIRES_ENGINEER_CONFIRMATION'])
    ],
    assumptions: [
      'PVGIS_SYSTEM_LOSS_14_PERCENT',
      'PRELIMINARY_ROOF_USABLE_AREA_70_PERCENT',
      'PRELIMINARY_PANEL_SIZE_580W_2M2',
      ...(body?.roof?.areaMethod === 'map-projected'
        ? ['MAP_PROJECTED_AREA_CONVERTED_TO_ROOF_PLANE']
        : ['USER_MEASURED_ROOF_PLANE_AREA'])
    ]
  });
};

export const __private__ = Object.freeze({
  MAX_PROJECTED_AREA_TILT_DEGREES,
  roofAreaFromBody
});
