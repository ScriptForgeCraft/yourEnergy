import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequest as analysisOnRequest } from '../functions/api/analysis.js';
import { onRequest as geocodeOnRequest } from '../functions/api/geocode.js';
import { onRequest as leadOnRequest } from '../functions/api/lead.js';
import { onRequest as potentialOnRequest } from '../functions/api/potential.js';
import { providerTimeoutMs } from '../functions/_lib/config.js';
import { buildP0SolarAnalysis } from '../functions/_lib/solar-analysis.js';
import { getDefaultCalculatorSystem } from '../src/data/equipment/calculator/defaults.js';
import { getSolarPanels } from '../src/data/equipment/calculator/catalog.js';
import {
  createGeocodingAdapter,
  normalizeGeocodingCandidate,
  validateGeocodeInput
} from '../functions/_lib/geocoding.js';
import {
  buildPvgisUrl,
  normalizePvgisOptimalResult,
  normalizePvgisResult,
  validatePotentialInput,
  validateAnalysisInput,
  withElevatedArrayGeometry
} from '../functions/_lib/pvgis.js';

const endpoint = 'https://site.example/api';

const postJson = (path, body, contentType = 'application/json') =>
  new Request(`${endpoint}${path}`, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });

const readJson = async (response) => response.json();

const createMemoryKv = () => {
  const records = new Map();
  const writes = [];
  return {
    records,
    writes,
    async get(key) {
      return records.get(key) ?? null;
    },
    async put(key, value, options) {
      writes.push({ key, value, options });
      records.set(key, value);
    }
  };
};

const pvgisEnv = (overrides = {}) => ({
  PVGIS_CACHE: createMemoryKv(),
  PVGIS_CACHE_SALT: 'test-cache-salt',
  ...overrides
});

const analysisPayload = Object.freeze({
  property: { latitude: 40.18, longitude: 44.51 },
  system: { capacityKwp: 6.96, lossPercent: 14 },
  roof: { tiltDegrees: 30, azimuthDegrees: 180 }
});

const p0AnalysisPayload = Object.freeze({
  property: {
    address: 'Manual test property',
    latitude: 40.18,
    longitude: 44.51,
    confirmed: true,
    source: 'manual'
  },
  consumption: { averageMonthlyKwh: 1000 },
  roof: {
    areaMethod: 'map-projected',
    mountingMode: 'roof-parallel',
    projectedAreaSqm: 70,
    polygonComplete: true,
    tiltDegrees: 30,
    azimuthDegrees: 180
  },
  system: { capacityKwp: 1, lossPercent: 14 }
});

test('provider timeout allows a realistic PVGIS response even when staging config is too low', () => {
  assert.equal(providerTimeoutMs({}), 12_000);
  assert.equal(providerTimeoutMs({ API_FETCH_TIMEOUT_MS: '1000' }), 5_000);
  assert.equal(providerTimeoutMs({ API_FETCH_TIMEOUT_MS: '7000' }), 7_000);
  assert.equal(providerTimeoutMs({ API_FETCH_TIMEOUT_MS: '25000' }), 20_000);
});

test('geocoding validates input and normalizes provider candidates without exposing fake locations', async () => {
  assert.deepEqual(validateGeocodeInput({ query: '  Zovuni 26 33  ', locale: 'ru-RU' }), {
    query: 'Zovuni 26 33',
    locale: 'ru'
  });
  assert.throws(
    () => validateGeocodeInput({ query: 'no', locale: 'ru' }),
    (error) => error.code === 'INVALID_INPUT'
  );
  assert.equal(
    normalizeGeocodingCandidate({
      place_name: 'Invalid coordinates',
      center: [999, 40]
    }),
    null
  );

  const requests = [];
  const adapter = createGeocodingAdapter(
    {
      GEOCODING_ENDPOINT: 'https://geocoder.example/search',
      GEOCODING_PROVIDER: 'test-geocoder'
    },
    {
      fetchImpl: async (url, init) => {
        requests.push({ url: new URL(url), init });
        return new Response(
          JSON.stringify({
            features: [
              {
                place_name: 'Zovuni, Kotayk, Armenia',
                center: [44.508, 40.235],
                relevance: 0.92
              },
              {
                place_name: 'Duplicate coordinate',
                center: [44.508, 40.235],
                relevance: 0.3
              },
              { place_name: 'Not a usable provider result', center: [400, 200] }
            ]
          }),
          { headers: { 'content-type': 'application/json' } }
        );
      }
    }
  );
  const location = await adapter.search({ query: 'Zovuni 26 33', locale: 'ru' });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url.searchParams.get('q'), 'Zovuni 26 33');
  assert.equal(requests[0].url.searchParams.get('language'), 'ru');
  assert.equal(requests[0].url.searchParams.get('limit'), '5');
  assert.equal(location.selectionRequired, true);
  assert.equal(location.source.provider, 'test-geocoder');
  assert.deepEqual(location.candidates, [
    {
      label: 'Zovuni, Kotayk, Armenia',
      coordinates: { latitude: 40.235, longitude: 44.508 },
      confidence: 0.92
    }
  ]);
});

