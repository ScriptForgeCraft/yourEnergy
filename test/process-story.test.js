import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildProcessPresentation,
  buildProcessStartState,
  getProcessStepIndex
} from '../src/ui/process-story.js';
import { processStoryCopy } from '../src/content/process-story.js';
import { createCalculatorSession } from '../src/ui/calculator-session.js';

const analysis = {
  production: {
    annualYieldKwhPerKwp: 1538,
    source: { provider: 'PVGIS' }
  },
  roof: { areaSqm: 74.5, orientationDegrees: 180, tiltDegrees: 28 },
  selectedScenario: {
    system: { capacityKwp: 10.4, panelCount: 16 },
    generation: { annualKwh: 16_000 },
    commercialEstimate: {
      available: true,
      rangeAmd: { p25: 1_950_000, p75: 2_150_000 }
    }
  },
  environmental: { avoidedCo2Tons: 6.1 }
};

test('process presentation reads completed SolarAnalysis values without deriving new results', () => {
  assert.deepEqual(
    buildProcessPresentation({
      version: 2,
      regionId: 'yerevan',
      consumption: { mode: 'usage', averageMonthlyKwh: 900 },
      analysis,
      analysisStatus: 'complete',
      solarPassport: { id: 'passport-1' }
    }),
    {
      hasAnalysis: true,
      regionId: 'yerevan',
      consumptionMode: 'usage',
      consumptionValue: 900,
      solarResource: 1538,
      source: 'PVGIS',
      roofArea: 74.5,
      orientation: 180,
      tilt: 28,
      systemCapacity: 10.4,
      panelCount: 16,
      annualGeneration: 16_000,
      commercialEstimateMax: 2_150_000,
      avoidedCo2Tons: 6.1,
      passportReady: true
    }
  );
});

test('process never presents stale or incomplete analysis as a personal result', () => {
  for (const status of ['idle', 'loading', 'unavailable']) {
    const presentation = buildProcessPresentation({ analysis, analysisStatus: status });
    assert.equal(presentation.hasAnalysis, false);
    assert.equal(presentation.systemCapacity, null);
    assert.equal(presentation.annualGeneration, null);
    assert.equal(presentation.commercialEstimateMax, null);
  }
  assert.equal(
    buildProcessPresentation({ analysis: { selectedScenario: {} }, analysisStatus: 'complete' })
      .hasAnalysis,
    true
  );
});

test('process form hands only validated inputs to CalculatorSession and invalidates old results', () => {
  let saved = null;
  const session = createCalculatorSession({
    storage: {
      getItem: () => saved,
      setItem: (_, value) => {
        saved = value;
      }
    }
  });
  const previous = {
    regionId: 'yerevan',
    consumption: { mode: 'usage', averageMonthlyKwh: 350 },
    analysis,
    quickAnalysis: analysis,
    analysisStatus: 'complete',
    roof: { areaSqm: 80 },
    userTariff: { rateAmdPerKwh: 50 }
  };
  const next = buildProcessStartState(
    { regionId: 'lori', mode: 'bill', amount: '35000' },
    previous
  );
  session.write(next);
  assert.equal(session.read().regionId, 'lori');
  assert.deepEqual(session.read().consumption, {
    mode: 'bill',
    averageMonthlyBillAmd: 35_000
  });
  assert.equal(next.analysis, null);
  assert.equal(next.roof, null);
  assert.equal(next.userTariff, null);

  for (const amount of ['', null, -1, 0, 'no', Infinity]) {
    assert.equal(buildProcessStartState({ regionId: 'yerevan', mode: 'bill', amount }), null);
  }
  assert.equal(buildProcessStartState({ regionId: 'invalid', mode: 'bill', amount: 100 }), null);
});

test('scroll progress resolves predictably to six states', () => {
  assert.equal(getProcessStepIndex(-1), 0);
  assert.equal(getProcessStepIndex(0), 0);
  assert.equal(getProcessStepIndex(0.11), 0);
  assert.equal(getProcessStepIndex(0.17), 1);
  assert.equal(getProcessStepIndex(0.5), 3);
  assert.equal(getProcessStepIndex(1), 5);
  assert.equal(getProcessStepIndex(2), 5);
});

test('HY, RU and EN expose the same six process visuals and content shape', () => {
  const expectedVisuals = [
    'analysis',
    'inspection',
    'design',
    'proposal',
    'installation',
    'support'
  ];
  for (const locale of ['hy', 'ru', 'en']) {
    const copy = processStoryCopy[locale];
    assert.equal(copy.steps.length, 6);
    assert.deepEqual(
      copy.steps.map(({ visual }) => visual),
      expectedVisuals
    );
    assert.ok(copy.steps.every(({ nav, headline, copy: body }) => nav && headline && body));
  }
});
