import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSolutionsPresentation, buildSolutionsStartState } from '../src/ui/solutions-story.js';
import { createCalculatorSession } from '../src/ui/calculator-session.js';

const analysis = {
  production: { annualYieldKwhPerKwp: 1500, source: { provider: 'PVGIS' } },
  selectedScenario: {
    system: { capacityKwp: 10.4, panelCount: 16 },
    generation: { annualKwh: 15600 }
  }
};

test('Stage 01 presents completed results and never coerces missing metrics to zero', () => {
  assert.deepEqual(buildSolutionsPresentation(analysis, { status: 'complete' }), {
    hasResult: true,
    solarResource: 1500,
    source: 'PVGIS',
    systemSize: 10.4,
    panelCount: 16,
    annualProduction: 15600
  });
  for (const status of ['idle', 'loading', 'unavailable']) {
    assert.equal(buildSolutionsPresentation(analysis, { status }).annualProduction, null);
  }
  assert.equal(
    buildSolutionsPresentation({ selectedScenario: {} }, { status: 'complete' }).panelCount,
    null
  );
  assert.equal(buildSolutionsPresentation(null, { status: 'complete' }).hasResult, false);
});

test('Stage 01 validates input and hands bill/kWh values to the existing CalculatorSession', () => {
  let saved = null;
  const session = createCalculatorSession({
    storage: {
      getItem: () => saved,
      setItem: (_, value) => {
        saved = value;
      }
    }
  });
  for (const [mode, field] of [
    ['bill', 'averageMonthlyBillAmd'],
    ['usage', 'averageMonthlyKwh']
  ]) {
    const next = buildSolutionsStartState(
      { regionId: 'yerevan', mode, amount: '350' },
      session.read()
    );
    session.write(next);
    assert.equal(session.read().regionId, 'yerevan');
    assert.deepEqual(session.read().consumption, { mode, [field]: 350 });
    assert.equal(session.read().analysisStatus, 'idle');
  }
  for (const amount of ['', null, -1, 0, 'no', Infinity]) {
    assert.equal(buildSolutionsStartState({ regionId: 'yerevan', mode: 'bill', amount }), null);
  }
  assert.equal(buildSolutionsStartState({ regionId: 'invalid', mode: 'bill', amount: 100 }), null);
});

test('editing the starting context invalidates results, changing region also clears the old roof', () => {
  const previous = {
    regionId: 'yerevan',
    consumption: { mode: 'usage', averageMonthlyKwh: 350 },
    analysis,
    quickAnalysis: analysis,
    analysisStatus: 'complete',
    roof: { areaSqm: 80 },
    userTariff: { rateAmdPerKwh: 50 }
  };
  const unchanged = buildSolutionsStartState(
    { regionId: 'yerevan', mode: 'usage', amount: 350 },
    previous
  );
  assert.equal('analysis' in unchanged, false);
  const changed = buildSolutionsStartState(
    { regionId: 'yerevan', mode: 'usage', amount: 500 },
    previous
  );
  assert.equal(changed.analysis, null);
  assert.equal(changed.quickAnalysis, null);
  assert.equal('roof' in changed, false);
  const moved = buildSolutionsStartState(
    { regionId: 'lori', mode: 'usage', amount: 500 },
    previous
  );
  assert.equal(moved.roof, null);
  assert.equal(moved.property, null);
  assert.equal(moved.userTariff, null);
});
