import {
  ARMENIA_GRID_CO2_FACTOR,
  ARMENIA_TARIFF_DATASET,
  EPA_URBAN_TREE_CO2_EQUIVALENCY,
  PriceBookRepository,
  buildRegionalQuickAnalysis,
  createRegistryTariffSelection,
  createUserTariffSelection,
  getArmeniaRegionalBenchmark,
  normalizeConsumption
} from '../../src/domain/index.js';
import { ApiError, handlePost, readJsonBody } from '../_lib/http.js';
import { createPvgisAdapter } from '../_lib/pvgis.js';

const priceBookRepository = new PriceBookRepository();
const P0_PVGIS_QUERY = Object.freeze({ capacityKwp: 1, lossPercent: 14 });

const inputTariff = (body) => {
  const tariff = body?.tariff;
  if (tariff?.tariffId || tariff?.period) {
    // The browser sends only an official tariff ID and time period. The rate,
    // category and revision are resolved again from the server-side registry.
    return createRegistryTariffSelection(
      { tariffId: tariff.tariffId, period: tariff.period },
      ARMENIA_TARIFF_DATASET
    );
  }
  return tariff?.rateAmdPerKwh === undefined ||
    tariff?.rateAmdPerKwh === null ||
    tariff?.rateAmdPerKwh === ''
    ? createUserTariffSelection({})
    : createUserTariffSelection({ rateAmdPerKwh: tariff.rateAmdPerKwh });
};

const validateQuickInput = (body) => {
  const regionId = typeof body?.regionId === 'string' ? body.regionId.trim() : '';
  const region = getArmeniaRegionalBenchmark(regionId);
  if (!region) throw new ApiError('INVALID_INPUT');

  const tariffSelection = inputTariff(body);
  const consumption = normalizeConsumption(body?.consumption, { tariff: tariffSelection });
  if (!consumption.available) throw new ApiError('INVALID_INPUT');

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
      effectiveDate: new Date()
    })
  };
};

export const onRequest = (context) => handlePost(context, quickAnalyze);

export const __private__ = Object.freeze({ validateQuickInput });
