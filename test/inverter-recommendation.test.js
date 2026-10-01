import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getGridInverters,
  getHybridInverters,
  getMicroinverters
} from '../src/data/equipment/calculator/catalog.js';
import {
  INVERTER_COMPATIBILITY_LIMITATIONS,
  INVERTER_TECHNOLOGY,
  recommendInverter
} from '../src/domain/inverter-recommendation.js';
import { buildSolarAnalysis } from '../src/domain/index.js';
import { getDefaultCalculatorSystem } from '../src/data/equipment/calculator/defaults.js';

const source = { kind: 'provider', status: 'confirmed', provider: 'PVGIS fixture' };

test('catalog inverter families expose normalized AC variants without parsing display strings', () => {
  const gridInverters = getGridInverters();
  const hybridInverters = getHybridInverters();
  const microinverters = getMicroinverters();

  assert.ok(gridInverters.length > 0);
  assert.ok(hybridInverters.length > 0);
  assert.ok(microinverters.length > 0);
  for (const product of [...gridInverters, ...hybridInverters]) {
    assert.ok(Array.isArray(product.calculation.available_ac_power_kw));
    assert.ok(product.calculation.available_ac_power_kw.every((value) => value > 0));
  }
  assert.ok(
    microinverters.every(
      (product) =>
        Number.isFinite(product.calculation.apparent_power_min_va) &&
        product.calculation.apparent_power_min_va > 0
    )
  );
});

test('a small residential PV capacity gets the smallest suitable published grid-tied AC variant', () => {
  const recommendation = recommendInverter({ dcCapacityKwp: 0.65 });

  assert.deepEqual(
    {
      technology: recommendation?.technology,
      productId: recommendation?.productId,
      selectedAcPowerKw: recommendation?.selectedAcPowerKw,
      source: recommendation?.source,
      compatibilityStatus: recommendation?.compatibilityStatus
    },
    {
      technology: INVERTER_TECHNOLOGY.GRID_TIED,
      productId: 'solax-x1-mini-g4',
      selectedAcPowerKw: 0.7,
      source: 'equipment-catalog',
      compatibilityStatus: 'preliminary'
    }
  );
});

test('a medium PV capacity is selected from a real grid-tied AC variant after sizing', () => {
  const analysis = buildSolarAnalysis({
    consumption: { annualKwh: 15_000 },
    production: { annualYieldKwhPerKwp: 1_500, source },
    system: getDefaultCalculatorSystem(),
    scenarioTargets: [{ id: 'sized', targetCoverage: 1 }],
    selectedScenarioId: 'sized'
  });
  const recommendation = analysis.inverterRecommendation;

  assert.equal(analysis.selectedScenario.system.capacityKwp, 10.4);
  assert.equal(recommendation?.productId, 'solax-x3-mic-g2');
  assert.equal(recommendation?.selectedAcPowerKw, 12);
  assert.ok(recommendation.selectedAcPowerKw >= analysis.selectedScenario.system.capacityKwp);
});

test('a commercial-size PV capacity selects a published commercial grid-tied variant', () => {
  const recommendation = recommendInverter({ dcCapacityKwp: 45 });

  assert.equal(recommendation?.productId, 'solax-x3-mega-g2');
  assert.equal(recommendation?.selectedAcPowerKw, 50);
  assert.equal(recommendation?.technology, INVERTER_TECHNOLOGY.GRID_TIED);
});

test('an unavailable exact AC size selects the next published catalog variant without a DC/AC rule', () => {
  const recommendation = recommendInverter({ dcCapacityKwp: 4.1 });
  const product = getGridInverters().find((entry) => entry.id === recommendation?.productId);

  assert.equal(recommendation?.selectedAcPowerKw, 4.2);
  assert.notEqual(recommendation?.selectedAcPowerKw, 4.1);
  assert.ok(product?.calculation.available_ac_power_kw.includes(recommendation.selectedAcPowerKw));
  assert.equal(
    recommendation?.reason,
    'SMALLEST_CATALOG_AC_VARIANT_NOT_BELOW_CALCULATED_PV_DC_CAPACITY'
  );
});

test('a real storage requirement is the only condition that switches the recommendation to hybrid', () => {
  const gridOnly = recommendInverter({ dcCapacityKwp: 10.4 });
  const storage = recommendInverter({ dcCapacityKwp: 10.4, storageRequired: true });

  assert.equal(gridOnly?.technology, INVERTER_TECHNOLOGY.GRID_TIED);
  assert.equal(storage?.technology, INVERTER_TECHNOLOGY.HYBRID);
  assert.equal(storage?.productId, 'solax-x1-lite-lv');
  assert.equal(storage?.selectedAcPowerKw, 12);
});

test('recommendations remain preliminary when electrical compatibility evidence is insufficient', () => {
  const recommendation = recommendInverter({ dcCapacityKwp: 10.4 });

  assert.equal(recommendation?.compatibilityStatus, 'preliminary');
  assert.deepEqual(recommendation?.compatibilityLimitations, INVERTER_COMPATIBILITY_LIMITATIONS);
  assert.equal(recommendInverter({ dcCapacityKwp: 351 }), null);
  assert.equal(recommendInverter(), null);
});
