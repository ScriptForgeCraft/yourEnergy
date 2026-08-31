import assert from 'node:assert/strict';
import test from 'node:test';

import { ARMENIA_TARIFF_DATASET } from '../src/data/tariffs/armenia.js';
import {
  SolarPassportRepository,
  buildSolarAnalysis,
  buildSolarPassport,
  calculateSolarScenario,
  getConfirmedTariffRate,
  normalizeConsumption,
  selectEffectiveTariff
} from '../src/domain/index.js';

const TEST_TARIFF_DATASET = Object.freeze({
  id: 'test-am-retail-electricity',
  schemaVersion: '1.0.0',
  revision: 'test-only',
  countryCode: 'AM',
  currency: 'AMD',
  reviewedAt: '2026-08-01',
  records: [
    {
      id: 'test-rate-2025',
      effectiveFrom: '2025-01-01',
      effectiveTo: '2025-12-31',
      status: 'confirmed',
      rateAmdPerKwh: 45,
      currency: 'AMD',
      source: {
        kind: 'registry',
        status: 'confirmed',
        provider: 'Test tariff resolution',
        reference: 'test://tariff/2025',
        verifiedAt: '2025-01-02'
      }
    },
    {
      id: 'test-rate-2026',
      effectiveFrom: '2026-01-01',
      effectiveTo: null,
      status: 'confirmed',
      rateAmdPerKwh: 50,
      currency: 'AMD',
      source: {
        kind: 'registry',
        status: 'confirmed',
        provider: 'Test tariff resolution',
        reference: 'test://tariff/2026',
        verifiedAt: '2026-01-03'
      }
    }
  ]
});

const MONTHLY_CONSUMPTION = [800, 800, 900, 950, 1000, 1050, 1100, 1100, 1000, 950, 850, 850];

const assertFiniteTree = (value, path = 'value', seen = new WeakSet()) => {
  if (typeof value === 'number') {
    assert.ok(Number.isFinite(value), `${path} must be finite`);
    return;
  }
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const [key, nested] of Object.entries(value)) {
    assertFiniteTree(nested, `${path}.${key}`, seen);
  }
};

test('selectEffectiveTariff selects dated, verified records and keeps the P0 registry unavailable', () => {
  const historic = selectEffectiveTariff(TEST_TARIFF_DATASET, '2025-06-01');
  const current = selectEffectiveTariff(TEST_TARIFF_DATASET, '2026-08-28');
  const localP0 = selectEffectiveTariff(ARMENIA_TARIFF_DATASET, '2026-08-28');

  assert.equal(historic.available, true);
  assert.equal(historic.tariff.id, 'test-rate-2025');
  assert.equal(current.available, true);
  assert.equal(current.tariff.id, 'test-rate-2026');
  assert.equal(getConfirmedTariffRate(current), 50);
  assert.equal(localP0.available, false);
  assert.equal(localP0.reason, 'NO_EFFECTIVE_TARIFF');
  assert.equal(getConfirmedTariffRate(localP0), null);
});

test('normalizeConsumption uses kWh inputs first and only converts a bill with an available tariff', () => {
  const tariff = selectEffectiveTariff(TEST_TARIFF_DATASET, '2026-08-28');
  const monthly = normalizeConsumption({ monthlyKwh: MONTHLY_CONSUMPTION });
  const annual = normalizeConsumption({ annualKwh: 12_000 });
  const fromBill = normalizeConsumption({ averageMonthlyBillAmd: 5_000 }, { tariff });
  const noTariffBill = normalizeConsumption({ averageMonthlyBillAmd: 5_000 });

  assert.equal(monthly.kind, 'monthly-profile');
  assert.equal(monthly.annualKwh, 11_350);
  assert.equal(annual.kind, 'annual-kwh');
  assert.equal(annual.annualKwh, 12_000);
  assert.equal(fromBill.kind, 'monthly-bill');
  assert.equal(fromBill.averageMonthlyKwh, 100);
  assert.equal(fromBill.annualKwh, 1_200);
  assert.equal(noTariffBill.available, false);
  assert.ok(noTariffBill.issues.includes('TARIFF_REQUIRED_FOR_BILL'));
});

