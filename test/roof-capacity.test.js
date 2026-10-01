import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PRELIMINARY_ELEVATED_GROUND_COVERAGE_RATIO,
  PRELIMINARY_USABLE_ROOF_RATIO,
  calculatePreliminaryRoofCapacity
} from '../src/domain/index.js';
import { getDefaultCalculatorSystem } from '../src/data/equipment/calculator/defaults.js';

test('the Professional roof preview and analysis share catalog module fit', () => {
  const system = getDefaultCalculatorSystem();
  const capacity = calculatePreliminaryRoofCapacity({
    roofAreaSqm: 26.1,
    usableAreaRatio: PRELIMINARY_USABLE_ROOF_RATIO,
    panelAreaSqm: system.panelAreaSqm,
    panelWatts: system.panelWatts
  });

  assert.deepEqual(capacity, {
    roofAreaSqm: 26.1,
    usableAreaRatio: 0.7,
    usableRoofAreaSqm: 18.27,
    maximumPanelCount: 6,
    maximumCapacityKwp: 3.9
  });
});

test('roof fit remains unavailable for incomplete or invalid technical input', () => {
  assert.equal(
    calculatePreliminaryRoofCapacity({
      roofAreaSqm: 26.1,
      usableAreaRatio: PRELIMINARY_USABLE_ROOF_RATIO,
      panelAreaSqm: 0,
      panelWatts: 650
    }),
    null
  );
});

test('elevated arrays use plan area and conservative row spacing rather than roof-slope area', () => {
  const system = getDefaultCalculatorSystem();
  const elevated = calculatePreliminaryRoofCapacity({
    roofAreaSqm: 115.47,
    projectedRoofAreaSqm: 100,
    areaMethod: 'map-projected',
    mountingMode: 'elevated',
    tiltDegrees: 30,
    usableAreaRatio: PRELIMINARY_USABLE_ROOF_RATIO,
    panelAreaSqm: system.panelAreaSqm,
    panelWatts: system.panelWatts
  });
  const roofParallel = calculatePreliminaryRoofCapacity({
    roofAreaSqm: 115.47,
    usableAreaRatio: PRELIMINARY_USABLE_ROOF_RATIO,
    panelAreaSqm: system.panelAreaSqm,
    panelWatts: system.panelWatts
  });

  assert.equal(elevated.usableAreaRatio, PRELIMINARY_ELEVATED_GROUND_COVERAGE_RATIO);
  assert.equal(elevated.roofAreaSqm, 100);
  assert.ok(elevated.panelFootprintSqm < system.panelAreaSqm);
  assert.ok(elevated.maximumPanelCount < roofParallel.maximumPanelCount);
});
