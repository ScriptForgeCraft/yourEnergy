import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequest as analysisOnRequest } from '../functions/api/analysis.js';
import { onRequest as geocodeOnRequest } from '../functions/api/geocode.js';
import { onRequest as leadOnRequest } from '../functions/api/lead.js';
import { onRequest as potentialOnRequest } from '../functions/api/potential.js';
import { buildP0SolarAnalysis } from '../functions/_lib/solar-analysis.js';
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
  validateAnalysisInput
} from '../functions/_lib/pvgis.js';

const endpoint = 'https://site.example/api';

const postJson = (path, body, contentType = 'application/json') =>
  new Request(`${endpoint}${path}`, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });

const readJson = async (response) => response.json();

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
  roof: { areaSqm: 70, polygonComplete: true, tiltDegrees: 30, azimuthDegrees: 180 },
  system: { capacityKwp: 1, lossPercent: 14 }
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
    env: { PVGIS_ENDPOINT: 'https://pvgis.example/api' },
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
    env: { PVGIS_ENDPOINT: 'https://pvgis.example/api' },
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
    env: {},
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

test('analysis joins real PVGIS yield with confirmed inputs and suppresses unverified finance', async () => {
  const response = await analysisOnRequest({
    request: postJson('/analysis', p0AnalysisPayload),
    env: { PVGIS_ENDPOINT: 'https://pvgis.example/api' },
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
  assert.equal(analysis.selectedScenario.system.capacityKwp, 7.54);
  assert.equal(analysis.selectedScenario.system.panelCount, 13);
  assert.equal(analysis.selectedScenario.generation.annualKwh, 11_310);
  assert.equal(analysis.selectedScenario.financial.annualSavingsAmd, null);
  assert.equal(analysis.selectedScenario.financial.paybackYears, null);
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
    env: { PVGIS_ENDPOINT: 'https://pvgis.example/api' },
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
  assert.equal(analysis.selectedScenario.financial.annualSavingsAmd, 508_950);
  assert.notEqual(analysis.selectedScenario.financial.capexAmd, 1);
  assert.ok(analysis.assumptions.includes('USER_PROVIDED_TARIFF'));
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

  assert.equal(analysis.priceBook.version, 'v0.1');
  assert.equal(analysis.selectedScenario.financial.capexAmd, 1_860_000);
  assert.notEqual(analysis.selectedScenario.financial.capexAmd, 1);
  assert.equal(analysis.financial.price.kind, 'temporary');
});

test('the server makes a small outlined roof a visible preliminary capacity constraint', () => {
  const analysis = buildP0SolarAnalysis({
    body: {
      ...p0AnalysisPayload,
      roof: { ...p0AnalysisPayload.roof, areaSqm: 4 }
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
  assert.equal(analysis.selectedScenario.system.capacityKwp, 0.58);
  assert.ok(analysis.selectedScenario.limitations.includes('ROOF_CAPACITY_LIMIT'));
  assert.ok(analysis.assumptions.includes('PRELIMINARY_PANEL_SIZE_580W_2M2'));
});

test('analysis refuses an unconfirmed property or incomplete roof before contacting PVGIS', async () => {
  let providerCalls = 0;
  const response = await analysisOnRequest({
    request: postJson('/analysis', {
      ...p0AnalysisPayload,
      property: { ...p0AnalysisPayload.property, confirmed: false }
    }),
    env: { PVGIS_ENDPOINT: 'https://pvgis.example/api' },
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
    env: { PVGIS_ENDPOINT: 'https://pvgis.example/api' },
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

test('lead endpoint never reports delivery success without CRM configuration', async () => {
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
      code: 'CRM_NOT_CONFIGURED',
      message: 'Lead delivery is not configured yet.',
      retryable: false
    }
  });
  assert.equal(body.data, undefined);
});
