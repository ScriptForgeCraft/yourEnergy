import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequest as quickOnRequest } from '../functions/api/quick-analysis.js';
import {
  ARMENIA_REGIONAL_BENCHMARKS,
  TEMPORARY_YOURENERGY_PRICEBOOK,
  buildRegionalQuickAnalysis,
  buildSolarAnalysis,
  createUserTariffSelection,
  getArmeniaRegionalBenchmark
} from '../src/domain/index.js';
import { createCalculatorSession } from '../src/ui/calculator-session.js';
import { formatConsumerCommercialRange } from '../src/ui/commercial-range.js';
import { shouldClearRefinementForRegion } from '../src/ui/quick-calculator.js';

const endpoint = 'https://site.example/api/quick-analysis';
const post = (body) =>
  new Request(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
const memoryKv = () => {
  const records = new Map();
  return {
    async get(key) {
      return records.get(key) ?? null;
    },
    async put(key, value) {
      records.set(key, value);
    }
  };
};
const pvgisEnv = {
  PVGIS_CACHE: memoryKv(),
  PVGIS_CACHE_SALT: 'quick-test-salt',
  PVGIS_ENDPOINT: 'https://pvgis.example/api'
};
const pvgisResponse = () =>
  new Response(
    JSON.stringify({
      inputs: { mounting_system: { fixed: { slope: { value: 31 }, azimuth: { value: 0 } } } },
      outputs: {
        totals: { fixed: { E_y: 1500 } },
        monthly: { fixed: Array.from({ length: 12 }, () => ({ E_m: 125 })) }
      }
    }),
    { headers: { 'content-type': 'application/json' } }
  );

test('regional configuration has exactly eleven labelled Armenia benchmarks and never represents a property', () => {
  assert.equal(ARMENIA_REGIONAL_BENCHMARKS.length, 11);
  const yerevan = getArmeniaRegionalBenchmark('yerevan');
  assert.deepEqual(yerevan.coordinates, { latitude: 40.1792, longitude: 44.4991 });
  assert.match(yerevan.rationale, /not a property location/iu);
});

test('regional quick analysis delegates unchanged sizing, budget and finance formulas to the shared engine', () => {
  const region = getArmeniaRegionalBenchmark('yerevan');
  const input = {
    consumption: { averageMonthlyKwh: 1000 },
    tariffSelection: createUserTariffSelection({ rateAmdPerKwh: 45 }),
    production: {
      annualYieldKwhPerKwp: 1500,
      monthlyYieldFactors: Array(12).fill(125),
      source: { kind: 'provider', status: 'confirmed' }
    },
    priceBook: TEMPORARY_YOURENERGY_PRICEBOOK,
    effectiveDate: '2026-08-31'
  };
  const quick = buildRegionalQuickAnalysis({ region, ...input });
  const direct = buildSolarAnalysis({
    ...input,
    property: {
      address: 'Regional benchmark: yerevan',
      coordinates: { lat: 40.1792, lng: 44.4991 },
      confirmed: false,
      source: region.source
    },
    roof: {},
    system: { panelWatts: 580, panelAreaSqm: 2 },
    scope: 'regional-preliminary',
    limitations: [
      'REGIONAL_REFERENCE_POINT_NOT_PROPERTY_LOCATION',
      'ROOF_AREA_ORIENTATION_TILT_AND_SHADING_NOT_INCLUDED',
      'FINAL_SYSTEM_REQUIRES_PROPERTY_REFINEMENT'
    ],
    assumptions: ['REGIONAL_PVGIS_BENCHMARK']
  });
  assert.equal(quick.scope, 'regional-preliminary');
  assert.equal(quick.property.confirmed, false);
  assert.deepEqual(quick.selectedScenario, direct.selectedScenario);
  assert.equal(quick.dataCompleteness.level, 'preliminary');
});

test('quick endpoint uses server-side PVGIS, requires tariff only for bill mode and returns no fallback on provider failure', async () => {
  let fetchCalls = 0;
  const missingTariff = await quickOnRequest({
    request: post({ regionId: 'yerevan', consumption: { averageMonthlyBillAmd: 30000 } }),
    env: pvgisEnv,
    fetch: async () => {
      fetchCalls += 1;
      return pvgisResponse();
    }
  });
  assert.equal(missingTariff.status, 422);
  assert.equal(fetchCalls, 0);

  const usage = await quickOnRequest({
    request: post({ regionId: 'yerevan', consumption: { averageMonthlyKwh: 1000 } }),
    env: pvgisEnv,
    fetch: async () => {
      fetchCalls += 1;
      return pvgisResponse();
    }
  });
  const body = await usage.json();
  assert.equal(usage.status, 200);
  assert.equal(body.data.analysis.scope, 'regional-preliminary');
  assert.equal(body.data.analysis.financial.tariff.rateAmdPerKwh, null);
  assert.equal(body.data.analysis.selectedScenario.financial.annualSavingsAmd, null);

  const unavailable = await quickOnRequest({
    request: post({ regionId: 'ararat', consumption: { averageMonthlyKwh: 1000 } }),
    env: {
      PVGIS_CACHE: memoryKv(),
      PVGIS_CACHE_SALT: 'failure-salt',
      PVGIS_ENDPOINT: 'https://pvgis.example/api'
    },
    fetch: async () => {
      throw new TypeError('offline');
    }
  });
  const unavailableBody = await unavailable.json();
  assert.equal(unavailable.status, 503);
  assert.equal(unavailableBody.error.code, 'PVGIS_UNAVAILABLE');
  assert.equal(unavailableBody.data, undefined);
});

test('one temporary session carries quick values to refinement and professional routes without a File object', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  const session = createCalculatorSession({ storage });
  session.write({
    regionId: 'kotayk',
    consumption: { mode: 'usage', averageMonthlyKwh: 850 },
    userTariff: { rateAmdPerKwh: 45 },
    property: { coordinates: { lat: 40.27, lng: 44.63 }, confirmed: true },
    roof: { points: [{ lat: 40.27, lng: 44.63 }], complete: false },
    selectedBillFile: { name: 'private.pdf' }
  });
  const restored = session.read();
  assert.equal(restored.regionId, 'kotayk');
  assert.equal(restored.consumption.averageMonthlyKwh, 850);
  assert.deepEqual(restored.property.coordinates, { lat: 40.27, lng: 44.63 });
  assert.equal('selectedBillFile' in restored, false);
});

