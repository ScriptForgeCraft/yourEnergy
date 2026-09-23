import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  createCalculatorEquipmentCatalog,
  getBatteries,
  getCommercialEss,
  getEquipment,
  getEquipmentByCategory,
  getEquipmentById,
  getEquipmentCatalogValidation,
  getEquipmentCategories,
  getEvChargers,
  getGridInverters,
  getHybridInverters,
  getMicroinverters,
  getMountingSystems,
  getResidentialEss,
  getSolarPanels
} from '../src/data/equipment/calculator-catalog.js';

const sourceProducts = JSON.parse(
  await readFile(
    new URL('../data/equipment/yourenergy-equipment-calculator.json', import.meta.url),
    'utf8'
  )
);

test('the calculation catalogue loads all source records through one adapter', () => {
  assert.equal(getEquipment().length, sourceProducts.length);
  assert.equal(getEquipmentCatalogValidation().totalRecords, sourceProducts.length);
  assert.equal(getEquipmentCatalogValidation().calculationReadyRecords, sourceProducts.length);
  assert.deepEqual(getEquipmentCatalogValidation().duplicateIds, []);
  assert.deepEqual(getEquipmentCatalogValidation().records, []);
});

test('the adapter looks up stable IDs and filters every calculation category', () => {
  const panel = getEquipmentById('longi-hi-mo-x10-guardian-lr7-72hvdf');
  assert.equal(panel?.calculation.panelWatts, 650);
  assert.equal(panel?.calculation.panelAreaSqm, 2.701188);
  assert.equal(getEquipmentById('not-a-product'), null);

  assert.deepEqual(getEquipmentCategories(), [
    'solar-panels',
    'inverters',
    'batteries',
    'mounting',
    'grid-inverters',
    'microinverters',
    'ev-chargers',
    'home-ess',
    'commercial-ess'
  ]);
  assert.equal(getEquipmentByCategory('solar-panels').length, 3);
  assert.equal(getSolarPanels().length, 3);
  assert.equal(getGridInverters().length, 8);
  assert.equal(getHybridInverters().length, 5);
  assert.equal(getMicroinverters().length, 2);
  assert.equal(getBatteries().length, 4);
  assert.equal(getResidentialEss().length, 2);
  assert.equal(getCommercialEss().length, 2);
  assert.equal(getMountingSystems().length, 1);
  assert.equal(getEvChargers().length, 1);
});

test('invalid calculation values are removed and incomplete display records stay available', () => {
  const catalog = createCalculatorEquipmentCatalog([
    {
      id: 'display-only-panel',
      category: 'solar-panels',
      brand: 'Example',
      calculation: {
        panelWatts: 650,
        panelAreaSqm: 0,
        series_max_efficiency_percent: 101
      }
    },
    {
      id: 'invalid-mounting',
      category: 'mounting',
      calculation: { available_inclination_deg: [20, 95] }
    },
    {
      id: 'valid-battery',
      category: 'batteries',
      calculation: { capacity_min_kwh: 5, capacity_max_kwh: 10 }
    }
  ]);

  assert.equal(catalog.getEquipment().length, 3);
  assert.equal(catalog.getEquipmentById('display-only-panel')?.calculation.panelAreaSqm, undefined);
  assert.equal(
    catalog.getEquipmentById('display-only-panel')?.calculation.series_max_efficiency_percent,
    undefined
  );
  assert.equal(catalog.getSolarPanels().length, 0);
  assert.equal(catalog.getMountingSystems().length, 0);
  assert.equal(catalog.getBatteries().length, 1);
  assert.ok(
    catalog
      .getValidation()
      .records.find(({ id }) => id === 'display-only-panel')
      ?.issues.some(({ field }) => field === 'panelAreaSqm')
  );
});

test('duplicate IDs and malformed records do not crash catalogue access', () => {
  const catalog = createCalculatorEquipmentCatalog([
    {
      id: 'duplicate-panel',
      category: 'solar-panels',
      calculation: { panelWatts: 650, panelAreaSqm: 2.7 }
    },
    {
      id: 'duplicate-panel',
      category: 'solar-panels',
      calculation: { panelWatts: 650, panelAreaSqm: 2.7 }
    },
    {
      id: 'incomplete-inverter',
      category: 'grid-inverters',
      calculation: { ac_power_min_kw: 5, ac_power_max_kw: 0 }
    },
    null
  ]);

  assert.equal(catalog.getEquipment().length, 3);
  assert.equal(catalog.getEquipmentById('duplicate-panel'), null);
  assert.equal(catalog.getSolarPanels().length, 0);
  assert.equal(catalog.getGridInverters().length, 0);
  assert.deepEqual(catalog.getValidation().duplicateIds, ['duplicate-panel']);
  assert.ok(catalog.getValidation().records.some(({ index }) => index === 3));
});
