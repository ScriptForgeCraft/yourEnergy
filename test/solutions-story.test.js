import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  buildSolutionsPresentation,
  isSolutionsStoryFrameFullyVisible,
  moveSolutionsStoryStep
} from '../src/ui/solutions-story.js';

const analysis = Object.freeze({
  property: { address: 'Komitas Ave, Yerevan' },
  consumption: { annualKwh: 10_200 },
  production: { annualYieldKwhPerKwp: 1_500 },
  roof: { areaSqm: 54.8, orientationDegrees: 180, tiltDegrees: 30 },
  selectedScenario: {
    system: { capacityKwp: 6.96, panelCount: 12 },
    generation: {
      annualKwh: 10_440,
      monthlyKwh: [420, 480, 680, 850, 980, 1010, 1080, 1020, 880, 720, 510, 310]
    },
    coveragePercent: 102.4,
    financial: { annualSavingsAmd: 522_000, paybackYears: 5.33 }
  },
  environmental: { avoidedCo2Tons: 1.54, treeEquivalent: 25.7 }
});

test('Solutions story presents completed SolarAnalysis values without calculating new ones', () => {
  const presentation = buildSolutionsPresentation(analysis, { status: 'complete' });
  assert.equal(presentation.hasResult, true);
  assert.equal(presentation.location, 'Komitas Ave, Yerevan');
  assert.equal(presentation.systemSize, 6.96);
  assert.equal(presentation.panelCount, 12);
  assert.equal(presentation.annualProduction, 10_440);
  assert.deepEqual(presentation.monthlyProduction, analysis.selectedScenario.generation.monthlyKwh);
  assert.equal(presentation.annualSavings, 522_000);
  assert.equal(presentation.payback, 5.33);
  assert.equal(presentation.avoidedCo2, 1.54);
  assert.equal(presentation.treeEquivalent, 25.7);
  assert.equal(analysis.selectedScenario.coveragePercent, 102.4);
});

test('Solutions story makes missing analysis explicit instead of falling back to an invented result', () => {
  const presentation = buildSolutionsPresentation(null, { status: 'loading' });
  assert.equal(presentation.loading, true);
  assert.equal(presentation.hasResult, false);
  assert.equal(presentation.systemSize, null);
  assert.equal(presentation.annualProduction, null);
  assert.equal(presentation.annualSavings, null);
  assert.equal(presentation.monthlyProduction, null);
});

test('Solutions story navigation reaches every step on desktop and mobile', () => {
  const steps = Array.from({ length: 6 }, () => ({ scrollIntoView() {} }));
  const slides = [];
  const swiper = { slideTo: (index) => slides.push(index) };

  assert.equal(
    moveSolutionsStoryStep({
      index: 0,
      steps,
      swiper,
      setActive: () => {},
      isDesktop: true,
      reducedMotion: false
    }),
    0
  );
  assert.equal(
    moveSolutionsStoryStep({
      index: 5,
      steps,
      swiper,
      setActive: () => {},
      isDesktop: true,
      reducedMotion: false
    }),
    5
  );
  assert.deepEqual(slides, [0, 5]);

  const active = [];
  const scrollOptions = [];
  const mobileSteps = Array.from({ length: 6 }, () => ({
    scrollIntoView: (options) => scrollOptions.push(options)
  }));
  assert.equal(
    moveSolutionsStoryStep({
      index: 4,
      steps: mobileSteps,
      setActive: (index) => active.push(index),
      isDesktop: false,
      reducedMotion: false
    }),
    4
  );
  assert.deepEqual(active, [4]);
  assert.deepEqual(scrollOptions, [{ behavior: 'smooth', block: 'start' }]);
});

test('desktop story captures the wheel only when its exact 100svh frame is visible', () => {
  assert.equal(
    isSolutionsStoryFrameFullyVisible({ top: 0, bottom: 900, height: 900, viewportHeight: 900 }),
    true
  );
  assert.equal(
    isSolutionsStoryFrameFullyVisible({ top: 42, bottom: 942, height: 900, viewportHeight: 900 }),
    false
  );
  assert.equal(
    isSolutionsStoryFrameFullyVisible({ top: 0, bottom: 860, height: 860, viewportHeight: 900 }),
    false
  );
});

test('Russian journey ships all six interactive steps and a distinct engineer-survey scene', async () => {
  const page = await readFile(resolve('ru/index.html'), 'utf8');
  const start = page.indexOf("id='process'");
  const end = page.indexOf("id='engineering'", start);
  const journey = page.slice(start, end);

  assert.match(journey, /Как это работает/);
  assert.equal((journey.match(/data-solutions-step=/g) ?? []).length, 6);
  assert.equal((journey.match(/data-solutions-progress-step=/g) ?? []).length, 6);
  assert.equal((journey.match(/data-solutions-next/g) ?? []).length, 5);
  assert.equal((journey.match(/data-solutions-previous/g) ?? []).length, 5);
  assert.match(journey, /solutions-inspection-1024\.jpg/);
  assert.match(journey, /Начать анализ солнечного потенциала/);
});