test('Nominatim address searches are explicit, Armenia-only and identify the application', async () => {
  const requests = [];
  const adapter = createGeocodingAdapter(
    {
      GEOCODING_ENDPOINT: 'https://nominatim.openstreetmap.org/search',
      GEOCODING_PROVIDER: 'nominatim',
      GEOCODING_USER_AGENT: 'YOURENERGY calculator/1.0 (+https://yourenergy.am/contacts/)'
    },
    {
      fetchImpl: async (url, init) => {
        requests.push({ url: new URL(url), init });
        return new Response(
          JSON.stringify([
            {
              display_name: 'Комитаса проспект, Арабкир, Ереван, Армения',
              lat: '40.20549',
              lon: '44.50699'
            }
          ]),
          { headers: { 'content-type': 'application/json' } }
        );
      }
    }
  );

  const location = await adapter.search({ query: 'Ереван, Комитаса 10', locale: 'ru' });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url.pathname, '/search');
  assert.equal(requests[0].url.searchParams.get('q'), 'Ереван, Комитаса 10');
  assert.equal(requests[0].url.searchParams.get('format'), 'jsonv2');
  assert.equal(requests[0].url.searchParams.get('countrycodes'), 'am');
  assert.equal(requests[0].url.searchParams.get('accept-language'), 'ru');
  assert.equal(requests[0].url.searchParams.get('limit'), '5');
  assert.equal(
    requests[0].init.headers.get('user-agent'),
    'YOURENERGY calculator/1.0 (+https://yourenergy.am/contacts/)'
  );
  assert.deepEqual(location.candidates, [
    {
      label: 'Комитаса проспект, Арабкир, Ереван, Армения',
      coordinates: { latitude: 40.20549, longitude: 44.50699 },
      confidence: null
    }
  ]);
});

test('the public Nominatim endpoint is never called without an identifying user agent', async () => {
  const adapter = createGeocodingAdapter(
    {
      GEOCODING_ENDPOINT: 'https://nominatim.openstreetmap.org/search',
      GEOCODING_PROVIDER: 'nominatim'
    },
    { fetchImpl: async () => assert.fail('provider must not be called') }
  );

  await assert.rejects(
    () => adapter.search({ query: 'Ереван, Комитаса 10', locale: 'ru' }),
    (error) => error.code === 'GEOCODER_NOT_CONFIGURED'
  );
});

test('PVGIS accepts only explicit roof/system inputs and normalizes a valid twelve-month result', () => {
  const input = validateAnalysisInput(analysisPayload);
  const url = buildPvgisUrl('https://pvgis.example/api', input);
  const normalized = normalizePvgisResult({
    outputs: {
      totals: { fixed: { E_y: 10_440 } },
      monthly: { fixed: Array.from({ length: 12 }, () => ({ E_m: 870 })) }
    }
  });

  assert.equal(input.roof.pvgisAspectDegrees, 0);
  assert.equal(url.searchParams.get('lat'), '40.18');
  assert.equal(url.searchParams.get('lon'), '44.51');
  assert.equal(url.searchParams.get('peakpower'), '6.96');
  assert.equal(url.searchParams.get('mountingplace'), 'building');
  assert.equal(url.searchParams.get('aspect'), '0');
  assert.equal(normalized.annualKwh, 10_440);
  assert.deepEqual(normalized.monthlyKwh, Array(12).fill(870));
  assert.throws(
    () =>
      validateAnalysisInput({ ...analysisPayload, roof: { tiltDegrees: 30, azimuthDegrees: 360 } }),
    (error) => error.code === 'INVALID_INPUT'
  );
  assert.throws(
    () => normalizePvgisResult({ outputs: { totals: { fixed: { E_y: 1 } } } }),
    (error) => error.code === 'PVGIS_RESPONSE_INVALID'
  );
});

test('PVGIS uses roof geometry for roof-parallel and explicit array geometry for elevated mounting', () => {
  const roofParallel = validateAnalysisInput({
    ...analysisPayload,
    roof: { ...analysisPayload.roof, mountingMode: 'roof-parallel', azimuthDegrees: 90 }
  });
  const elevated = validateAnalysisInput({
    ...analysisPayload,
    roof: { ...analysisPayload.roof, mountingMode: 'elevated', azimuthDegrees: 90 }
  });
  const buildingUrl = buildPvgisUrl('https://pvgis.example/api', roofParallel);
  const freeUrl = buildPvgisUrl(
    'https://pvgis.example/api',
    withElevatedArrayGeometry(elevated, { arrayTiltDegrees: 20, arrayAzimuthDegrees: 90 })
  );

  assert.equal(roofParallel.roof.pvgisAspectDegrees, -90);
  assert.equal(elevated.roof.pvgisAspectDegrees, null);
  assert.equal(buildingUrl.searchParams.get('mountingplace'), 'building');
  assert.equal(freeUrl.searchParams.get('mountingplace'), 'free');
  assert.equal(buildingUrl.searchParams.get('angle'), '30');
  assert.equal(freeUrl.searchParams.get('angle'), '20');
  assert.equal(buildingUrl.searchParams.get('aspect'), '-90');
  assert.equal(freeUrl.searchParams.get('aspect'), '-90');
});

