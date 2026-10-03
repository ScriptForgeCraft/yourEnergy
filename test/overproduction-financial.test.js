import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateSolarScenario,
  createUserTariffSelection,
  selectEffectiveSurplusCompensation
} from '../src/domain/index.js';

const EFFECTIVE_DATE = '2026-09-23';
const retailTariff = createUserTariffSelection({ rateAmdPerKwh: 50 }, EFFECTIVE_DATE);

const TEST_SURPLUS_COMPENSATION_DATASET = Object.freeze({
  id: 'test-surplus-compensation',
  schemaVersion: '1.0.0',
  revision: 'test-v1',
  countryCode: 'AM',
  currency: 'AMD',
  reviewedAt: EFFECTIVE_DATE,
  source: {
    kind: 'registry',
    status: 'confirmed',
    provider: 'Test regulator',
    reference: 'test://surplus-compensation',
    verifiedAt: EFFECTIVE_DATE
  },
  records: [
    {
      id: 'test-surplus-rate',
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
      status: 'confirmed',
      rateAmdPerKwh: 20,
      currency: 'AMD',
      source: {
        kind: 'registry',
        status: 'confirmed',
        provider: 'Test regulator',
        reference: 'test://surplus-compensation/2026',
        verifiedAt: EFFECTIVE_DATE
      }
    }
  ]
});

const scenario = ({
  annualConsumptionKwh = 1_000,
  annualYieldKwhPerKwp = 1_000,
  targetCoverage = 1,
  panelWatts = null,
  monthlyConsumptionKwh = null,
  monthlyYieldFactors = null,
  surplusCompensation
} = {}) =>
  calculateSolarScenario({
    id: 'overproduction-test',
    targetCoverage,
    consumption:
      monthlyConsumptionKwh === null
        ? { annualKwh: annualConsumptionKwh }
        : { monthlyKwh: monthlyConsumptionKwh },
    roof: {},
    production: { annualYieldKwhPerKwp, monthlyYieldFactors },
    tariff: retailTariff,
    surplusCompensation,
    investment: { capexAmdPerKwp: 100_000 },
    system: panelWatts === null ? {} : { panelWatts, panelAreaSqm: 2 },
    effectiveDate: EFFECTIVE_DATE
  });

test('generation below consumption values only retail-offset energy', () => {
  const result = scenario({ targetCoverage: 0.5 });

  assert.deepEqual(result.energyBalance, {
    annualConsumptionKwh: 1_000,
    annualGenerationKwh: 500,
    offsetEnergyKwh: 500,
    surplusEnergyKwh: 0
  });
  assert.equal(result.financial.retailOffsetValueAmd, 25_000);
  assert.equal(result.financial.surplusCompensationValueAmd, 0);
  assert.equal(result.financial.annualEconomicValueAmd, 25_000);
  assert.equal(result.financial.annualSavingsAmd, 25_000);
});

test('generation equal to consumption has zero surplus and keeps a complete financial result', () => {
  const result = scenario();

  assert.equal(result.energyBalance.offsetEnergyKwh, 1_000);
  assert.equal(result.energyBalance.surplusEnergyKwh, 0);
  assert.equal(result.financial.retailOffsetValueAmd, 50_000);
  assert.equal(result.financial.surplusCompensationValueAmd, 0);
  assert.equal(result.financial.annualEconomicValueAmd, 50_000);
  assert.equal(result.financial.paybackYears, 2);
});

test('generation above consumption never values unconfigured surplus at the retail tariff', () => {
  const result = scenario({ panelWatts: 600 });

  assert.deepEqual(result.energyBalance, {
    annualConsumptionKwh: 1_000,
    annualGenerationKwh: 1_200,
    offsetEnergyKwh: 1_000,
    surplusEnergyKwh: 200
  });
  assert.equal(result.financial.retailOffsetValueAmd, 50_000);
  assert.equal(result.financial.surplusCompensationValueAmd, null);
  assert.equal(result.financial.annualEconomicValueAmd, null);
  assert.equal(result.financial.annualSavingsAmd, null);
  assert.equal(result.financial.paybackYears, null);
  assert.equal(result.coveragePercent, 100);
  assert.equal(result.financial.surplusCompensation.reason, 'SURPLUS_COMPENSATION_NOT_CONFIGURED');
  assert.ok(result.limitations.includes('SURPLUS_COMPENSATION_UNAVAILABLE'));
});

test('very low consumption rounds up to a whole module to meet the coverage target', () => {
  const lowConsumption = scenario({
    annualConsumptionKwh: 100,
    annualYieldKwhPerKwp: 1_500,
    panelWatts: 580
  });

  assert.equal(lowConsumption.system.panelCount, 1);
  assert.ok(Math.abs(lowConsumption.energyBalance.annualGenerationKwh - 870) < 0.000001);
  assert.equal(lowConsumption.energyBalance.offsetEnergyKwh, 100);
  assert.ok(Math.abs(lowConsumption.energyBalance.surplusEnergyKwh - 770) < 0.000001);
  assert.equal(lowConsumption.coveragePercent, 100);
  assert.equal(lowConsumption.financial.retailOffsetValueAmd, 5_000);
  assert.equal(lowConsumption.financial.annualEconomicValueAmd, null);
});

test('a configured, verified regulatory surplus-compensation rate completes annual value and payback', () => {
  const surplusCompensation = selectEffectiveSurplusCompensation(
    TEST_SURPLUS_COMPENSATION_DATASET,
    EFFECTIVE_DATE
  );
  const result = scenario({ panelWatts: 600, surplusCompensation });

  assert.equal(surplusCompensation.available, true);
  assert.equal(result.financial.surplusCompensation.rateAmdPerKwh, 20);
  assert.equal(result.financial.retailOffsetValueAmd, 50_000);
  assert.equal(result.financial.surplusCompensationValueAmd, 4_000);
  assert.equal(result.financial.annualEconomicValueAmd, 54_000);
  assert.equal(result.financial.annualSavingsAmd, 54_000);
  assert.equal(result.financial.paybackYears, 120_000 / 54_000);
  assert.equal(result.limitations.includes('SURPLUS_COMPENSATION_UNAVAILABLE'), false);
});

test('May-to-April settlement does not use April generation to erase an earlier May bill', () => {
  const surplusCompensation = selectEffectiveSurplusCompensation(
    TEST_SURPLUS_COMPENSATION_DATASET,
    EFFECTIVE_DATE
  );
  const monthlyConsumptionKwh = [0, 0, 0, 0, 1_000, 0, 0, 0, 0, 0, 0, 0];
  const monthlyYieldFactors = [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0];
  const result = scenario({
    monthlyConsumptionKwh,
    annualYieldKwhPerKwp: 1_000,
    monthlyYieldFactors,
    surplusCompensation
  });

  assert.equal(result.energyBalance.offsetEnergyKwh, 0);
  assert.equal(result.energyBalance.surplusEnergyKwh, 1_000);
  assert.equal(result.financial.retailOffsetValueAmd, 0);
  assert.equal(result.financial.surplusCompensationValueAmd, 20_000);
  assert.equal(result.financial.annualEconomicValueAmd, 20_000);
});
