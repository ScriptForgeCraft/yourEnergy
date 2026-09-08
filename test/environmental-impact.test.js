import assert from 'node:assert/strict';
import test from 'node:test';

import { ARMENIA_GRID_CO2_FACTOR } from '../src/data/environment/armenia-grid-co2.js';
import { EPA_URBAN_TREE_CO2_EQUIVALENCY } from '../src/data/environment/epa-tree-co2-equivalence.js';
import { buildEnvironmentalImpact } from '../src/domain/environment.js';

test('the verified historical Armenia factor uses the documented 2022 value without claiming it is current', () => {
  const impact = buildEnvironmentalImpact({
    annualGenerationKwh: 8_420,
    gridEmissionFactor: ARMENIA_GRID_CO2_FACTOR,
    treeEquivalency: EPA_URBAN_TREE_CO2_EQUIVALENCY,
    at: '2026-09-07'
  });
  assert.equal(impact.factor.status, 'verified-historical');
  assert.equal(impact.factor.dataYear, 2022);
  assert.equal(impact.factor.valueKgCo2PerKwh, 0.183);
  assert.equal(impact.avoidedCo2Tons, 1.541);
  assert.equal(impact.treeEquivalency.metricTonsCo2PerTreePerYear, 0.06);
  assert.equal(impact.treeEquivalent, 25.683);
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