test('site potential requests PVGIS optimum angles only for a confirmed point', async () => {
  const input = validatePotentialInput({
    property: { latitude: 40.18, longitude: 44.51, confirmed: true }
  });
  const url = buildPvgisUrl('https://pvgis.example/api', input, { optimalAngles: true });
  const normalized = normalizePvgisOptimalResult({
    inputs: { mounting_system: { fixed: { slope: { value: 33 }, azimuth: { value: 0 } } } },
    outputs: {
      totals: { fixed: { E_y: 1600 } },
      monthly: { fixed: Array.from({ length: 12 }, () => ({ E_m: 133.333 })) }
    }
  });

  assert.equal(url.searchParams.get('optimalangles'), '1');
  assert.equal(url.searchParams.get('mountingplace'), 'free');
  assert.equal(url.searchParams.has('angle'), false);
  assert.equal(url.searchParams.has('aspect'), false);
  assert.equal(normalized.tiltDegrees, 33);
  assert.equal(normalized.azimuthDegrees, 180);
  assert.equal(normalized.generation.annualKwh, 1600);
  assert.throws(
    () => validatePotentialInput({ property: { latitude: 40.18, longitude: 44.51 } }),
    (error) => error.code === 'INVALID_INPUT'
  );

  let requestedUrl = null;
  const response = await potentialOnRequest({
    request: postJson('/potential', {
      property: { latitude: 40.18, longitude: 44.51, confirmed: true }
    }),
    env: pvgisEnv({ PVGIS_ENDPOINT: 'https://pvgis.example/api' }),
    fetch: async (requestUrl) => {
      requestedUrl = new URL(requestUrl);
      return new Response(
        JSON.stringify({
          inputs: { mounting_system: { fixed: { slope: { value: 31 }, azimuth: { value: -10 } } } },
          outputs: {
            totals: { fixed: { E_y: 1555 } },
            monthly: { fixed: Array.from({ length: 12 }, () => ({ E_m: 129.583 })) }
          }
        }),
        { headers: { 'content-type': 'application/json' } }
      );
    }
  });
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(requestedUrl.searchParams.get('optimalangles'), '1');
  assert.equal(body.data.potential.mode, 'site-potential');
  assert.equal(body.data.potential.annualYieldKwhPerKwp, 1555);
  assert.equal(body.data.potential.orientation.tiltDegrees, 31);
  assert.equal(body.data.potential.orientation.azimuthDegrees, 170);
  assert.equal(body.data.potential.monthlyYieldKwhPerKwp.length, 12);
  assert.ok(
    body.data.potential.limitations.includes('PVGIS_FREE_STANDING_OPTIMUM_NOT_ROOF_SURVEY')
  );
});

test('site potential reports a provider failure instead of returning example values', async () => {
  const response = await potentialOnRequest({
    request: postJson('/potential', {
      property: { latitude: 40.18, longitude: 44.51, confirmed: true }
    }),
    env: pvgisEnv({ PVGIS_ENDPOINT: 'https://pvgis.example/api' }),
    fetch: async () => {
      throw new TypeError('offline');
    }
  });
  const body = await readJson(response);

  assert.equal(response.status, 503);
  assert.equal(body.ok, false);
  assert.equal(body.error.code, 'PVGIS_UNAVAILABLE');
  assert.equal(body.data, undefined);
});

test('analysis uses the documented server-side PVGIS default when no override is configured', async () => {
  let requestedUrl = null;
  const response = await analysisOnRequest({
    request: postJson('/analysis', p0AnalysisPayload),
    env: pvgisEnv(),
    fetch: async (url) => {
      requestedUrl = String(url);
      return new Response(
        JSON.stringify({
          outputs: {
            totals: { fixed: { E_y: 1500 } },
            monthly: { fixed: Array.from({ length: 12 }, () => ({ E_m: 125 })) }
          }
        }),
        { headers: { 'content-type': 'application/json' } }
      );
    }
  });
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.ok(requestedUrl.startsWith('https://re.jrc.ec.europa.eu/api/v5_3/PVcalc'));
  assert.equal(body.data.analysis.mode, 'real-analysis');
});

test('analysis joins real PVGIS yield with automatic residential finance and verified historical CO₂ metadata', async () => {
  const response = await analysisOnRequest({
    request: postJson('/analysis', p0AnalysisPayload),
    env: pvgisEnv({ PVGIS_ENDPOINT: 'https://pvgis.example/api' }),
    fetch: async () =>
      new Response(
        JSON.stringify({
          outputs: {
            totals: { fixed: { E_y: 1500 } },
            monthly: { fixed: Array.from({ length: 12 }, () => ({ E_m: 125 })) }
          }
        }),
        { headers: { 'content-type': 'application/json' } }
      )
  });
  const body = await readJson(response);
  const analysis = body.data.analysis;

  assert.equal(response.status, 200);
  assert.equal(analysis.mode, 'real-analysis');
  assert.equal(analysis.property.confirmed, true);
  assert.equal(analysis.selectedScenario.system.capacityKwp, 8.45);
  assert.equal(analysis.selectedScenario.system.panelCount, 13);
  assert.equal(
    analysis.selectedScenario.generation.annualKwh,
    analysis.selectedScenario.system.capacityKwp * 1_500
  );
  assert.equal(analysis.selectedScenario.financial.annualSavingsAmd, null);
  assert.ok(analysis.selectedScenario.financial.annualSavingsRangeAmd.min > 0);
  assert.ok(
    analysis.selectedScenario.financial.annualSavingsRangeAmd.max >
      analysis.selectedScenario.financial.annualSavingsRangeAmd.min
  );
  assert.ok(analysis.selectedScenario.financial.grossSavings25YearsRangeAmd.min > 0);
  assert.ok(analysis.selectedScenario.financial.paybackRangeYears.min > 0);
  assert.equal(analysis.selectedScenario.financial.timeline.length, 0);
  assert.equal(analysis.environmental.factor.status, 'verified-historical');
  assert.equal(analysis.environmental.factor.dataYear, 2022);
  assert.equal(analysis.environmental.avoidedCo2Tons, 2.32);
  assert.equal(analysis.environmental.treeEquivalency.metricTonsCo2PerTreePerYear, 0.06);
  assert.equal(analysis.environmental.treeEquivalent, 38.667);
  assert.equal(analysis.financial.tariff.kind, 'automatic-standard-residential');
  assert.equal(analysis.financial.tariff.tariffId, 'standard-over-400');
  assert.equal(analysis.financial.tariff.rateAmdPerKwh, null);
  assert.equal(analysis.financial.tariff.minRateAmdPerKwh, 43.48);
  assert.equal(analysis.financial.tariff.maxRateAmdPerKwh, 53.48);
  assert.equal(analysis.commercialEstimate.available, true);
  assert.equal(analysis.commercialEstimate.kind, 'owner-managed');
  assert.equal(
    analysis.sourceLedger.find((entry) => entry.key === 'production').source.provider,
    'PVGIS'
  );
  assert.ok(analysis.assumptions.includes('PVGIS_SYSTEM_LOSS_14_PERCENT'));
  assert.ok(analysis.assumptions.includes('PRELIMINARY_ROOF_USABLE_AREA_70_PERCENT'));
});

