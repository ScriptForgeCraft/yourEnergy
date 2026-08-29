import assert from 'node:assert/strict';
import test from 'node:test';

import { ProductApiClient, ProductApiError } from '../src/services/api-client.js';
import { calculatePreliminaryPolygonArea } from '../src/services/property-map.js';

test('ProductApiClient converts an aborted request into the documented ABORTED error', async () => {
  const client = new ProductApiClient({
    fetchImpl: (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener(
          'abort',
          () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          },
          { once: true }
        );
      })
  });
  const controller = new AbortController();
  const pending = client.geocode(
    { query: 'Zovuni 26 33', locale: 'en' },
    { signal: controller.signal }
  );
  controller.abort();

  await assert.rejects(
    pending,
    (error) => error instanceof ProductApiError && error.code === 'ABORTED'
  );
});

test('ProductApiClient preserves a server error code rather than inventing a result', async () => {
  const client = new ProductApiClient({
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          ok: false,
          error: { code: 'PVGIS_NOT_CONFIGURED', message: 'Not configured', retryable: false }
        }),
        { status: 503, headers: { 'content-type': 'application/json' } }
      )
  });

  await assert.rejects(
    client.analyze({}),
    (error) =>
      error instanceof ProductApiError &&
      error.code === 'PVGIS_NOT_CONFIGURED' &&
      error.status === 503
  );
});

test('preliminary polygon area is finite and only available after three geographic points', () => {
  assert.equal(calculatePreliminaryPolygonArea([]), 0);
  const area = calculatePreliminaryPolygonArea([
    { lat: 40.18001, lng: 44.50001 },
    { lat: 40.18001, lng: 44.50011 },
    { lat: 40.18011, lng: 44.50011 },
    { lat: 40.18011, lng: 44.50001 }
  ]);

  assert.ok(Number.isFinite(area));
  assert.ok(area > 50 && area < 150);
});
