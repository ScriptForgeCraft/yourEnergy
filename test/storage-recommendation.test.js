import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getBatteries,
  getCommercialEss,
  getResidentialEss
} from '../src/data/equipment/calculator/catalog.js';
import { getDefaultCalculatorSystem } from '../src/data/equipment/calculator/defaults.js';
import { buildSolarAnalysis } from '../src/domain/index.js';
import {
  STORAGE_COMPATIBILITY_LIMITATIONS,
  STORAGE_RECOMMENDATION_STATUS,
  STORAGE_TECHNOLOGY,
  recommendStorage
} from '../src/domain/storage-recommendation.js';

const source = { kind: 'provider', status: 'confirmed', provider: 'PVGIS fixture' };

test('catalog storage categories retain normalized capacity fields without parsing display labels', () => {
  const modularBattery = getBatteries().find((product) => product.id === 'solax-t-bat-sys-lv-d53');

  assert.equal(getBatteries().length, 4);
  assert.equal(getResidentialEss().length, 2);
  assert.equal(getCommercialEss().length, 2);
  assert.deepEqual(
    {
      capacityMinKwh: modularBattery.calculation.capacity_min_kwh,
      capacityMaxKwh: modularBattery.calculation.capacity_max_kwh,
      moduleNominalCapacityKwh: modularBattery.calculation.module_nominal_capacity_kwh,
      systemNominalCapacityMaxKwh: modularBattery.calculation.system_nominal_capacity_max_kwh,
      systemUsableCapacityMaxKwh: modularBattery.calculation.system_usable_capacity_max_kwh
    },
    {
      capacityMinKwh: 5.3,
      capacityMaxKwh: 85.1,
      moduleNominalCapacityKwh: 5.3,
      systemNominalCapacityMaxKwh: 85.1,
      systemUsableCapacityMaxKwh: 76.6
    }
  );
});

test('a normal grid-tied scenario has no battery recommendation', () => {
  const analysis = buildSolarAnalysis({
    consumption: { annualKwh: 9_000 },
    production: { annualYieldKwhPerKwp: 1_000, source },
    system: getDefaultCalculatorSystem(),
    scenarioTargets: [{ id: 'grid-only', targetCoverage: 1 }],
    selectedScenarioId: 'grid-only'
  });

  assert.equal(recommendStorage(), null);
  assert.equal(analysis.storageRecommendation, null);
});

test('an explicit storage request without a complete load profile remains optional and preliminary', () => {
  const recommendation = recommendStorage({ storageRequired: true });

  assert.deepEqual(
    {
      status: recommendation?.status,
      storageOptional: recommendation?.storageOptional,
      technology: recommendation?.technology,
      reason: recommendation?.reason,
      compatibilityStatus: recommendation?.compatibilityStatus
    },
    {
      status: STORAGE_RECOMMENDATION_STATUS.PROFILE_REQUIRED,
      storageOptional: true,
      technology: null,
      reason: 'EXACT_BATTERY_SIZING_REQUIRES_CRITICAL_LOAD_AND_BACKUP_DURATION',
      compatibilityStatus: 'preliminary'
    }
  );
  assert.deepEqual(recommendation?.compatibilityLimitations, STORAGE_COMPATIBILITY_LIMITATIONS);
});

test('a partial backup request does not manufacture missing load-profile data', () => {
  const recommendation = recommendStorage({ storageRequired: true, criticalLoadPowerKw: 2 });

  assert.equal(recommendation?.status, STORAGE_RECOMMENDATION_STATUS.PROFILE_REQUIRED);
  assert.equal(recommendation?.productId, undefined);
});

test('explicit critical load and backup duration produce a whole-module battery recommendation', () => {
  const recommendation = recommendStorage({
    storageRequired: true,
    criticalLoadPowerKw: 2,
    backupDurationHours: 5
  });

  assert.equal(recommendation?.status, STORAGE_RECOMMENDATION_STATUS.SIZED);
  assert.equal(recommendation?.technology, STORAGE_TECHNOLOGY.BATTERY_MODULE);
  assert.equal(recommendation?.productId, 'solax-t-bat-sys-lv-d53');
  assert.equal(recommendation?.requiredUsableCapacityKwh, 10);
  assert.equal(recommendation?.moduleCount, 3);
  assert.equal(recommendation?.minimumModuleCount, 1);
  assert.equal(recommendation?.capacityMinKwh, 5.3);
  assert.equal(recommendation?.capacityMaxKwh, 85.1);
  assert.equal(recommendation?.moduleNominalCapacityKwh, 5.3);
  assert.equal(recommendation?.selectedNominalCapacityKwh, 15.9);
  assert.equal(recommendation?.selectedUsableCapacityKwh, 14.3625);
  assert.ok(recommendation.selectedUsableCapacityKwh >= recommendation.requiredUsableCapacityKwh);
  assert.ok(Number.isInteger(recommendation.moduleCount));
  assert.equal(recommendation?.source, 'equipment-catalog');
});

test('modular sizing rounds the usable-capacity requirement up instead of recommending a fractional module', () => {
  const recommendation = recommendStorage({
    storageRequired: true,
    criticalLoadPowerKw: 1,
    backupDurationHours: 4.79
  });

  assert.equal(recommendation?.requiredUsableCapacityKwh, 4.79);
  assert.equal(recommendation?.moduleCount, 2);
  assert.ok(recommendation.selectedUsableCapacityKwh >= 4.79);
});

test('storage sizing respects the published maximum modular system capacity', () => {
  const recommendation = recommendStorage({
    storageRequired: true,
    criticalLoadPowerKw: 10,
    backupDurationHours: 8
  });

  assert.equal(recommendation?.status, STORAGE_RECOMMENDATION_STATUS.CATALOG_CAPACITY_EXCEEDED);
  assert.equal(recommendation?.requiredUsableCapacityKwh, 80);
  assert.equal(recommendation?.maximumModuleCount, 16);
  assert.equal(recommendation?.systemUsableCapacityMaxKwh, 76.6);
  assert.equal(recommendation?.productId, 'solax-t-bat-sys-lv-d53');
});

test('sizing is attached only when a caller provides explicit storage inputs', () => {
  const analysis = buildSolarAnalysis({
    consumption: { annualKwh: 9_000 },
    production: { annualYieldKwhPerKwp: 1_000, source },
    system: getDefaultCalculatorSystem(),
    storageRequired: true,
    storage: { criticalLoadPowerKw: 2, backupDurationHours: 5 },
    scenarioTargets: [{ id: 'backup', targetCoverage: 1 }],
    selectedScenarioId: 'backup'
  });

  assert.equal(analysis.storageRecommendation?.status, STORAGE_RECOMMENDATION_STATUS.SIZED);
  assert.equal(analysis.storageRecommendation?.moduleCount, 3);
  assert.equal(analysis.storageRecommendation?.technology, STORAGE_TECHNOLOGY.BATTERY_MODULE);
});