test('analysis accepts a manual point and user tariff but ignores client-side capex and price books', async () => {
  const response = await analysisOnRequest({
    request: postJson('/analysis', {
      ...p0AnalysisPayload,
      property: {
        latitude: 40.18,
        longitude: 44.51,
        confirmed: true,
        source: 'manual'
      },
      tariff: { rateAmdPerKwh: 45 },
      investment: { capexAmd: 1, capexAmdPerKwp: 1 },
      priceBook: { ratesAmdPerWp: { p50: 1 } }
    }),
    env: pvgisEnv({ PVGIS_ENDPOINT: 'https://pvgis.example/api' }),
    fetch: async () =>
      new Response(
        JSON.stringify({
          outputs: {
            totals: { fixed: { E_y: 1500 } },
            monthly: { fixed: Array.from({ length: 12 }, () => ({ E_m: 125 })) }
          }
        }),
        { headers: { 'content-type': 'application/json' } }
      )
  });
  const body = await readJson(response);
  const analysis = body.data.analysis;

  assert.equal(response.status, 200);
  assert.equal(analysis.property.address, null);
  assert.equal(analysis.financial.tariff.kind, 'user');
  assert.equal(analysis.selectedScenario.financial.annualSavingsAmd, 540_000);
  assert.notEqual(analysis.selectedScenario.financial.capexAmd, 1);
  assert.ok(analysis.assumptions.includes('USER_PROVIDED_TARIFF'));
});

test('Professional analysis accepts actual day/night kWh but resolves both rates on the server', async () => {
  const response = await analysisOnRequest({
    request: postJson('/analysis', {
      ...p0AnalysisPayload,
      tariff: {
        actualDayKwh: 700,
        actualNightKwh: 300,
        officialDayRate: 1,
        officialNightRate: 1
      }
    }),
    env: pvgisEnv({ PVGIS_ENDPOINT: 'https://pvgis.example/api' }),
    fetch: async () =>
      new Response(
        JSON.stringify({
          outputs: {
            totals: { fixed: { E_y: 1500 } },
            monthly: { fixed: Array.from({ length: 12 }, () => ({ E_m: 125 })) }
          }
        }),
        { headers: { 'content-type': 'application/json' } }
      )
  });
  const analysis = (await readJson(response)).data.analysis;
  const expectedRate = (700 * 53.48 + 300 * 43.48) / 1000;

  assert.equal(response.status, 200);
  assert.equal(analysis.financial.tariff.accuracy, 'actual-day-night');
  assert.equal(analysis.financial.tariff.dayRateAmdPerKwh, 53.48);
  assert.equal(analysis.financial.tariff.nightRateAmdPerKwh, 43.48);
  assert.equal(analysis.financial.tariff.effectiveRateAmdPerKwh, expectedRate);
  assert.equal(analysis.selectedScenario.system.capacityKwp, 8.45);
  assert.ok(analysis.selectedScenario.financial.annualSavingsAmd > 0);
  assert.equal(analysis.selectedScenario.financial.annualSavingsRangeAmd, null);
});

test('Professional monthly mode resolves an official tariff band for every month', async () => {
  const monthlyKwh = [180, 220, 450, 180, 220, 450, 180, 220, 450, 180, 220, 450];
  const response = await analysisOnRequest({
    request: postJson('/analysis', {
      ...p0AnalysisPayload,
      consumption: { monthlyKwh }
    }),
    env: pvgisEnv({ PVGIS_ENDPOINT: 'https://pvgis.example/api' }),
    fetch: async () =>
      new Response(
        JSON.stringify({
          outputs: {
            totals: { fixed: { E_y: 1500 } },
            monthly: { fixed: Array.from({ length: 12 }, () => ({ E_m: 125 })) }
          }
        }),
        { headers: { 'content-type': 'application/json' } }
      )
  });
  const analysis = (await readJson(response)).data.analysis;

  assert.equal(response.status, 200);
  assert.equal(analysis.financial.tariff.accuracy, 'monthly-range');
  assert.deepEqual(
    analysis.financial.tariff.monthlyTariffs.slice(0, 3).map((month) => month.tariffId),
    ['standard-up-to-200', 'standard-201-to-400', 'standard-over-400']
  );
  assert.ok(analysis.selectedScenario.financial.retailOffsetValueRangeAmd.min > 0);
  assert.equal(analysis.selectedScenario.financial.retailOffsetValueAmd, null);
});

