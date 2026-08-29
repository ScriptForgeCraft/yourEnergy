import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequest as analysisOnRequest } from '../functions/api/analysis.js';
import { onRequest as geocodeOnRequest } from '../functions/api/geocode.js';
import { onRequest as leadOnRequest } from '../functions/api/lead.js';
import {
  createGeocodingAdapter,
  normalizeGeocodingCandidate,
  validateGeocodeInput
} from '../functions/_lib/geocoding.js';
import {
  buildPvgisUrl,
  normalizePvgisResult,
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

test('analysis returns an honest configuration error instead of a generated PVGIS estimate', async () => {
  const response = await analysisOnRequest({
    request: postJson('/analysis', p0AnalysisPayload),
    env: {}
  });
  const body = await readJson(response);

  assert.equal(response.status, 503);
  assert.deepEqual(body, {
    ok: false,
    error: {
      code: 'PVGIS_NOT_CONFIGURED',
      message: 'Solar yield analysis is not configured yet.',
      retryable: false
    }
  });
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
  assert.equal(analysis.selectedScenario.system.capacityKwp, 7.2);
  assert.equal(analysis.selectedScenario.generation.annualKwh, 10_800);
  assert.equal(analysis.selectedScenario.financial.annualSavingsAmd, null);
  assert.equal(analysis.selectedScenario.financial.paybackYears, null);
  assert.equal(
    analysis.sourceLedger.find((entry) => entry.key === 'production').source.provider,
    'PVGIS'
  );
  assert.ok(analysis.assumptions.includes('PVGIS_SYSTEM_LOSS_14_PERCENT'));
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
