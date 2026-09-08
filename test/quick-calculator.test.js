import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
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
import {
  buildQuickLeadContext,
  shouldClearRefinementForRegion,
  validateQuickLeadForm
} from '../src/ui/quick-calculator.js';

const endpoint = 'https://site.example/api/quick-analysis';
const root = resolve(import.meta.dirname, '..');
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

test('quick endpoint reports missing cache and unsafe provider configuration without a fallback result', async () => {
  const cacheMissing = await quickOnRequest({
    request: post({ regionId: 'yerevan', consumption: { averageMonthlyKwh: 850 } }),
    env: {}
  });
  const cacheMissingBody = await cacheMissing.json();
  assert.equal(cacheMissing.status, 503);
  assert.equal(cacheMissingBody.error.code, 'PVGIS_CACHE_NOT_CONFIGURED');
  assert.equal(cacheMissingBody.data, undefined);

  const providerInvalid = await quickOnRequest({
    request: post({ regionId: 'yerevan', consumption: { averageMonthlyKwh: 850 } }),
    env: {
      PVGIS_CACHE: memoryKv(),
      PVGIS_CACHE_SALT: 'provider-config-test',
      PVGIS_ENDPOINT: 'http://unsafe.example/pvgis'
    }
  });
  const providerInvalidBody = await providerInvalid.json();
  assert.equal(providerInvalid.status, 503);
  assert.equal(providerInvalidBody.error.code, 'PVGIS_NOT_CONFIGURED');
  assert.equal(providerInvalidBody.data, undefined);
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

test('Quick lead validation and context include only the permitted result summary', () => {
  assert.equal(validateQuickLeadForm({ name: 'A', phone: '+374 91 095950' }).valid, false);
  assert.equal(validateQuickLeadForm({ name: 'Arman', phone: 'not-a-phone' }).field, 'phone');
  assert.deepEqual(
    validateQuickLeadForm({
      name: ' Arman  Petrosyan ',
      phone: '+374 91 095950',
      message: ' Please call '
    }),
    {
      valid: true,
      field: null,
      values: { name: 'Arman Petrosyan', phone: '+374 91 095950', message: 'Please call' }
    }
  );

  const context = buildQuickLeadContext({
    locale: 'ru-RU',
    state: {
      regionId: 'yerevan',
      consumption: { mode: 'usage', averageMonthlyKwh: 850 },
      property: { address: 'Must not leave the browser', coordinates: { lat: 40.18, lng: 44.51 } },
      roof: { points: [{ lat: 40.18, lng: 44.51 }] },
      userTariff: { rateAmdPerKwh: 45 }
    },
    analysis: {
      scope: 'regional-preliminary',
      regionalBenchmark: { id: 'yerevan' },
      consumption: { annualKwh: 10_200 },
      production: { source: { provider: 'PVGIS' } },
      commercialEstimate: {
        available: true,
        rangeAmd: { p25: 2_000_000, p50: 2_100_000, p75: 2_200_000 }
      },
      selectedScenario: {
        id: 'balanced',
        system: { capacityKwp: 6.96 },
        generation: { annualKwh: 10_440 }
      }
    }
  });

  assert.deepEqual(context, {
    locale: 'ru-RU',
    region: 'yerevan',
    consumption: {
      mode: 'usage',
      averageMonthlyBillAmd: null,
      averageMonthlyKwh: 850,
      annualKwh: 10_200
    },
    selectedScenario: 'balanced',
    capacityKwp: 6.96,
    annualGenerationKwh: 10_440,
    budgetRangeAmd: { p25: 2_000_000, p50: 2_100_000, p75: 2_200_000 },
    source: 'PVGIS',
    scope: 'regional-preliminary'
  });
  assert.equal('property' in context, false);
  assert.equal('roof' in context, false);
  assert.equal('userTariff' in context, false);
});

test('Quick lead form has accessible loading, success, error and double-submit safeguards', async () => {
  const [template, controller] = await Promise.all([
    readFile(resolve(root, 'src/templates/calculator-quick.hbs'), 'utf8'),
    readFile(resolve(root, 'src/ui/quick-calculator.js'), 'utf8')
  ]);
  for (const marker of [
    'data-quick-lead-open',
    'data-quick-lead-dialog',
    'data-quick-lead-form',
    'data-quick-lead-status',
    'data-quick-lead-success',
    "aria-live='polite'"
  ]) {
    assert.ok(template.includes(marker), `missing lead form marker: ${marker}`);
  }
  assert.match(controller, /if \(leadRequest \|\| leadComplete\) return;/u);
  assert.match(controller, /leadForm\.setAttribute\('aria-busy', 'true'\)/u);
  assert.match(controller, /leadSuccess\.hidden = false/u);
  assert.match(controller, /setLeadStatus\(copy\.lead\?\.unavailable, true\)/u);
});

test('consumer budget presentation uses only a preliminary range while the price book keeps percentiles', () => {
  const range = formatConsumerCommercialRange(
    { available: true, rangeAmd: { p25: 3_900_000, p50: 4_100_000, p75: 4_400_000 } },
    'en-US'
  );
  assert.equal(range, '3,900,000 ֏ – 4,400,000 ֏');
  assert.doesNotMatch(range, /P(?:25|50|75)/u);
  assert.equal(
    formatConsumerCommercialRange(
      {
        available: false,
        reason: 'PRICEBOOK_EXPIRED',
        rangeAmd: { p25: 3_900_000, p50: 4_100_000, p75: 4_400_000 }
      },
      'en-US'
    ),
    null
  );
});