test('the server selects the dated P1 price book instead of accepting a client price or capex', () => {
  const analysis = buildP0SolarAnalysis({
    body: {
      ...p0AnalysisPayload,
      tariff: { rateAmdPerKwh: 45 },
      investment: { capexAmd: 1, capexAmdPerKwp: 1 },
      priceBook: { version: 'attacker-pricebook', ratesAmdPerWp: { p50: 1 } }
    },
    validatedInput: {
      property: { latitude: 40.18, longitude: 44.51 },
      roof: { tiltDegrees: 30, azimuthDegrees: 180 }
    },
    providerAnalysis: {
      generation: {
        annualKwh: 1500,
        monthlyKwh: Array.from({ length: 12 }, () => 125)
      },
      sourceLedger: [{ retrievedAt: '2026-08-31T00:00:00.000Z' }]
    },
    effectiveDate: '2026-08-31'
  });

  assert.equal(analysis.priceBook.version, 'v1.0');
  assert.equal(analysis.selectedScenario.financial.capexAmd, 1_640_000);
  assert.notEqual(analysis.selectedScenario.financial.capexAmd, 1);
  assert.equal(analysis.financial.price.kind, 'owner-managed');
});

test('the server resolves an explicit catalog panel ID without altering PVGIS-specific yield', () => {
  const selectedPanel = getSolarPanels()[1];
  const analysis = buildP0SolarAnalysis({
    body: {
      ...p0AnalysisPayload,
      equipment: { panelId: selectedPanel.id }
    },
    validatedInput: {
      property: { latitude: 40.18, longitude: 44.51 },
      roof: { tiltDegrees: 30, azimuthDegrees: 180 }
    },
    providerAnalysis: {
      generation: {
        annualKwh: 1_500,
        monthlyKwh: Array.from({ length: 12 }, () => 125)
      },
      sourceLedger: [{ retrievedAt: '2026-08-31T00:00:00.000Z' }]
    },
    effectiveDate: '2026-08-31'
  });
  const scenario = analysis.selectedScenario;

  assert.equal(analysis.equipment.panelId, selectedPanel.id);
  assert.equal(scenario.system.panelWatts, selectedPanel.calculation.panelWatts);
  assert.equal(scenario.system.panelAreaSqm, selectedPanel.calculation.panelAreaSqm);
  assert.equal(scenario.generation.annualKwh, scenario.system.capacityKwp * 1_500);
});

test('the server requires a future load profile before sizing requested storage', () => {
  const analysis = buildP0SolarAnalysis({
    body: {
      ...p0AnalysisPayload,
      storageRequired: true,
      // P0 intentionally does not accept these unvalidated future inputs.
      storage: { criticalLoadPowerKw: 2, backupDurationHours: 5 }
    },
    validatedInput: {
      property: { latitude: 40.18, longitude: 44.51 },
      roof: { tiltDegrees: 30, azimuthDegrees: 180 }
    },
    providerAnalysis: {
      generation: {
        annualKwh: 1_500,
        monthlyKwh: Array.from({ length: 12 }, () => 125)
      },
      sourceLedger: [{ retrievedAt: '2026-08-31T00:00:00.000Z' }]
    },
    effectiveDate: '2026-08-31'
  });

  assert.equal(analysis.storageRecommendation.status, 'profile-required');
  assert.equal(analysis.storageRecommendation.storageOptional, true);
  assert.equal(analysis.inverterRecommendation.technology, 'hybrid');
});

test('the server makes a small outlined roof a visible preliminary capacity constraint', () => {
  const analysis = buildP0SolarAnalysis({
    body: {
      ...p0AnalysisPayload,
      roof: { ...p0AnalysisPayload.roof, projectedAreaSqm: 4 }
    },
    validatedInput: {
      property: { latitude: 40.18, longitude: 44.51 },
      roof: { tiltDegrees: 30, azimuthDegrees: 180 }
    },
    providerAnalysis: {
      generation: {
        annualKwh: 1500,
        monthlyKwh: Array.from({ length: 12 }, () => 125)
      },
      sourceLedger: [{ retrievedAt: '2026-08-31T00:00:00.000Z' }]
    },
    effectiveDate: '2026-08-31'
  });

  assert.equal(analysis.selectedScenario.system.maximumPanelCount, 1);
  assert.equal(analysis.selectedScenario.system.panelCount, 1);
  assert.equal(analysis.selectedScenario.system.capacityKwp, 0.65);
  assert.deepEqual(analysis.equipment, getDefaultCalculatorSystem()?.equipment);
  assert.ok(analysis.selectedScenario.limitations.includes('ROOF_CAPACITY_LIMIT'));
  assert.ok(analysis.assumptions.includes('PRELIMINARY_PANEL_FROM_EQUIPMENT_CATALOG'));
});

test('analysis refuses an unconfirmed property or incomplete roof before contacting PVGIS', async () => {
  let providerCalls = 0;
  const response = await analysisOnRequest({
    request: postJson('/analysis', {
      ...p0AnalysisPayload,
      property: { ...p0AnalysisPayload.property, confirmed: false }
    }),
    env: pvgisEnv({ PVGIS_ENDPOINT: 'https://pvgis.example/api' }),
    fetch: async () => {
      providerCalls += 1;
      return new Response('{}', { headers: { 'content-type': 'application/json' } });
    }
  });
  const body = await readJson(response);

  assert.equal(response.status, 422);
  assert.equal(body.error.code, 'INVALID_INPUT');
  assert.equal(providerCalls, 0);
});

test('analysis accepts only the documented 1 kWp / 14% PVGIS normalization query', async () => {
  let providerCalls = 0;
  const response = await analysisOnRequest({
    request: postJson('/analysis', {
      ...p0AnalysisPayload,
      system: { capacityKwp: 2, lossPercent: 14 }
    }),
    env: pvgisEnv({ PVGIS_ENDPOINT: 'https://pvgis.example/api' }),
    fetch: async () => {
      providerCalls += 1;
      return new Response('{}', { headers: { 'content-type': 'application/json' } });
    }
  });
  const body = await readJson(response);

  assert.equal(response.status, 422);
  assert.equal(body.error.code, 'INVALID_INPUT');
  assert.equal(providerCalls, 0);
});

