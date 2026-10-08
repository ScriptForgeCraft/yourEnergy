import assert from 'node:assert/strict';
import test from 'node:test';

import { buildHeroQuickAnalysisRequest } from '../src/ui/hero-quick-calculator.js';

test('Hero calculator uses the same Quick API contract with the standard tariff by default', () => {
  const result = buildHeroQuickAnalysisRequest({
    regionId: 'yerevan',
    averageMonthlyKwh: '450',
    effectiveRateAmdPerKwh: ''
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.payload, {
    regionId: 'yerevan',
    consumption: { averageMonthlyKwh: 450 },
    financialRate: { sourceType: 'automatic-standard-residential' }
  });
  assert.deepEqual(result.state.consumption, { mode: 'usage', averageMonthlyKwh: 450 });
});

test('Hero calculator forwards a supplied effective tariff and rejects invalid compact inputs', () => {
  const custom = buildHeroQuickAnalysisRequest({
    regionId: 'yerevan',
    averageMonthlyKwh: '450',
    effectiveRateAmdPerKwh: '45.5'
  });
  assert.equal(custom.valid, true);
  assert.deepEqual(custom.payload.financialRate, {
    sourceType: 'user-provided-effective-rate',
    effectiveRateAmdPerKwh: 45.5
  });

  assert.deepEqual(buildHeroQuickAnalysisRequest({ regionId: 'yerevan', averageMonthlyKwh: '0' }), {
    valid: false,
    issue: 'consumption'
  });
  assert.deepEqual(
    buildHeroQuickAnalysisRequest({
      regionId: 'yerevan',
      averageMonthlyKwh: '450',
      effectiveRateAmdPerKwh: '-1'
    }),
    { valid: false, issue: 'tariff' }
  );
});
