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
  assert.equal(elevated.panelFootprintSqm, system.panelAreaSqm);
  assert.ok(elevated.maximumPanelCount < roofParallel.maximumPanelCount);
});

test('elevated capacity never gains panels solely from a steeper panel tilt', () => {
  const system = getDefaultCalculatorSystem();
  const tilts = [20, 30, 45, 60, 70];
  const roofVariants = [
    {
      name: 'map-projected roof',
      roofAreaSqm: 57.735,
      projectedRoofAreaSqm: 50,
      areaMethod: 'map-projected'
    },
    {
      name: 'measured plane-area roof',
      roofAreaSqm: 50,
      areaMethod: 'measured-plane'
    }
  ];

  for (const roof of roofVariants) {
    const capacities = tilts.map((tiltDegrees) =>
      calculatePreliminaryRoofCapacity({
        ...roof,
        mountingMode: 'elevated',
        tiltDegrees,
        panelAreaSqm: system.panelAreaSqm,
        panelWatts: system.panelWatts
      })
    );
    const panelCounts = capacities.map(({ maximumPanelCount }) => maximumPanelCount);

    assert.equal(new Set(panelCounts).size, 1, roof.name);
    assert.equal(panelCounts.at(-1), panelCounts[1], `${roof.name}: 70° must not exceed 30°`);
    assert.ok(
      capacities.every(({ panelFootprintSqm }) => panelFootprintSqm === system.panelAreaSqm),
      roof.name
    );
  }
});

test('roof-parallel capacity remains independent of panel tilt', () => {
  const system = getDefaultCalculatorSystem();
  const panelCounts = [20, 30, 45, 60, 70].map(
    (tiltDegrees) =>
      calculatePreliminaryRoofCapacity({
        roofAreaSqm: 50,
        areaMethod: 'measured-plane',
        mountingMode: 'roof-parallel',
        tiltDegrees,
        usableAreaRatio: PRELIMINARY_USABLE_ROOF_RATIO,
        panelAreaSqm: system.panelAreaSqm,
        panelWatts: system.panelWatts
      }).maximumPanelCount
  );

  assert.equal(new Set(panelCounts).size, 1);
});