test('API endpoint wrapper has a single JSON envelope for methods and content types', async () => {
  const methodResponse = await geocodeOnRequest({
    request: new Request(`${endpoint}/geocode`, { method: 'GET' }),
    env: {}
  });
  const methodBody = await readJson(methodResponse);
  assert.equal(methodResponse.status, 405);
  assert.equal(methodResponse.headers.get('allow'), 'POST, OPTIONS');
  assert.equal(methodResponse.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.deepEqual(methodBody, {
    ok: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'This endpoint only accepts POST requests.',
      retryable: false
    }
  });

  const contentTypeResponse = await geocodeOnRequest({
    request: postJson('/geocode', 'query=Zovuni', 'text/plain'),
    env: {}
  });
  const contentTypeBody = await readJson(contentTypeResponse);
  assert.equal(contentTypeResponse.status, 415);
  assert.equal(contentTypeBody.ok, false);
  assert.equal(contentTypeBody.error.code, 'INVALID_CONTENT_TYPE');

  const optionsResponse = await geocodeOnRequest({
    request: new Request(`${endpoint}/geocode`, { method: 'OPTIONS' }),
    env: {}
  });
  assert.equal(optionsResponse.status, 204);
  assert.equal(optionsResponse.headers.get('allow'), 'POST, OPTIONS');
});

const leadDeliveryEnv = Object.freeze({
  TELEGRAM_BOT_TOKEN: 'test-bot-token',
  TELEGRAM_CHAT_ID: '-100000000001',
  CF_EMAIL_API_TOKEN: 'test-email-token',
  CF_ACCOUNT_ID: 'account-id-123',
  CONTACT_EMAIL: 'sales@yourenergy.test',
  EMAIL_FROM: 'website@yourenergy.am'
});

const telegramSuccess = () =>
  new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }), {
    headers: { 'content-type': 'application/json' }
  });

const emailSuccess = () =>
  new Response(
    JSON.stringify({
      success: true,
      errors: [],
      messages: [],
      result: { message_id: 'test-message-id' }
    }),
    { headers: { 'content-type': 'application/json' } }
  );

test('lead endpoint never reports delivery success without all delivery configuration', async () => {
  const response = await leadOnRequest({
    request: postJson('/lead', {
      name: 'Arman Petrosyan',
      phone: '+374 91 095950',
      email: 'arman@example.test',
      locale: 'hy'
    }),
    env: {}
  });
  const body = await readJson(response);

  assert.equal(response.status, 503);
  assert.deepEqual(body, {
    ok: false,
    error: {
      code: 'LEAD_DELIVERY_NOT_CONFIGURED',
      message: 'Lead delivery is not configured yet.',
      retryable: false
    }
  });
  assert.equal(body.data, undefined);
});

