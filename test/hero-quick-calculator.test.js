import assert from 'node:assert/strict';
import test from 'node:test';

import { buildHeroQuickAnalysisRequest } from '../src/ui/hero-quick-calculator.js';

test('Hero calculator uses bill AMD and kWh from the same bill to derive an effective rate', () => {
  const result = buildHeroQuickAnalysisRequest({
    regionId: 'yerevan',
    averageMonthlyBillAmd: '25 000',
    billedKwh: '450'
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.payload, {
    regionId: 'yerevan',
    consumption: { averageMonthlyBillAmd: 25_000, billedKwh: 450 },
    financialRate: { sourceType: 'bill-derived-effective-rate' }
  });
  assert.deepEqual(result.state.consumption, {
    mode: 'bill',
    averageMonthlyBillAmd: 25_000,
    billedKwh: 450
  });
});

test('Hero calculator also accepts either available bill value and rejects invalid inputs', () => {
  const usageOnly = buildHeroQuickAnalysisRequest({
    regionId: 'yerevan',
    billedKwh: '450'
  });
  assert.equal(usageOnly.valid, true);
  assert.deepEqual(usageOnly.payload, {
    regionId: 'yerevan',
    consumption: { averageMonthlyKwh: 450 },
    financialRate: { sourceType: 'automatic-standard-residential' }
  });

  assert.deepEqual(buildHeroQuickAnalysisRequest({ regionId: 'yerevan', billedKwh: '0' }), {
    valid: false,
    issue: 'consumption'
  });
  assert.deepEqual(
    buildHeroQuickAnalysisRequest({
      regionId: 'yerevan',
      averageMonthlyBillAmd: '-1',
      billedKwh: '450'
    }),
    { valid: false, issue: 'bill' }
  );
});
