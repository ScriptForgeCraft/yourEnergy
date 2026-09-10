import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import en from '../src/content/en.js';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';
import {
  HERO_TIME_ZONE,
  getHeroFrameUrl,
  getHeroImageExtension,
  getHeroIntroProfiles,
  getHeroIntroTransitionDuration,
  getHeroCounterTarget,
  getHeroTimeProfile,
  getHeroTimeSrcset,
  getYerevanHour,
  projectHeroArcPoint,
  resolveHeroFrameFailure,
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
    'hero-time-8-640.avif',
    'hero-time-8-1024.avif',
    'hero-time-8-1600.avif',
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
  assert.doesNotMatch(hero, /hero-scroll-cue|hero-sun-note|hero-outlook-note/u);
});

test('time-based hero visual uses Asia/Yerevan and a neutral fallback outside supplied day frames', () => {
  assert.equal(HERO_TIME_ZONE, 'Asia/Yerevan');
  const expectedFrames = [
    ['2026-09-07T02:30:00.000Z', 6, null, 8, 'neutral'],
    ['2026-09-07T04:00:00.000Z', 8, 8, 8, 'day'],
    ['2026-09-07T05:00:00.000Z', 9, 8, 8, 'day'],
    ['2026-09-07T06:00:00.000Z', 10, 12, 12, 'day'],
    ['2026-09-07T08:00:00.000Z', 12, 12, 12, 'day'],
    ['2026-09-07T09:00:00.000Z', 13, 14, 14, 'day'],
    ['2026-09-07T11:00:00.000Z', 15, 16, 16, 'day'],
    ['2026-09-07T13:00:00.000Z', 17, 18, 18, 'day'],
    ['2026-09-07T15:00:00.000Z', 19, 20, 20, 'evening'],
    ['2026-09-07T18:00:00.000Z', 22, null, 8, 'neutral']
  ];
  for (const [iso, yerevanHour, profileHour, assetHour, kind] of expectedFrames) {
    const date = new Date(iso);
    const profile = getHeroTimeProfile(date);
    assert.equal(getYerevanHour(date), yerevanHour);
    assert.equal(profile.hour, profileHour);
    assert.equal(profile.assetHour, assetHour);
    assert.equal(profile.kind, kind);
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

test('first-view Hero day-cycle intro starts at morning and stops at the active supplied frame', () => {
  const afternoon = getHeroTimeProfile(new Date('2026-09-07T13:00:00.000Z'));
  assert.deepEqual(
    getHeroIntroProfiles(afternoon).map(({ assetHour }) => assetHour),
    [8, 12, 14, 16, 18]
  );
  assert.deepEqual(
    getHeroIntroProfiles(getHeroTimeProfile(new Date('2026-09-07T18:00:00.000Z'))),
    []
  );
  assert.equal(getHeroIntroTransitionDuration(5), 1_150);
  assert.equal(getHeroIntroTransitionDuration(6) * 5 <= 5_200, true);
});

test('time-based Hero visual preloads a frame and retains the last successful frame before neutral recovery', async () => {
  const motion = await source('src/ui/home-motion.js');
  const daytime = getHeroTimeProfile(new Date('2026-09-07T10:00:00.000Z'));
  const evening = getHeroTimeProfile(new Date('2026-09-07T16:00:00.000Z'));
  assert.equal(resolveHeroFrameFailure(daytime, evening), daytime);
  assert.equal(resolveHeroFrameFailure(daytime, daytime).kind, 'neutral');
  assert.match(motion, /const isReady = await preload\(/u);
  assert.match(motion, /lastSuccessfulProfile/u);
  assert.match(motion, /resolveHeroFrameFailure\(lastSuccessfulProfile, appliedProfile\)/u);
  assert.match(motion, /source\.removeAttribute\('srcset'\)/u);
  assert.match(motion, /applyFrame\(fallback, \{ jpegOnly: true \}\)/u);
  assert.match(motion, /await frame\.decode\(\)/u);
  assert.match(motion, /await transitionImage\.decode\(\)/u);
  assert.match(motion, /const preparedTransitions = await Promise\.all\(/u);
  assert.match(motion, /delay: index \* transitionDuration/u);
  assert.match(motion, /startTransitionFade/u);
  assert.match(motion, /animateSunAcrossDayCycle/u);
  assert.match(motion, /interpolateSunArc/u);
  assert.match(motion, /transitionImage\.animate\(\[\{ opacity: 0 \}, \{ opacity: 1 \}\]/u);
  assert.match(motion, /requestAnimationFrame\(frame\)/u);
  assert.doesNotMatch(motion, /date\?\.getHours/u);
});

test('Hero sun maps each source-frame arc point into the uncropped hero rectangle', () => {
  const evening = getHeroTimeProfile(new Date('2026-09-07T16:00:00.000Z'));
  const point = projectHeroArcPoint(evening, {
    frameWidth: 1520.8,
    frameHeight: 791.2
  });
  assert.equal(Math.round(point.x), 1460);
  assert.equal(Math.round(point.y), 169);
  assert.equal(projectHeroArcPoint(evening, { frameWidth: 100 }), null);
});

test('each supplied day-cycle frame carries a source-verified point on its solar arc', () => {
  const expectedArcPoints = [
    ['2026-09-07T04:00:00.000Z', { x: 0.39, y: 0.456 }],
    ['2026-09-07T06:00:00.000Z', { x: 0.54, y: 0.231 }],
    ['2026-09-07T09:00:00.000Z', { x: 0.65, y: 0.148 }],
    ['2026-09-07T11:00:00.000Z', { x: 0.75, y: 0.117 }],
    ['2026-09-07T13:00:00.000Z', { x: 0.87, y: 0.137 }],
    ['2026-09-07T15:00:00.000Z', { x: 0.96, y: 0.213 }]
  ];
  for (const [iso, expected] of expectedArcPoints) {
    assert.deepEqual(getHeroTimeProfile(new Date(iso)).arcPoint, expected);
  }
});

test('Hero count-up uses explicit numeric values, including decimal CO₂ figures', () => {
  assert.equal(getHeroCounterTarget('8420'), 8420);
  assert.equal(getHeroCounterTarget('1.541'), 1.541);
  assert.equal(getHeroCounterTarget(26), 26);
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
  assert.match(generator, /const createHeroContent = \(content\)/u);
  assert.match(generator, /buildEnvironmentalImpact\(/u);
  assert.match(generator, /treeEquivalency: EPA_URBAN_TREE_CO2_EQUIVALENCY/u);
  assert.match(generator, /hero\s*\}\)/u);
  assert.match(template, /id='home-page-config'/u);
});

test('hero copy is localized and keeps example data visibly separate from a visitor result', () => {
  const expected = new Map([
    [hy, ['Տնօրինիր քո էներգիան յուրովի։', 'քան կարծում եք։', 'Հաշվել իմ տան համար']],
    [ru, ['Управляй своей энергией по-своему.', 'чем вы думаете.', 'Рассчитать для дома']],
    [en, ['Manage your energy your way.', 'than you think.', 'Calculate my home']]
  ]);
  for (const [content, [eyebrow, accent, cta]] of expected) {
    assert.equal(content.hero.eyebrow, eyebrow);
    assert.equal(content.hero.titleAccent, accent);
    assert.equal(content.hero.openCalculator, cta);
    assert.equal(content.hero.dashboardExample.annualGenerationKwh, 8420);
    assert.equal(content.hero.dashboardExample.co2Tons, undefined);
    assert.equal(content.hero.dashboardExample.trees, undefined);
    assert.doesNotMatch(content.hero.dashboardExample.treesLabel, /planted|высаженн|տնկված/iu);
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
