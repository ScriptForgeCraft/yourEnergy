import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildProcessPresentation,
  buildProcessStartState,
  getProcessStepIndex
} from '../src/ui/process-story.js';
import { processStoryCopy } from '../src/content/process-story.js';
import { PROCESS_IMAGE_ASSETS, createProcessImageContext } from '../src/config/process-images.js';
import { createCalculatorSession } from '../src/ui/calculator-session.js';
import { readStylesheet } from './helpers/styles.js';

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

test('process presentation reads completed SolarAnalysis values without exposing the PVGIS provider', () => {
  assert.deepEqual(
    buildProcessPresentation({
      version: 3,
      regionId: 'yerevan',
      consumption: { mode: 'usage', averageMonthlyKwh: 900 },
      professionalAnalysis: analysis,
      professionalAnalysisStatus: 'complete',
      professionalSolarPassport: { id: 'passport-1' }
    }),
    {
      hasAnalysis: true,
      regionId: 'yerevan',
      consumptionMode: 'usage',
      consumptionValue: 900,
      solarResource: 1538,
      source: null,
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
    const presentation = buildProcessPresentation({
      professionalAnalysis: analysis,
      professionalAnalysisStatus: status
    });
    assert.equal(presentation.hasAnalysis, false);
    assert.equal(presentation.systemCapacity, null);
    assert.equal(presentation.annualGeneration, null);
    assert.equal(presentation.commercialEstimateMax, null);
  }
  assert.equal(
    buildProcessPresentation({
      professionalAnalysis: { selectedScenario: {} },
      professionalAnalysisStatus: 'complete'
    }).hasAnalysis,
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
    quickAnalysis: analysis,
    quickAnalysisStatus: 'complete',
    professionalAnalysis: analysis,
    professionalAnalysisStatus: 'complete',
    professionalAnalysisIdentity: 'previous-inputs',
    professionalSolarPassport: { id: 'passport-1' },
    roof: { areaSqm: 80 },
    financialRate: {
      mode: 'custom-effective',
      sourceType: 'user-provided-effective-rate',
      effectiveRateAmdPerKwh: 50
    }
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
  assert.equal(next.professionalAnalysis, null);
  assert.equal(next.roof, null);
  assert.equal(next.financialRate.mode, 'standard');
  assert.equal(next.financialRate.sourceType, 'automatic-standard-residential');

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

test('mobile installation labels and PVGIS data stay within their cards', async () => {
  const [processCss, calculatorCss] = await Promise.all([
    readStylesheet(new URL('../src/styles/process-story.css', import.meta.url)),
    readStylesheet(new URL('../src/styles/tools.css', import.meta.url))
  ]);

  assert.match(
    processCss,
    /\.process-installation-timeline__label\s*\{[^}]*overflow-wrap:\s*anywhere\s*!important;/u
  );
  assert.match(
    processCss,
    /\.process-installation-timeline\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/u
  );
  assert.match(calculatorCss, /\.potential-chart\.chart-bars\s*\{[^}]*overflow-x:\s*auto;/u);
  assert.match(calculatorCss, /\.potential-monthly-details table\s*\{[^}]*width:\s*100%;/u);
  assert.match(
    calculatorCss,
    /\.site-potential-card--compact \.site-potential-card__heading\s*\{[^}]*grid-template-areas:/u
  );
});

test('mobile process chapters use a soft visual bridge instead of a hard step boundary', async () => {
  const processCss = await readStylesheet(
    new URL('../src/styles/process-story.css', import.meta.url)
  );

  assert.match(processCss, /\.process-stage__background::after\s*\{[^}]*display:\s*block;/u);
  assert.match(processCss, /\.process-state\s*\{[^}]*min-height:\s*0;/u);
  assert.match(processCss, /\.process-state \+ \.process-state::after\s*\{[^}]*radial-gradient/u);
});

test('process image srcsets describe only real generated widths', () => {
  assert.deepEqual(
    PROCESS_IMAGE_ASSETS.map(({ visual, widths, width, height }) => ({
      visual,
      widths: [...widths],
      width,
      height
    })),
    [
      { visual: 'analysis', widths: [640, 1024, 1536], width: 1536, height: 1024 },
      { visual: 'inspection', widths: [640, 1024, 1600], width: 1600, height: 900 },
      { visual: 'design', widths: [640, 1024, 1600], width: 1600, height: 900 },
      { visual: 'proposal', widths: [640, 1024, 1600], width: 1600, height: 900 },
      { visual: 'installation', widths: [640, 1024, 1600], width: 1600, height: 900 },
      { visual: 'support', widths: [640, 1024, 1600], width: 1600, height: 900 }
    ]
  );

  const analysis = createProcessImageContext('analysis');
  assert.equal(analysis.src, '/images/process-step-analysis-1536.jpg');
  assert.match(analysis.avifSrcset, /process-step-analysis-1536\.avif 1536w/u);
  assert.doesNotMatch(analysis.avifSrcset, /(?:1600|2560|3200)w/u);
});
