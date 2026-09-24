import assert from 'node:assert/strict';
import test from 'node:test';

import { getMountingSystems } from '../src/data/equipment/calculator/catalog.js';
import {
  MOUNTING_HARDWARE_RECOMMENDATION_STATUS,
  recommendMountingHardware,
  selectPracticalMountingOption
} from '../src/domain/mounting-recommendation.js';

test('an elevated mounting recommendation uses normalized catalog angles and hardware dimensions', () => {
  const mounting = getMountingSystems().find((product) => product.id === 'gck-triangle-2200');
  const recommendation = recommendMountingHardware({
    mountingMode: 'elevated',
    pvgisOptimumTiltDegrees: 27
  });

  assert.deepEqual(mounting.calculation.available_inclination_deg, [20, 30]);
  assert.equal(recommendation?.status, MOUNTING_HARDWARE_RECOMMENDATION_STATUS.MATCHED);
  assert.equal(recommendation?.productId, mounting.id);
  assert.deepEqual(
    recommendation?.availableInclinationDeg,
    mounting.calculation.available_inclination_deg
  );
  assert.equal(recommendation?.pvgisOptimumTiltDegrees, 27);
  assert.equal(recommendation?.practicalInclinationDeg, 30);
  assert.equal(recommendation?.kitLengthMm, mounting.calculation.kit_length_mm);
  assert.equal(recommendation?.railLengthMm, mounting.calculation.rail_length_mm);
  assert.equal(recommendation?.source, 'equipment-catalog');
});

test('roof-parallel mounting does not imply a free-standing hardware recommendation', () => {
  assert.equal(
    recommendMountingHardware({ mountingMode: 'roof-parallel', pvgisOptimumTiltDegrees: 27 }),
    null
  );
});

test('an elevated system reports no catalog match rather than inventing a hardware angle', () => {
  const selected = selectPracticalMountingOption({
    mountingSystems: [],
    pvgisOptimumTiltDegrees: 27
  });
  const recommendation = recommendMountingHardware({
    mountingMode: 'elevated',
    pvgisOptimumTiltDegrees: 27,
    mountingSystems: []
  });

  assert.equal(selected, null);
  assert.equal(recommendation?.status, MOUNTING_HARDWARE_RECOMMENDATION_STATUS.NO_CATALOG_MATCH);
  assert.equal(recommendation?.pvgisOptimumTiltDegrees, 27);
  assert.equal(recommendation?.practicalInclinationDeg, undefined);
});
