import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SolarPassportRepository,
  TEMPORARY_YOURENERGY_PRICEBOOK,
  buildSolarAnalysis,
  compareOffer,
  createUserTariffSelection
} from '../src/domain/index.js';

// This fixture is the UI-refactor contract.  It uses deterministic provider
// data so the presentation layer can be rebuilt without changing a single
// calculation, normalization or rounding rule.
const FIXTURE = Object.freeze({
  effectiveDate: '2026-08-31',
  property: {
    coordinates: { lat: 40.18, lng: 44.51 },
    confirmed: true,
    source: { kind: 'manual', status: 'confirmed' }
  },
  consumption: { annualKwh: 12_000 },
  roof: {
    areaSqm: 100,
    usableAreaRatio: 0.7,
    orientationDegrees: 180,
    tiltDegrees: 30,
    polygonComplete: true,
    source: { kind: 'manual', status: 'confirmed' }
  },
  production: {
    annualYieldKwhPerKwp: 1_500,
    monthlyYieldFactors: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    source: { kind: 'provider', status: 'confirmed', provider: 'PVGIS fixture' }
  },
  system: { panelWatts: 580, panelAreaSqm: 2 },
  priceBook: TEMPORARY_YOURENERGY_PRICEBOOK,
  tariffSelection: createUserTariffSelection({ rateAmdPerKwh: 52 }, '2026-08-31')
});

test('consumer and engineering UI share the unchanged calculation contract', () => {
  const analysis = buildSolarAnalysis(FIXTURE);
  const scenario = analysis.selectedScenario;
  const passport = new SolarPassportRepository({
    clock: () => new Date('2026-08-31T12:00:00.000Z'),
    idFactory: () => 'parity-fixture'
  }).create(analysis, { locale: 'ru-RU' });

  assert.deepEqual(analysis.production.monthlyYieldFactors, Array(12).fill(1 / 12));
  assert.equal(analysis.production.annualYieldKwhPerKwp, 1_500);
  assert.equal(scenario.system.capacityKwp, 7.54);
  assert.equal(scenario.system.panelCount, 13);
  assert.equal(analysis.roof.areaSqm, 100);
  assert.deepEqual(scenario.limitations, []);
  assert.deepEqual(scenario.commercialEstimate.rangeAmd, {
    p25: 1_750_000,
    p50: 1_860_000,
    p75: 1_990_000
  });
  assert.equal(scenario.generation.annualKwh, 11_310);
  assert.equal(scenario.financial.annualSavingsAmd, 588_120);
  assert.equal(scenario.financial.paybackYears, 3.162619873495205);
  assert.equal(scenario.financial.timeline.at(-1).netAmd, 12_843_000);
  assert.equal(passport.analysis.selectedScenario.generation.annualKwh, 11_310);
  assert.equal(passport.analysis.commercialEstimate.primaryAmd, 1_860_000);
});

test('offer checker remains on the same P25/P50/P75 comparison contract', () => {
  const comparison = compareOffer({
    totalAmd: 1_482_000,
    capacityKwp: 6,
    systemType: 'residential-grid-tied',
    inclusions: {
      panels: true,
      inverter: true,
      mounting: true,
      'standard-installation': true,
      'basic-grid-connection': true
    },
    priceBook: TEMPORARY_YOURENERGY_PRICEBOOK,
    at: '2026-08-31'
  });

  assert.equal(comparison.status, 'within-range');
  assert.equal(comparison.amdPerWp, 247);
  assert.deepEqual(comparison.estimate.ratesAmdPerWp, { p25: 232, p50: 247, p75: 264 });
});
