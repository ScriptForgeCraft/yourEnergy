import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequest as analysisOnRequest } from '../functions/api/analysis.js';
import { onRequest as potentialOnRequest } from '../functions/api/potential.js';
import { PVGIS_CACHE_TTL_SECONDS, createPvgisCache } from '../functions/_lib/pvgis-cache.js';
import { isWithinArmeniaServiceArea } from '../functions/_lib/service-area.js';
import { calculateRoofPlaneArea } from '../src/domain/index.js';
import { collectAnalysisNotes } from '../src/ui/analysis-ledger.js';

const endpoint = 'https://site.example/api';

const postJson = (path, body) =>
  new Request(`${endpoint}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

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
  PVGIS_ENDPOINT: 'https://pvgis.example/api',
  PVGIS_CACHE: createMemoryKv(),
  PVGIS_CACHE_SALT: 'test-cache-salt',
  ...overrides
});

const pvgisGeneration = () => ({
  outputs: {
    totals: { fixed: { E_y: 1500 } },
    monthly: { fixed: Array.from({ length: 12 }, () => ({ E_m: 125 })) }
  }
});

const p0Payload = Object.freeze({
  property: {
    address: 'Private address that must not enter the PVGIS cache',
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

test('a map outline is converted to preliminary roof-plane area, while steep roofs require measurement', () => {
  const planeArea = calculateRoofPlaneArea({
    areaMethod: 'map-projected',
    projectedAreaSqm: 100,
    tiltDegrees: 30
  });

  assert.ok(Math.abs(planeArea - 115.4700538) < 0.0001);
  assert.equal(
    calculateRoofPlaneArea({
      areaMethod: 'measured-plane',
      planeAreaSqm: 101,
      tiltDegrees: 88
    }),
    101
  );
  assert.equal(
    calculateRoofPlaneArea({
      areaMethod: 'map-projected',
      projectedAreaSqm: 100,
      tiltDegrees: 75
    }),
    null
  );
});

test('the visible analysis ledger carries manual-roof limitations alongside assumptions', () => {
  assert.deepEqual(
    collectAnalysisNotes({
      assumptions: ['PVGIS_SYSTEM_LOSS_14_PERCENT', 'MANUAL_ROOF_PLANE'],
      limitations: ['MANUAL_PROPERTY_POINT', 'MANUAL_ROOF_PLANE']
    }),
    ['PVGIS_SYSTEM_LOSS_14_PERCENT', 'MANUAL_ROOF_PLANE', 'MANUAL_PROPERTY_POINT']
  );
});

test('the Armenia service guard rejects foreign points before calling PVGIS', async () => {
  assert.equal(isWithinArmeniaServiceArea({ latitude: 40.18, longitude: 44.51 }), true);
  assert.equal(isWithinArmeniaServiceArea({ latitude: 41.715, longitude: 44.827 }), false);

  let providerCalls = 0;
  const response = await potentialOnRequest({
    request: postJson('/potential', {
      property: { latitude: 41.715, longitude: 44.827, confirmed: true }
    }),
    env: pvgisEnv(),
    fetch: async () => {
      providerCalls += 1;
      return new Response(JSON.stringify(pvgisGeneration()));
    }
  });
  const body = await response.json();

  assert.equal(response.status, 422);
  assert.equal(body.error.code, 'OUTSIDE_SERVICE_AREA');
  assert.equal(providerCalls, 0);
});

test('a missing KV cache binding returns an honest disabled-service state', async () => {
  let providerCalls = 0;
  const response = await potentialOnRequest({
    request: postJson('/potential', {
      property: { latitude: 40.18, longitude: 44.51, confirmed: true }
    }),
    env: { PVGIS_ENDPOINT: 'https://pvgis.example/api' },
    fetch: async () => {
      providerCalls += 1;
      return new Response(JSON.stringify(pvgisGeneration()));
    }
  });
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error.code, 'PVGIS_CACHE_NOT_CONFIGURED');
  assert.equal(providerCalls, 0);
});

test('the PVGIS cache uses a salted key, stores no private request data and expires after seven days', async () => {
  const namespace = createMemoryKv();
  let now = new Date('2026-09-01T12:00:00.000Z');
  const cache = createPvgisCache(
    { PVGIS_CACHE: namespace, PVGIS_CACHE_SALT: 'test-cache-salt' },
    { now: () => now }
  );
  const input = {
    property: { latitude: 40.18, longitude: 44.51 },
    system: { capacityKwp: 1, lossPercent: 14 },
    roof: {
      pvgisAspectDegrees: 0,
      tiltDegrees: 30,
      polygon: [
        [40.1, 44.5],
        [40.2, 44.6]
      ]
    },
    address: 'Private address that must not enter the PVGIS cache',
    consumption: { annualKwh: 12_000 }
  };

  await cache.write({
    mode: 'manual-roof-plane',
    input,
    value: { generation: { annualKwh: 1500, monthlyKwh: Array(12).fill(125) } }
  });

  assert.equal(namespace.writes.length, 1);
  assert.doesNotMatch(namespace.writes[0].key, /40\.18|44\.51/u);
  assert.doesNotMatch(namespace.writes[0].value, /Private address|12000|polygon/u);
  assert.equal(namespace.writes[0].options.expirationTtl, PVGIS_CACHE_TTL_SECONDS);
  assert.equal((await cache.read({ mode: 'manual-roof-plane', input })).hit, true);

  now = new Date(now.getTime() + (PVGIS_CACHE_TTL_SECONDS + 1) * 1000);
  assert.equal((await cache.read({ mode: 'manual-roof-plane', input })).hit, false);
});

test('a repeated potential request uses the normalized seven-day cache rather than calling PVGIS again', async () => {
  const env = pvgisEnv();
  let providerCalls = 0;
  const fetchImpl = async () => {
    providerCalls += 1;
    return new Response(
      JSON.stringify({
        ...pvgisGeneration(),
        inputs: { mounting_system: { fixed: { slope: { value: 31 }, azimuth: { value: -10 } } } }
      }),
      { headers: { 'content-type': 'application/json' } }
    );
  };
  const input = { property: { latitude: 40.18, longitude: 44.51, confirmed: true } };
  const first = await potentialOnRequest({
    request: postJson('/potential', input),
    env,
    fetch: fetchImpl
  });
  const second = await potentialOnRequest({
    request: postJson('/potential', input),
    env,
    fetch: fetchImpl
  });
  const firstBody = await first.json();
  const secondBody = await second.json();

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(providerCalls, 1);
  assert.equal(firstBody.data.potential.cache.state, 'miss');
  assert.equal(secondBody.data.potential.cache.state, 'hit');
});

test('an elevated system uses the PVGIS free-standing benchmark but stays preliminary', async () => {
  let requestedUrl = null;
  const response = await analysisOnRequest({
    request: postJson('/analysis', {
      ...p0Payload,
      roof: { ...p0Payload.roof, mountingMode: 'elevated' }
    }),
    env: pvgisEnv(),
    fetch: async (url) => {
      requestedUrl = new URL(url);
      return new Response(
        JSON.stringify({
          ...pvgisGeneration(),
          inputs: { mounting_system: { fixed: { slope: { value: 31 }, azimuth: { value: -10 } } } }
        }),
        { headers: { 'content-type': 'application/json' } }
      );
    }
  });
  const body = await response.json();
  const analysis = body.data.analysis;

  assert.equal(response.status, 200);
  assert.equal(requestedUrl.searchParams.get('optimalangles'), '1');
  assert.equal(analysis.scope, 'manual-roof-plane');
  assert.equal(analysis.dataCompleteness.level, 'preliminary');
  assert.deepEqual(analysis.mountingRecommendation, {
    mountingMode: 'elevated',
    tiltDegrees: 31,
    azimuthDegrees: 170,
    basis: 'pvgis-fixed-free-standing-optimum'
  });
  assert.ok(analysis.limitations.includes('PVGIS_FREE_STANDING_BENCHMARK_FOR_ELEVATED_MOUNT'));
});

test('a steep map-area roof is rejected before PVGIS is contacted', async () => {
  let providerCalls = 0;
  const response = await analysisOnRequest({
    request: postJson('/analysis', {
      ...p0Payload,
      roof: { ...p0Payload.roof, tiltDegrees: 75 }
    }),
    env: pvgisEnv(),
    fetch: async () => {
      providerCalls += 1;
      return new Response(JSON.stringify(pvgisGeneration()));
    }
  });
  const body = await response.json();

  assert.equal(response.status, 422);
  assert.equal(body.error.code, 'ROOF_AREA_REQUIRES_MEASURED_PLANE');
  assert.equal(providerCalls, 0);
});

test('a measured roof-face area works without a map polygon and remains preliminary', async () => {
  const response = await analysisOnRequest({
    request: postJson('/analysis', {
      ...p0Payload,
      roof: {
        areaMethod: 'measured-plane',
        mountingMode: 'roof-parallel',
        planeAreaSqm: 84,
        polygonComplete: false,
        tiltDegrees: 78,
        azimuthDegrees: 180
      }
    }),
    env: pvgisEnv(),
    fetch: async () =>
      new Response(JSON.stringify(pvgisGeneration()), {
        headers: { 'content-type': 'application/json' }
      })
  });
  const body = await response.json();
  const analysis = body.data.analysis;

  assert.equal(response.status, 200);
  assert.equal(analysis.roof.areaMethod, 'measured-plane');
  assert.equal(analysis.roof.projectedAreaSqm, null);
  assert.equal(analysis.roof.planeAreaSqm, 84);
  assert.equal(analysis.roof.areaSqm, 84);
  assert.equal(analysis.roof.polygonComplete, false);
  assert.equal(analysis.dataCompleteness.level, 'preliminary');
  assert.ok(analysis.assumptions.includes('USER_MEASURED_ROOF_PLANE_AREA'));
});
