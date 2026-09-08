import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import en from '../src/content/en.js';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';
import {
  getHeroFrameUrl,
  getHeroImageExtension,
  getHeroCounterTarget,
  getHeroTimeProfile,
  getHeroTimeSrcset,
  resolveHomeMotionCapabilities
} from '../src/ui/home-motion.js';

const root = resolve(import.meta.dirname, '..');
const source = (path) => readFile(resolve(root, path), 'utf8');

test('cinematic homepage Hero has a clearly labelled static example and one primary CTA', async () => {
  const template = await source('src/templates/home.hbs');
  const hero = template.match(/<section\b[^>]*\bdata-home-hero\b[^>]*>([\s\S]*?)<\/section>/u)?.[1];
  assert.ok(hero);
  for (const marker of [
    'data-hero-time-backdrop',
    'hero-time-20-640.avif',
    'hero-time-20-1024.avif',
    'hero-time-20-1600.avif',
    'data-hero-time-image',
    'data-hero-time-sun',
    'data-hero-dashboard',
    'data-hero-analysis-generation',
    'data-hero-analysis-coverage',
    'data-hero-analysis-savings',
    'data-hero-analysis-co2',
    'data-hero-example-co2',
    'data-hero-example-trees',
    "href='/icons.svg#leaf'",
    "href='/icons.svg#tree'",
    'hero-dashboard__note',
    'data-hero-analysis-bars'
  ]) {
    assert.match(hero, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  }
  assert.equal((hero.match(/href='\{\{calculatorHref\}\}'/gu) ?? []).length, 1);
  assert.doesNotMatch(hero, /<(?:video|canvas)\b|three(?:\.js)?|webgl/iu);
  assert.doesNotMatch(hero, /\{\{map\.demo\}\}|\{\{metrics\./u);
  assert.match(hero, /data-dashboard-mode='example'/u);
  assert.match(hero, /hero\.dashboardExample\.status/u);
  assert.doesNotMatch(hero, /homes equivalent|эквивалент домов|տան համարժեք/iu);
  assert.doesNotMatch(hero, /hero-energy-arc/u);
  assert.doesNotMatch(hero, /hero-route-note|hero-benefits/u);
  assert.match(hero, /hero-signature/u);
  assert.match(hero, /hero-scroll-cue/u);
});

test('time-based hero visual uses only the local clock and every supplied responsive frame', () => {
  const expectedHours = [
    [2, 20],
    [8, 8],
    [9, 8],
    [10, 12],
    [12, 12],
    [13, 14],
    [15, 16],
    [17, 18],
    [19, 20],
    [23, 20]
  ];
  for (const [localHour, assetHour] of expectedHours) {
    assert.equal(getHeroTimeProfile(new Date(2026, 8, 7, localHour)).hour, assetHour);
  }
  assert.equal(
    getHeroTimeSrcset(16, 'avif'),
    '/images/hero-time-16-640.avif 640w, /images/hero-time-16-1024.avif 1024w, /images/hero-time-16-1600.avif 1600w'
  );
  assert.equal(getHeroFrameUrl(14, 'avif'), '/images/hero-time-14-1600.avif');
  assert.equal(
    getHeroImageExtension('https://yourenergy.am/images/hero-time-14-1600.avif'),
    'avif'
  );
  assert.equal(getHeroImageExtension('/images/hero-time-20-1600.webp?version=1'), 'webp');
  assert.equal(getHeroImageExtension(''), null);
});

test('time-based Hero visual preloads a frame and keeps a static JPEG fallback for load failures', async () => {
  const motion = await source('src/ui/home-motion.js');
  assert.match(motion, /const isReady = await preload\(/u);
  assert.match(motion, /hero\.dataset\.heroImageState === 'fallback'/u);
  assert.match(motion, /source\.removeAttribute\('srcset'\)/u);
  assert.match(motion, /image\.srcset = getHeroTimeSrcset\(20, 'jpg'\)/u);
});

test('Hero count-up uses explicit numeric values, including decimal CO₂ figures', () => {
  assert.equal(getHeroCounterTarget('8420'), 8420);
  assert.equal(getHeroCounterTarget('3.5'), 3.5);
  assert.equal(getHeroCounterTarget(59), 59);
  assert.equal(getHeroCounterTarget(''), null);
});

test('the cinematic header uses one compact language control and retains normal language links', async () => {
  const header = await source('src/templates/partials/site-header.hbs');
  const generator = await source('scripts/generate-pages.mjs');
  const template = await source('src/templates/home.hbs');
  assert.match(header, /details class='language-menu'/u);
  assert.match(header, /href='\{\{navLinks\.calculator\}\}'/u);
  assert.match(header, /hreflang='\{\{hreflang\}\}'/u);
  assert.match(generator, /currentLanguageLabel/u);
  assert.match(
    generator,
    /homePageConfig:\s*escapeJsonForHtml\(\{\s*locale:\s*runtimeLocales\[content\.locale\],\s*hero:\s*content\.hero\s*\}\)/u
  );
  assert.match(template, /id='home-page-config'/u);
});

test('hero copy is localized and keeps example data visibly separate from a visitor result', () => {
  const expected = new Map([
    [hy, ['ԱՐԵՎԱՅԻՆ ԷՆԵՐԳԻԱ ՁԵՐ ՏԱՆ ՀԱՄԱՐ', 'քան կարծում եք։', 'Հաշվել իմ տան համար']],
    [ru, ['СОЛНЕЧНАЯ ЭНЕРГИЯ ДЛЯ ВАШЕГО ДОМА', 'чем вы думаете.', 'Рассчитать для дома']],
    [en, ['SOLAR ENERGY FOR YOUR HOME', 'than you think.', 'Calculate my home']]
  ]);
  for (const [content, [eyebrow, accent, cta]] of expected) {
    assert.equal(content.hero.eyebrow, eyebrow);
    assert.equal(content.hero.titleAccent, accent);
    assert.equal(content.hero.openCalculator, cta);
    assert.equal(content.hero.dashboardExample.annualGenerationKwh, 8420);
    assert.equal(content.hero.dashboardExample.co2Tons, 3.5);
    assert.equal(content.hero.dashboardExample.trees, 59);
    assert.equal(content.hero.dashboardExample.monthlyBarPercent.length, 12);
    assert.ok(content.hero.dashboardExample.status);
    assert.ok(content.hero.dashboardNotePreliminary);
    assert.equal(content.metrics, undefined);
  }
});

test('motion keeps the entrance and scroll bridge but removes pointer-parallax depth', () => {
  assert.deepEqual(resolveHomeMotionCapabilities({ reducedMotion: true, viewportWidth: 1440 }), {
    enabled: false,
    bridge: false
  });
  assert.deepEqual(resolveHomeMotionCapabilities({ reducedMotion: false, viewportWidth: 390 }), {
    enabled: true,
    bridge: false
  });
  assert.deepEqual(resolveHomeMotionCapabilities({ reducedMotion: false, viewportWidth: 1440 }), {
    enabled: true,
    bridge: true
  });
});

test('Hero motion has no dormant mouse-parallax listeners or depth variables', async () => {
  const motion = await source('src/ui/home-motion.js');
  assert.doesNotMatch(motion, /pointermove|pointerleave|finePointer|--depth-/u);
});
