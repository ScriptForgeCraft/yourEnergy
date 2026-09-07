import assert from 'node:assert/strict';
import test from 'node:test';

import { ARMENIA_GRID_CO2_FACTOR } from '../src/data/environment/armenia-grid-co2.js';
import { buildEnvironmentalImpact } from '../src/domain/environment.js';

test('unverified Armenia factor never creates a CO₂ figure', () => {
  const impact = buildEnvironmentalImpact({
    annualGenerationKwh: 8_420,
    gridEmissionFactor: ARMENIA_GRID_CO2_FACTOR,
    at: '2026-09-07'
  });
  assert.equal(impact.factor.status, 'unavailable');
  assert.equal(impact.factor.valueKgCo2PerKwh, null);
  assert.equal(impact.avoidedCo2Tons, null);
});

test('a verified, dated factor is calculated by the domain layer, not by Hero UI', () => {
  const impact = buildEnvironmentalImpact({
    annualGenerationKwh: 8_420,
    gridEmissionFactor: {
      id: 'armenia-grid-co2',
      version: 'v1.0',
      status: 'verified',
      valueKgCo2PerKwh: 0.214,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      effectiveTo: '2026-12-31T23:59:59.000Z',
      sourceUrl: 'https://example.test/grid-factor',
      verifiedAt: '2026-08-31T00:00:00.000Z'
    },
    at: '2026-09-07T00:00:00.000Z'
  });
  assert.equal(impact.factor.status, 'verified');
  assert.equal(impact.avoidedCo2Tons, 1.802);
});