test('buildSolarAnalysis derives transparent scenarios from explicit inputs only', () => {
  const tariff = selectEffectiveTariff(TEST_TARIFF_DATASET, '2026-08-28');
  const analysis = buildSolarAnalysis({
    property: {
      address: 'Manual test property',
      coordinates: { lat: 40.18, lng: 44.51 },
      confirmed: true,
      source: { kind: 'manual', status: 'confirmed' }
    },
    consumption: { monthlyKwh: MONTHLY_CONSUMPTION },
    roof: {
      areaSqm: 80,
      usableAreaRatio: 0.7,
      orientationDegrees: 180,
      tiltDegrees: 30,
      polygonComplete: true,
      source: { kind: 'manual', status: 'confirmed' }
    },
    production: {
      annualYieldKwhPerKwp: 1_500,
      monthlyYieldFactors: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      source: { kind: 'provider', status: 'confirmed', provider: 'Test PV provider' }
    },
    tariffSelection: tariff,
    system: { panelWatts: 580, panelAreaSqm: 2 },
    investment: {
      capexAmdPerKwp: 400_000,
      source: { kind: 'manual', status: 'provided' }
    },
    selectedScenarioId: 'balanced'
  });

  assert.equal(analysis.mode, 'real-analysis');
  assert.equal(analysis.status, 'financial-ready');
  assert.equal(analysis.selectedScenario.id, 'balanced');
  assert.equal(analysis.selectedScenario.system.panelCount, 12);
  assert.equal(analysis.selectedScenario.system.capacityKwp, 6.96);
  assert.equal(analysis.selectedScenario.generation.annualKwh, 10_440);
  assert.equal(analysis.selectedScenario.financial.annualSavingsAmd, 522_000);
  assert.equal(analysis.selectedScenario.financial.capexAmd, 2_784_000);
  assert.ok(analysis.selectedScenario.financial.paybackYears > 5);
  assert.equal(analysis.selectedScenario.generation.monthlyKwh.length, 12);
  assert.equal(
    analysis.selectedScenario.generation.monthlyKwh.reduce((total, item) => total + item, 0),
    analysis.selectedScenario.generation.annualKwh
  );
  assert.equal(analysis.confidence.level, 'high');
  assert.equal(analysis.sourceLedger.find((entry) => entry.key === 'tariff').available, true);
  assertFiniteTree(analysis);
});

test('roof constraints and missing tariffs suppress unsupported financial claims', () => {
  const tariff = selectEffectiveTariff(ARMENIA_TARIFF_DATASET, '2026-08-28');
  const consumption = normalizeConsumption({ annualKwh: 12_000 });
  const scenario = calculateSolarScenario({
    id: 'roof-limited',
    targetCoverage: 1,
    consumption,
    roof: {
      areaSqm: 12,
      usableAreaRatio: 0.5,
      polygonComplete: true
    },
    production: {
      available: true,
      annualYieldKwhPerKwp: 1_500,
      monthlyYieldFactors: null
    },
    tariff,
    investment: { capexAmdPerKwp: 400_000 },
    system: { panelWatts: 580, panelAreaSqm: 2 }
  });

  assert.ok(scenario.limitations.includes('ROOF_CAPACITY_LIMIT'));
  assert.ok(scenario.limitations.includes('TARIFF_REQUIRED'));
  assert.equal(scenario.financial.annualSavingsAmd, null);
  assert.equal(scenario.financial.paybackYears, null);
  assert.ok(scenario.coveragePercent < 100);
  assertFiniteTree(scenario);
});

test('SolarPassport snapshots analysis in memory and never advertises a permanent URL', () => {
  const analysis = buildSolarAnalysis({
    consumption: { annualKwh: 8_000 },
    production: { annualYieldKwhPerKwp: 1_400 },
    effectiveDate: '2026-08-28'
  });
  const passport = buildSolarPassport({
    id: 'passport-test-1',
    createdAt: '2026-08-28T12:00:00.000Z',
    locale: 'ru',
    analysis
  });
  const repository = new SolarPassportRepository({
    clock: () => new Date('2026-08-28T12:00:00.000Z'),
    idFactory: () => 'passport-test-2'
  });

  assert.equal(passport.persistence, 'memory');
  assert.equal(passport.permanentUrlAvailable, false);
  assert.equal(Object.isFrozen(passport), true);
  repository.save(passport);
  const saved = repository.create(analysis, { locale: 'en' });
  saved.analysis.status = 'mutated-outside-repository';

  assert.equal(repository.has('passport-test-1'), true);
  assert.equal(repository.get('passport-test-2').analysis.status, analysis.status);
  assert.equal(repository.list().length, 2);
  assert.equal(repository.clear(), 2);
  assertFiniteTree(passport);
});
