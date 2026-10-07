import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPrecachePath,
  renderServiceWorker,
  toPrecacheUrl
} from '../scripts/build/service-worker.mjs';

test('service worker precaches the application shell but keeps the media catalog on demand', () => {
  assert.equal(isPrecachePath('index.html'), true);
  assert.equal(isPrecachePath('ru/calculator/index.html'), true);
  assert.equal(isPrecachePath('assets/main-123.css'), true);
  assert.equal(isPrecachePath('fonts/poqrik-dzeragir.ttf'), true);
  assert.equal(isPrecachePath('images/hero-time-8-1600.webp'), false);
  assert.equal(isPrecachePath('documents/brochure.pdf'), false);
  assert.equal(toPrecacheUrl('index.html'), '/');
  assert.equal(toPrecacheUrl('ru/calculator/index.html'), '/ru/calculator/');
  assert.equal(toPrecacheUrl('offline.html'), '/offline.html');
});

test('generated service worker bypasses protected requests and waits for an explicit update', () => {
  const source = renderServiceWorker({
    revision: 'test',
    precacheUrls: ['/index.html', '/offline.html']
  });
  assert.match(source, /request\.method !== 'GET'/u);
  assert.match(source, /url\.pathname\.startsWith\('\/api\/'\)/u);
  assert.match(source, /YOUR_ENERGY_SKIP_WAITING/u);
  assert.doesNotMatch(
    source.match(
      /self\.addEventListener\('install'[\s\S]*?self\.addEventListener\('activate'/u
    )?.[0] ?? '',
    /self\.skipWaiting/u
  );
  assert.match(source, /staleWhileRevalidate/u);
  assert.match(source, /navigationResponse/u);
});
