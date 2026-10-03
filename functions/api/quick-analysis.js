import {
  ARMENIA_GRID_CO2_FACTOR,
  ARMENIA_TARIFF_DATASET,
  EPA_URBAN_TREE_CO2_EQUIVALENCY,
  PriceBookRepository,
  buildRegionalQuickAnalysis,
  createAutomaticStandardResidentialTariff,
  createAutomaticStandardResidentialTariffProfile,
  createUserTariffSelection,
  getArmeniaRegionalBenchmark,
  normalizeConsumption
} from '../../src/domain/index.js';
import { ApiError, handlePost, readJsonBody } from '../_lib/http.js';
import { createPvgisAdapter } from '../_lib/pvgis.js';

const priceBookRepository = new PriceBookRepository();
const P0_PVGIS_QUERY = Object.freeze({ capacityKwp: 1, lossPercent: 14 });

const userEffectiveRate = (body) => {
  const rawRate = body?.tariff?.rateAmdPerKwh;
  if (rawRate === undefined || rawRate === null || rawRate === '') return null;
  const selection = createUserTariffSelection({ rateAmdPerKwh: rawRate });
  if (!selection.available) throw new ApiError('INVALID_INPUT');
  return selection;
};

const validateQuickInput = (body) => {
  const regionId = typeof body?.regionId === 'string' ? body.regionId.trim() : '';
  const region = getArmeniaRegionalBenchmark(regionId);
  if (!region) throw new ApiError('INVALID_INPUT');

  const effectiveRate = userEffectiveRate(body);
  const consumption = normalizeConsumption(body?.consumption, {
    tariff: effectiveRate,
    tariffDataset: ARMENIA_TARIFF_DATASET
  });
  if (!consumption.available) throw new ApiError('INVALID_INPUT');

  // A registry descriptor sent by a browser is never trusted or required.
  // The server derives the standard residential reference rate itself.
  const tariffSelection =
    effectiveRate ??
    (Array.isArray(consumption.monthlyKwh)
      ? createAutomaticStandardResidentialTariffProfile(
          consumption.monthlyKwh,
          ARMENIA_TARIFF_DATASET
        )
      : createAutomaticStandardResidentialTariff(
          consumption.averageMonthlyKwh,
          ARMENIA_TARIFF_DATASET
        ));
  if (!tariffSelection.available) throw new ApiError('INVALID_INPUT');

  return { region, tariffSelection, consumption };
};

/**
 * A regional starting point for the homeowner flow.  PVGIS is queried only
 * through the same server-side protected adapter as property-level analysis.
 * The configured coordinate is reported as a regional reference, never as a
 * geocoded or confirmed property.
 */
export const quickAnalyze = async ({ request, env, fetchImpl }) => {
  const body = await readJsonBody(request);
  const { region, tariffSelection, consumption } = validateQuickInput(body);
  const adapter = createPvgisAdapter(env, { fetchImpl });
  const providerPotential = await adapter.potential(
    {
      property: {
        latitude: region.coordinates.latitude,
        longitude: region.coordinates.longitude,
        confirmed: true
      },
      system: P0_PVGIS_QUERY
    },
    { signal: request.signal }
  );
  const retrievedAt = providerPotential.providerRetrievedAt ?? new Date().toISOString();
  const priceBook = priceBookRepository.getActive({
    region: 'AM',
    systemType: 'residential-grid-tied',
    at: new Date()
  });

  return {
    analysis: buildRegionalQuickAnalysis({
      region,
      consumption,
      tariffSelection,
      production: {
        annualYieldKwhPerKwp: providerPotential.optimum.generation.annualKwh,
        monthlyYieldFactors: providerPotential.optimum.generation.monthlyKwh,
        source: {
          kind: 'provider',
          status: 'confirmed',
          provider: 'PVGIS',
          reference: null,
          verifiedAt: retrievedAt
        }
      },
      priceBook,
      gridEmissionFactor: ARMENIA_GRID_CO2_FACTOR,
      treeEquivalency: EPA_URBAN_TREE_CO2_EQUIVALENCY,
      calculationConfig: {
        systemLossPercent: P0_PVGIS_QUERY.lossPercent,
        mountingPlace: 'free'
      },
      effectiveDate: new Date()
    })
  };
};

export const onRequest = (context) => handlePost(context, quickAnalyze);

export const __private__ = Object.freeze({ validateQuickInput });
