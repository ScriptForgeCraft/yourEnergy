import {
  ARMENIA_TARIFF_DATASET,
  buildSolarAnalysis,
  normalizeConsumption
} from '../../src/domain/index.js';
import { ApiError } from './http.js';

const cleanString = (value, maximum = 220) =>
  typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim().slice(0, maximum) || null : null;

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

const confirmedRoof = (body, validatedInput) => ({
  areaSqm: body?.roof?.areaSqm,
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
});

/**
 * The browser guides this sequence, but the public endpoint must enforce it
 * too. This prevents a caller from obtaining what looks like a property-level
 * result before explicitly confirming a point and outlining a usable roof.
 */
export const validateP0AnalysisWorkflow = (body) => {
  const areaSqm = Number(body?.roof?.areaSqm);
  const consumption = normalizeConsumption(body?.consumption, { tariff: null });
  const hasConfirmedProperty =
    body?.property?.confirmed === true && cleanString(body?.property?.address)?.length >= 5;
  const hasCompleteRoof =
    body?.roof?.polygonComplete === true && Number.isFinite(areaSqm) && areaSqm > 0;

  if (!hasConfirmedProperty || !hasCompleteRoof || !consumption.available) {
    throw new ApiError('INVALID_INPUT');
  }

  return { consumption };
};

/**
 * Joins a real PVGIS response with browser-confirmed inputs. It intentionally
 * leaves tariff and capex unavailable until their reviewed sources exist.
 */
export const buildP0SolarAnalysis = ({ body, validatedInput, providerAnalysis }) =>
  buildSolarAnalysis({
    property: confirmedProperty(body, validatedInput),
    consumption: body?.consumption,
    roof: confirmedRoof(body, validatedInput),
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
    tariffDataset: ARMENIA_TARIFF_DATASET,
    system: {},
    investment: {},
    assumptions: ['PVGIS_SYSTEM_LOSS_14_PERCENT']
  });
