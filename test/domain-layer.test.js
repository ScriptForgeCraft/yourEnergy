import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SolarPassportRepository,
  buildSolarAnalysis,
  buildSolarPassport,
  calculateSolarScenario,
  normalizeConsumption,
  createUserTariffSelection
} from '../src/domain/index.js';
import { toFiniteNumberOrNull } from '../src/domain/numbers.js';

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

test('blank numeric fields do not become a false zero, while an explicit zero remains valid', () => {
  assert.equal(toFiniteNumberOrNull(''), null);
  assert.equal(toFiniteNumberOrNull('   '), null);
  assert.equal(toFiniteNumberOrNull('0'), 0);
  assert.equal(toFiniteNumberOrNull(0), 0);
});

test('panel count rounds up so a feasible target coverage is never knowingly missed', () => {
  const panelCountForAnnualConsumption = (annualKwh) =>
    calculateSolarScenario({
      id: 'panel-rounding',
      targetCoverage: 1,
      consumption: { annualKwh },
      production: { annualYieldKwhPerKwp: 1_000 },
      system: { panelWatts: 1_000, panelAreaSqm: 2 }
    }).system.panelCount;

  assert.equal(panelCountForAnnualConsumption(12_400), 13);
  assert.equal(panelCountForAnnualConsumption(12_500), 13);
  assert.equal(panelCountForAnnualConsumption(12_600), 13);
});

test('normalizeConsumption uses kWh inputs first and estimates a bill without a tariff choice', () => {
  const monthly = normalizeConsumption({ monthlyKwh: MONTHLY_CONSUMPTION });
  const annual = normalizeConsumption({ annualKwh: 12_000 });
  const fromBill = normalizeConsumption({ averageMonthlyBillAmd: 5_000 });

  assert.equal(monthly.kind, 'monthly-profile');
  assert.equal(monthly.annualKwh, 11_350);
  assert.equal(annual.kind, 'annual-kwh');
  assert.equal(annual.annualKwh, 12_000);
  assert.equal(fromBill.kind, 'estimated-from-monthly-bill');
  assert.equal(fromBill.available, true);
  assert.equal(fromBill.source.status, 'estimated');
});

test('buildSolarAnalysis derives transparent scenarios with an automatic standard tariff', () => {
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
    system: { panelWatts: 580, panelAreaSqm: 2 },
    investment: {
      capexAmdPerKwp: 400_000,
      source: { kind: 'manual', status: 'provided' }
    },
    selectedScenarioId: 'balanced'
  });

  assert.equal(analysis.mode, 'real-analysis');
  // The real May-to-April monthly sequence leaves a small April credit even
  // though annual production is lower than annual consumption. The credit is
  // excluded without a verified annual-surplus rate, while the known retail
  // offset remains available as a conservative financial range.
  assert.equal(analysis.status, 'financial-ready');
  assert.equal(analysis.selectedScenario.id, 'balanced');
  assert.equal(analysis.selectedScenario.system.panelCount, 12);
  assert.equal(analysis.selectedScenario.system.capacityKwp, 6.96);
  assert.equal(analysis.selectedScenario.generation.annualKwh, 10_440);
  assert.equal(analysis.selectedScenario.financial.annualSavingsAmd, null);
  assert.ok(analysis.selectedScenario.financial.paybackRangeYears.min > 0);
  assert.ok(analysis.selectedScenario.limitations.includes('SURPLUS_COMPENSATION_UNAVAILABLE'));
  assert.equal(analysis.selectedScenario.financial.capexAmd, 2_784_000);
  assert.equal(analysis.selectedScenario.generation.monthlyKwh.length, 12);
  assert.equal(
    analysis.selectedScenario.generation.monthlyKwh.reduce((total, item) => total + item, 0),
    analysis.selectedScenario.generation.annualKwh
  );
  assert.equal(analysis.dataCompleteness.level, 'preliminary');
  assert.equal(analysis.sourceLedger.find((entry) => entry.key === 'tariff').available, true);
  assert.ok(analysis.assumptions.includes('ARMENIA_MONTHLY_NET_METERING_MAY_TO_APRIL'));
  assert.ok(
    analysis.assumptions.includes('STANDARD_RESIDENTIAL_DAY_NIGHT_RANGE_WITH_UNKNOWN_USAGE_SPLIT')
  );
  assertFiniteTree(analysis);
});

test('buildSolarAnalysis defaults recommended sizing to maximum coverage while preserving explicit scenarios', () => {
  const input = {
    consumption: { annualKwh: 10_000 },
    production: { annualYieldKwhPerKwp: 1_500 },
    system: { panelWatts: 500, panelAreaSqm: 2 }
  };

  const defaultAnalysis = buildSolarAnalysis(input);
  const balancedAnalysis = buildSolarAnalysis({ ...input, selectedScenarioId: 'balanced' });
  const conservativeAnalysis = buildSolarAnalysis({ ...input, selectedScenarioId: 'conservative' });

  assert.equal(defaultAnalysis.selectedScenario.id, 'maximum');
  assert.equal(defaultAnalysis.selectedScenario.targetCoverage, 1);
  assert.equal(balancedAnalysis.selectedScenario.id, 'balanced');
  assert.equal(balancedAnalysis.selectedScenario.targetCoverage, 0.9);
  assert.equal(conservativeAnalysis.selectedScenario.id, 'conservative');
  assert.equal(conservativeAnalysis.selectedScenario.targetCoverage, 0.7);
});

test('roof constraints and an invalid override suppress unsupported financial claims', () => {
  const tariff = createUserTariffSelection({}, '2026-08-28');
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