test('a detailed roof result preserves its compatible quick result for a simple comparison', () => {
  const values = new Map();
  const session = createCalculatorSession({
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    }
  });
  session.write({
    quickAnalysis: { scope: 'regional-preliminary', selectedScenario: { id: 'quick' } }
  });
  session.write({ analysis: { scope: 'manual-roof-plane', selectedScenario: { id: 'refined' } } });
  const restored = session.read();
  assert.equal(restored.quickAnalysis.selectedScenario.id, 'quick');
  assert.equal(restored.analysis.selectedScenario.id, 'refined');
});

test('changing the regional starting point never carries an old roof into the new estimate', () => {
  assert.equal(shouldClearRefinementForRegion('yerevan', 'yerevan'), false);
  assert.equal(shouldClearRefinementForRegion('yerevan', 'syunik'), true);
  assert.equal(shouldClearRefinementForRegion(null, 'yerevan'), false);
});

test('consumer budget presentation uses only a preliminary range while the price book keeps percentiles', () => {
  const range = formatConsumerCommercialRange(
    { rangeAmd: { p25: 3_900_000, p50: 4_100_000, p75: 4_400_000 } },
    'en-US'
  );
  assert.equal(range, '3,900,000 ֏ – 4,400,000 ֏');
  assert.doesNotMatch(range, /P(?:25|50|75)/u);
});
