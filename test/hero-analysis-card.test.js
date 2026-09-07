import assert from 'node:assert/strict';
import test from 'node:test';

import { buildHeroAnalysisPresentation } from '../src/ui/hero-analysis-card.js';

const analysis = Object.freeze({
  scope: 'manual-roof-plane',
  property: { confirmed: true, address: 'Engineer note: Arabkir' },
  selectedScenario: {
    generation: {
      annualKwh: 8_420,
      monthlyKwh: [400, 430, 620, 810, 920, 980, 1040, 990, 840, 670, 450, 270]
    },
    coveragePercent: 106.3,
    financial: { annualSavingsAmd: 420_000 }
  },
  environmental: { avoidedCo2Tons: null }
});

test('Hero presentation only reads an existing SolarAnalysis and caps consumer coverage display', () => {
  const presentation = buildHeroAnalysisPresentation(analysis);
  assert.equal(presentation.ready, true);
  assert.equal(presentation.location, 'Engineer note: Arabkir');
  assert.equal(presentation.annualGenerationKwh, 8_420);
  assert.deepEqual(
    presentation.monthlyGenerationKwh,
    analysis.selectedScenario.generation.monthlyKwh
  );
  assert.equal(presentation.coveragePercent, 100);
  assert.equal(presentation.annualSavingsAmd, 420_000);
  assert.equal(presentation.avoidedCo2Tons, null);
  // Display clamping never mutates the analysis source or its export-capable value.
  assert.equal(analysis.selectedScenario.coveragePercent, 106.3);
});

test('Hero presentation uses explicit missing states rather than demo fallbacks', () => {
  const presentation = buildHeroAnalysisPresentation({
    scope: 'regional-preliminary',
    property: { confirmed: false, address: 'Regional benchmark: yerevan' },
    selectedScenario: {
      generation: { annualKwh: null, monthlyKwh: null },
      coveragePercent: null,
      financial: { annualSavingsAmd: null }
    },
    environmental: { avoidedCo2Tons: null }
  });
  assert.equal(presentation.ready, false);
  assert.equal(presentation.locationKind, 'regional');
  assert.equal(presentation.annualGenerationKwh, null);
  assert.equal(presentation.coveragePercent, null);
  assert.equal(presentation.annualSavingsAmd, null);
  assert.equal(presentation.avoidedCo2Tons, null);
});

test('Hero presentation reports loading without manufacturing a result', () => {
  const presentation = buildHeroAnalysisPresentation(null, { status: 'loading' });
  assert.equal(presentation.loading, true);
  assert.equal(presentation.ready, false);
  assert.equal(presentation.annualGenerationKwh, null);
  assert.equal(presentation.coveragePercent, null);
  assert.equal(presentation.annualSavingsAmd, null);
  assert.equal(presentation.avoidedCo2Tons, null);
});