test('lead endpoint accepts the documented Cloudflare Email success response without Telegram configuration', async () => {
  const emailOnlyEnv = {
    CF_EMAIL_API_TOKEN: 'test-email-token',
    CF_ACCOUNT_ID: 'account-id-123',
    CONTACT_EMAIL: 'sales@yourenergy.test',
    EMAIL_FROM: 'website@yourenergy.am'
  };
  let providerCalls = 0;
  const response = await leadOnRequest({
    request: postJson('/lead', {
      name: 'Arman Petrosyan',
      phone: '+374 91 095950',
      email: 'arman@example.test',
      locale: 'en'
    }),
    env: emailOnlyEnv,
    fetch: async (url, init) => {
      providerCalls += 1;
      assert.match(String(url), /^https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\//);
      const payload = JSON.parse(init.body);
      assert.equal(payload.reply_to, 'arman@example.test');
      assert.equal('replyTo' in payload, false);
      return emailSuccess();
    }
  });
  const body = await readJson(response);

  assert.equal(providerCalls, 1);
  assert.equal(response.status, 200);
  assert.deepEqual(body.data, {
    accepted: true,
    delivery: { telegram: 'failed', email: 'succeeded' },
    turnstile: 'not-configured'
  });
});

test('an absent Telegram configuration does not mask an Email provider rejection', async () => {
  const response = await leadOnRequest({
    request: postJson('/lead', {
      name: 'Arman Petrosyan',
      phone: '+374 91 095950',
      locale: 'en'
    }),
    env: {
      CF_EMAIL_API_TOKEN: 'test-email-token',
      CF_ACCOUNT_ID: 'account-id-123',
      CONTACT_EMAIL: 'sales@yourenergy.test',
      EMAIL_FROM: 'website@yourenergy.am'
    },
    fetch: async () => new Response(JSON.stringify({ success: false }), { status: 400 })
  });
  const body = await readJson(response);

  assert.equal(response.status, 502);
  assert.equal(body.error.code, 'LEAD_DELIVERY_REJECTED');
});

test('lead endpoint sends the same normalized Quick Calculator lead to Telegram and email', async () => {
  const received = [];
  const response = await leadOnRequest({
    request: postJson('/lead', {
      name: 'Arman Petrosyan',
      phone: '+374 91 095950',
      email: 'arman@example.test',
      message: 'Please call after 18:00',
      locale: 'en-US',
      calculatorContext: {
        region: 'yerevan',
        consumption: { mode: 'usage', averageMonthlyKwh: 850, annualKwh: 10_200 },
        selectedScenario: 'balanced',
        capacityKwp: 6.96,
        annualGenerationKwh: 10_440,
        budgetRangeAmd: { p25: 2_000_000, p50: 2_100_000, p75: 2_200_000 },
        source: 'PVGIS',
        scope: 'regional-preliminary',
        coordinates: { lat: 40.18, lng: 44.51 },
        roof: { points: [{ lat: 40.18, lng: 44.51 }] },
        tariff: 45
      }
    }),
    env: leadDeliveryEnv,
    fetch: async (url, init) => {
      received.push({ url: String(url), init, payload: JSON.parse(init.body) });
      return String(url).startsWith('https://api.telegram.org/')
        ? telegramSuccess()
        : emailSuccess();
    }
  });
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(body.data, {
    accepted: true,
    delivery: { telegram: 'succeeded', email: 'succeeded' },
    turnstile: 'not-configured'
  });
  assert.equal(received.length, 2);

  const telegramRequests = received.filter(({ url }) =>
    url.startsWith('https://api.telegram.org/')
  );
  assert.equal(telegramRequests.length, 1);
  assert.equal(telegramRequests[0].payload.chat_id, leadDeliveryEnv.TELEGRAM_CHAT_ID);
  assert.match(telegramRequests[0].payload.text, /Անուն: Arman Petrosyan/);
  assert.match(telegramRequests[0].payload.text, /Հեռախոս: \+374 91 095950/);
  assert.match(telegramRequests[0].payload.text, /Էլ\. փոստ: arman@example\.test/);
  assert.match(telegramRequests[0].payload.text, /Նախընտրած լեզու: Անգլերեն/);

  const emailRequest = received.find(({ url }) => url.startsWith('https://api.cloudflare.com/'));
  assert.equal(
    emailRequest.url,
    'https://api.cloudflare.com/client/v4/accounts/account-id-123/email/sending/send'
  );
  assert.equal(emailRequest.init.headers.authorization, 'Bearer test-email-token');
  assert.equal(emailRequest.payload.to, 'sales@yourenergy.test');
  assert.equal(emailRequest.payload.from, 'website@yourenergy.am');
  assert.equal(emailRequest.payload.reply_to, 'arman@example.test');
  assert.equal('replyTo' in emailRequest.payload, false);
  assert.equal(emailRequest.payload.text, telegramRequests[0].payload.text);
  assert.match(emailRequest.payload.text, /Արագ հաշվիչի ամփոփում/);
  assert.match(emailRequest.payload.text, /Please call after 18:00/);
  assert.equal(emailRequest.payload.text.includes('coordinates'), false);
  assert.equal(emailRequest.payload.text.includes('"roof"'), false);
  assert.equal(emailRequest.payload.text.includes('"tariff"'), false);
  assert.match(emailRequest.payload.text, /Տարածաշրջան: Երևան/);
  assert.match(emailRequest.payload.text, /Սցենար: Հավասարակշռված/);
  assert.match(emailRequest.payload.text, /Հաշվարկի շրջանակ: Տարածաշրջանային նախնական հաշվարկ/);
  assert.match(emailRequest.payload.text, /Տարեկան արտադրանք: 10\D*440 kWh/);
  assert.doesNotMatch(emailRequest.payload.text, /Quick Calculator summary|Annual generation/);
  assert.doesNotMatch(emailRequest.payload.text, /"annualGenerationKwh"/);
});

test('lead endpoint sends a readable Professional Calculator report with submitted inputs and results', async () => {
  const received = [];
  const response = await leadOnRequest({
    request: postJson('/lead', {
      name: 'Arman Petrosyan',
      phone: '+374 91 095950',
      email: 'arman@example.test',
      message: 'Please prepare an offer with installation.',
      locale: 'ru-RU',
      calculatorContext: {
        kind: 'professional',
        property: { address: 'Arabkir, Yerevan', latitude: 40.20512, longitude: 44.51234 },
        consumption: {
          mode: 'monthly',
          monthlyKwh: [600, 580, 550, 520, 500, 480, 460, 470, 510, 560, 620, 650],
          annualKwh: 6500
        },
        tariffAmdPerKwh: 46.48,
        financialTariff: {
          sourceType: 'automatic-standard-residential',
          tariffId: 'standard-over-400',
          bracketMinMonthlyKwh: 400,
          dayRateAmdPerKwh: 53.48,
          nightRateAmdPerKwh: 43.48,
          minRateAmdPerKwh: 43.48,
          maxRateAmdPerKwh: 53.48,
          effectiveRateAmdPerKwh: null
        },
        roof: {
          areaMethod: 'map-projected',
          areaSqm: 42.4,
          projectedAreaSqm: 40.2,
          azimuthDegrees: 180,
          tiltDegrees: 30,
          mountingMode: 'roof-parallel',
          outlinePoints: [
            { lat: 40.2051, lng: 44.5123 },
            { lat: 40.2052, lng: 44.5124 },
            { lat: 40.205, lng: 44.5125 }
          ]
        },
        storageRequested: true,
        result: {
          solarYieldKwhPerKwp: 1495,
          capacityKwp: 7.15,
          panelCount: 11,
          panelWatts: 650,
          annualGenerationKwh: 10686,
          monthlyGenerationKwh: [295, 360, 428, 472, 516, 574, 605, 598, 553, 448, 366, 268],
          annualConsumptionKwh: 6500,
          coveredConsumptionKwh: 6500,
          surplusGenerationKwh: 4186,
          coveragePercent: 164.4,
          annualSavingsAmd: 302120,
          annualSavingsRangeAmd: { min: 260000, max: 320000 },
          paybackRangeYears: { min: 6.1, max: 7.4 },
          avoidedCo2Tons: 2.2,
          source: 'PVGIS'
        },
        equipment: {
          solarModule: 'LONGi Hi-MO X10 Guardian LR7-72HVDF · 650 W',
          inverter: 'SolaX X3-MIC G2 · 4 kW AC',
          storage: 'SolaX battery · 10 kWh',
          mounting: 'Roof mount · 30°'
        },
        billFileName: 'electricity-bill.pdf'
      }
    }),
    env: leadDeliveryEnv,
    fetch: async (url, init) => {
      received.push({ url: String(url), payload: JSON.parse(init.body) });
      return String(url).startsWith('https://api.telegram.org/')
        ? telegramSuccess()
        : emailSuccess();
    }
  });
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(body.data.accepted, true);
  const telegram = received.find(({ url }) => url.startsWith('https://api.telegram.org/'));
  const email = received.find(({ url }) => url.startsWith('https://api.cloudflare.com/'));
  assert.equal(email.payload.subject, 'Նոր հայտ՝ YourEnergy մասնագիտական հաշվիչից');
  assert.equal(email.payload.text, telegram.payload.text);
  assert.match(email.payload.text, /Մասնագիտական հաշվիչի հաշվետվություն/);
  assert.match(email.payload.text, /Օբյեկտ/);
  assert.match(email.payload.text, /Arabkir, Yerevan/);
  assert.match(email.payload.text, /Մուտքագրված սպառում/);
  assert.match(email.payload.text, /Ստանդարտ կենցաղային՝ ավտոմատ ընտրված/);
  assert.match(email.payload.text, /43,48–53,48 AMD\/kWh/);
  assert.match(email.payload.text, /Տանիքի ուրվագիծ: 3 կետ/);
  assert.match(email.payload.text, /Հաշվարկի արդյունք/);
  assert.match(email.payload.text, /260\D*000–320\D*000 AMD/);
  assert.match(email.payload.text, /6,1–7,4 տարի/);
  assert.match(email.payload.text, /11 × 650 W/);
  assert.match(email.payload.text, /Առաջարկվող սարքավորում/);
  assert.match(email.payload.text, /LONGi Hi-MO X10 Guardian/);
  assert.match(email.payload.text, /electricity-bill\.pdf \(կցված չէ\)/);
  assert.match(email.payload.text, /Հաճախորդի հաղորդագրություն/);
  assert.doesNotMatch(email.payload.text, /Professional Calculator report|Recommended equipment/);
  assert.doesNotMatch(email.payload.text, /"monthlyGenerationKwh"/);
});

test('lead delivery accepts Email-only success and waits for both attempts to settle', async () => {
  const received = [];
  const pending = [];
  let responseSettled = false;
  const responsePromise = leadOnRequest({
    request: postJson('/lead', {
      name: 'Arman Petrosyan',
      phone: '+374 91 095950',
      locale: 'hy'
    }),
    env: leadDeliveryEnv,
    fetch: (url, init) => {
      const request = { url: String(url), init, payload: JSON.parse(init.body) };
      received.push(request);
      if (request.payload.chat_id === leadDeliveryEnv.TELEGRAM_CHAT_ID) {
        return Promise.resolve(new Response(JSON.stringify({ ok: false }), { status: 400 }));
      }
      return new Promise((resolve) => pending.push({ request, resolve }));
    }
  });
  responsePromise.then(() => {
    responseSettled = true;
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(received.length, 2);
  assert.equal(responseSettled, false);
  assert.equal(pending.length, 1);

  for (const { resolve } of pending) resolve(emailSuccess());

  const response = await responsePromise;
  const body = await readJson(response);
  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    ok: true,
    data: {
      accepted: true,
      delivery: { telegram: 'failed', email: 'succeeded' },
      turnstile: 'not-configured'
    }
  });
});

test('lead delivery accepts Telegram-only success and returns its safe summary', async () => {
  const received = [];
  const response = await leadOnRequest({
    request: postJson('/lead', {
      name: 'Arman Petrosyan',
      phone: '+374 91 095950',
      locale: 'en'
    }),
    env: leadDeliveryEnv,
    fetch: async (url, init) => {
      const request = { url: String(url), payload: JSON.parse(init.body) };
      received.push(request);
      if (request.payload.chat_id === leadDeliveryEnv.TELEGRAM_CHAT_ID) {
        return telegramSuccess();
      }
      return new Response(JSON.stringify({ ok: false }), { status: 400 });
    }
  });
  const body = await readJson(response);

  assert.equal(received.length, 2);
  assert.equal(response.status, 200);
  assert.deepEqual(body.data, {
    accepted: true,
    delivery: { telegram: 'succeeded', email: 'failed' },
    turnstile: 'not-configured'
  });
});

test('lead delivery returns an error when no channel succeeds', async () => {
  const received = [];
  const response = await leadOnRequest({
    request: postJson('/lead', {
      name: 'Arman Petrosyan',
      phone: '+374 91 095950',
      locale: 'hy'
    }),
    env: leadDeliveryEnv,
    fetch: async (url, init) => {
      received.push({ url: String(url), payload: JSON.parse(init.body) });
      return new Response(JSON.stringify({ ok: false }), { status: 400 });
    }
  });
  const body = await readJson(response);

  assert.equal(received.length, 2);
  assert.equal(response.status, 502);
  assert.deepEqual(body, {
    ok: false,
    error: {
      code: 'LEAD_DELIVERY_REJECTED',
      message: 'Lead delivery was rejected by the configured service.',
      retryable: false
    }
  });
  assert.equal(body.data, undefined);
});
