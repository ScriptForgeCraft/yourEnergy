import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PRELIMINARY_ELEVATED_LIMIT_PROFILE_ANGLE_DEGREES,
  PRELIMINARY_USABLE_ROOF_RATIO,
  calculateElevatedSingleDirectionRowGcr,
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

test('elevated single-direction GCR follows the stated 20 degree limit-angle geometry', () => {
  assert.equal(PRELIMINARY_ELEVATED_LIMIT_PROFILE_ANGLE_DEGREES, 20);
  const fixtures = new Map([
    [5, 0.809],
    [10, 0.684],
    [15, 0.596],
    [20, 0.532],
    [30, 0.446],
    [35, 0.418],
    [40, 0.395],
    [70, 0.342],
    [90, 0.342]
  ]);
  let previous = Infinity;
  for (const [tilt, expected] of fixtures) {
    const gcr = calculateElevatedSingleDirectionRowGcr({ arrayTiltDegrees: tilt });
    assert.ok(gcr !== null);
    assert.ok(Math.abs(gcr - expected) < 0.002, `${tilt}°: ${gcr}`);
    assert.ok(gcr <= previous, `${tilt}° must not increase GCR`);
    previous = gcr;
  }
  assert.ok(
    Math.abs(calculateElevatedSingleDirectionRowGcr({ arrayTiltDegrees: 30 }) - 0.45) < 0.01
  );
});

test('elevated capacity uses plan area times dynamic GCR without a cos-tilt footprint', () => {
  const system = getDefaultCalculatorSystem();
  const capacityAt = (arrayTiltDegrees) =>
    calculatePreliminaryRoofCapacity({
      roofAreaSqm: 100,
      projectedRoofAreaSqm: 100,
      areaMethod: 'map-projected',
      mountingMode: 'elevated',
      roofTiltDegrees: 0,
      arrayTiltDegrees,
      panelAreaSqm: system.panelAreaSqm,
      panelWatts: system.panelWatts
    });
  const ten = capacityAt(10);
  const twenty = capacityAt(20);
  const thirty = capacityAt(30);
  assert.equal(thirty.roofAreaSqm, 100);
  assert.equal(thirty.panelFootprintSqm, system.panelAreaSqm);
  assert.ok(Math.abs(thirty.layoutGcr - 0.446) < 0.002);
  assert.ok(twenty.maximumPanelCount > thirty.maximumPanelCount);
  assert.ok(ten.maximumPanelCount > twenty.maximumPanelCount);
  assert.ok(capacityAt(70).maximumPanelCount < thirty.maximumPanelCount);
});

test('elevated arrays on a sloped roof do not manufacture a panel limit', () => {
  const system = getDefaultCalculatorSystem();
  assert.equal(
    calculatePreliminaryRoofCapacity({
      roofAreaSqm: 100,
      areaMethod: 'measured-plane',
      mountingMode: 'elevated',
      roofTiltDegrees: 5,
      arrayTiltDegrees: 20,
      panelAreaSqm: system.panelAreaSqm,
      panelWatts: system.panelWatts
    }),
    null
  );
});

test('roof-parallel capacity remains independent of panel tilt', () => {
  const system = getDefaultCalculatorSystem();
  const panelCounts = [20, 30, 45, 60, 70].map(
    (arrayTiltDegrees) =>
      calculatePreliminaryRoofCapacity({
        roofAreaSqm: 50,
        areaMethod: 'measured-plane',
        mountingMode: 'roof-parallel',
        arrayTiltDegrees,
        usableAreaRatio: PRELIMINARY_USABLE_ROOF_RATIO,
        panelAreaSqm: system.panelAreaSqm,
        panelWatts: system.panelWatts
      }).maximumPanelCount
  );
  assert.equal(new Set(panelCounts).size, 1);
});
