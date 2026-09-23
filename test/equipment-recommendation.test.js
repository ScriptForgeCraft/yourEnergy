import assert from 'node:assert/strict';
import test from 'node:test';

import { getSolarPanelById } from '../src/data/equipment/calculator-catalog.js';
import { getDefaultCalculatorSystem } from '../src/data/equipment/calculator-defaults.js';
import { buildEquipmentRecommendation, buildSolarAnalysis } from '../src/domain/index.js';

const source = { kind: 'provider', status: 'confirmed', provider: 'PVGIS fixture' };

const analysisFor = (input = {}) =>
  buildSolarAnalysis({
    consumption: { annualKwh: 9_000 },
    production: { annualYieldKwhPerKwp: 1_000, source },
    system: getDefaultCalculatorSystem(),
    scenarioTargets: [{ id: 'sized', targetCoverage: 1 }],
    selectedScenarioId: 'sized',
    ...input
  });

test('final equipment recommendation resolves a calculated module, footprint and real inverter from the catalog', () => {
  const analysis = analysisFor();
  const recommendation = analysis.equipmentRecommendation;
  const panel = getSolarPanelById(getDefaultCalculatorSystem().equipment.panelId);

  assert.equal(recommendation?.source, 'equipment-catalog');
  assert.equal(recommendation?.solarModule?.productId, panel.id);
  assert.equal(recommendation?.solarModule?.quantity, analysis.selectedScenario.system.panelCount);
  assert.equal(recommendation?.solarModule?.watts, panel.calculation.panelWatts);
  assert.equal(
    recommendation?.solarModule?.totalDcCapacityKwp,
    (analysis.selectedScenario.system.panelCount * panel.calculation.panelWatts) / 1000
  );
  assert.equal(recommendation?.solarModule?.physicalModuleAreaSqm, panel.calculation.panelAreaSqm);
  assert.equal(
    recommendation?.solarModule?.totalModuleFootprintSqm,
    analysis.selectedScenario.system.panelCount * panel.calculation.panelAreaSqm
  );
  assert.equal(
    recommendation?.solarModule?.reason,
    'CATALOG_MODULE_COUNT_AND_RATING_MATCH_CALCULATED_DC_CAPACITY'
  );
  assert.equal(recommendation?.inverter?.productId, analysis.inverterRecommendation.productId);
  assert.equal(
    recommendation?.inverter?.selectedAcPowerKw,
    analysis.inverterRecommendation.selectedAcPowerKw
  );
  assert.ok(
    recommendation?.inverter?.selectedAcPowerKw >= recommendation?.inverter?.requiredDcCapacityKwp
  );
});

test('a roof-limited project recommends the actual roof-fit module quantity rather than the requested capacity', () => {
  const analysis = analysisFor({
    consumption: { annualKwh: 50_000 },
    roof: { areaSqm: 30, usableAreaRatio: 0.7, mountingMode: 'roof-parallel' }
  });
  const recommendation = analysis.equipmentRecommendation?.solarModule;

  assert.ok(analysis.selectedScenario.limitations.includes('ROOF_CAPACITY_LIMIT'));
  assert.equal(recommendation?.quantity, analysis.selectedScenario.system.panelCount);
  assert.equal(recommendation?.totalDcCapacityKwp, analysis.selectedScenario.system.capacityKwp);
  assert.ok(
    recommendation.totalDcCapacityKwp < analysis.selectedScenario.system.requestedCapacityKwp
  );
  assert.equal(analysis.equipmentRecommendation?.mounting, null);
});

test('an elevated project shows only a catalog-supported practical mounting option', () => {
  const analysis = analysisFor({
    roof: { mountingMode: 'elevated' },
    mountingRecommendation: {
      basis: 'pvgis-fixed-free-standing-optimum',
      tiltDegrees: 27
    }
  });
  const mounting = analysis.equipmentRecommendation?.mounting;

  assert.equal(mounting?.productId, 'gck-triangle-2200');
  assert.equal(mounting?.installationType, 'elevated');
  assert.deepEqual(mounting?.availableInclinationDeg, [20, 30]);
  assert.equal(mounting?.practicalInclinationDeg, 30);
  assert.equal(mounting?.reason, 'CATALOG_INCLINATION_NEAREST_TO_PVGIS_OPTIMUM');
});

test('storage is absent for a grid-only project and reports only a real whole-module option when backup inputs exist', () => {
  const gridOnly = analysisFor();
  const storage = analysisFor({
    storageRequired: true,
    storage: { criticalLoadPowerKw: 2, backupDurationHours: 5 }
  }).equipmentRecommendation?.storage;

  assert.equal(gridOnly.equipmentRecommendation?.storage, null);
  assert.equal(storage?.productId, 'solax-t-bat-sys-lv-d53');
  assert.equal(storage?.moduleCount, 3);
  assert.equal(storage?.selectedUsableCapacityKwh, 14.3625);
  assert.equal(
    storage?.reason,
    'WHOLE_CATALOG_BATTERY_MODULE_COUNT_COVERS_REQUIRED_USABLE_CAPACITY'
  );
});

test('a malformed or unverified equipment reference is suppressed instead of crashing or creating a store dump', () => {
  const recommendation = buildEquipmentRecommendation({
    selectedScenario: {
      system: {
        panelCount: 10,
        equipment: { panelId: 'missing-product' }
      }
    },
    inverterRecommendation: {
      productId: 'solax-hyper-ev-charger',
      selectedAcPowerKw: 7.2,
      technology: 'grid-tied'
    }
  });

  assert.equal(recommendation, null);
});
