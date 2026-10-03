import assert from 'node:assert/strict';
import test from 'node:test';

import { calculatorModes } from '../src/content/calculator-modes.js';
import en from '../src/content/en.js';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';
import {
  ARMENIA_TARIFF_DATASET,
  buildSolarPassport,
  calculateSolarScenario,
  createAutomaticStandardResidentialTariff,
  createAutomaticStandardResidentialTariffProfile,
  createStandardResidentialTariffFromActualDayNight,
  createUserTariffSelection
} from '../src/domain/index.js';
import { createCalculatorSession } from '../src/ui/calculator-session.js';
import { buildQuickResultMetrics } from '../src/ui/quick-calculator.js';
import { formatTariffProvenance } from '../src/ui/tariff-provenance.js';

const DATE = '2026-09-08';

const scenario = ({ consumption, tariff, targetCoverage = 1, production = {} }) =>
  calculateSolarScenario({
    id: 'tariff-range',
    targetCoverage,
    consumption,
    production: { annualYieldKwhPerKwp: 1_000, ...production },
    tariff,
    investment: { capexAmdPerKwp: 100_000 },
    effectiveDate: DATE
  });

test('automatic standard finance values 1,000 offset kWh as the official night/day range', () => {
  const tariff = createAutomaticStandardResidentialTariff(450, ARMENIA_TARIFF_DATASET, DATE);
  const result = scenario({ consumption: { annualKwh: 1_000 }, tariff });

  assert.equal(result.financial.retailOffsetValueAmd, null);
  assert.deepEqual(result.financial.retailOffsetValueRangeAmd, {
    min: 43_480,
    max: 53_480
  });
  assert.deepEqual(result.financial.annualSavingsRangeAmd, {
    min: 43_480,
    max: 53_480
  });
  assert.deepEqual(result.financial.grossSavings25YearsRangeAmd, {
    min: 1_087_000,
    max: 1_337_000
  });
  assert.equal(result.financial.paybackRangeYears.min, 100_000 / 53_480);
  assert.equal(result.financial.paybackRangeYears.max, 100_000 / 43_480);
});

test('changing between standard range and a custom effective rate never changes kWh sizing', () => {
  const consumption = { averageMonthlyKwh: 450 };
  const standard = scenario({
    consumption,
    tariff: createAutomaticStandardResidentialTariff(450, ARMENIA_TARIFF_DATASET, DATE)
  });
  const custom = scenario({
    consumption,
    tariff: createUserTariffSelection({ rateAmdPerKwh: 47 }, DATE)
  });

  assert.equal(standard.system.capacityKwp, custom.system.capacityKwp);
  assert.equal(standard.generation.annualKwh, custom.generation.annualKwh);
  assert.equal(custom.financial.annualSavingsAmd, 450 * 12 * 47);
  assert.equal(custom.financial.annualSavingsRangeAmd, null);
  assert.deepEqual(standard.financial.annualSavingsRangeAmd, {
    min: 450 * 12 * 43.48,
    max: 450 * 12 * 53.48
  });
});

test('monthly consumption applies the official bracket independently to every month', () => {
  const monthlyKwh = [180, 220, 450, 180, 220, 450, 180, 220, 450, 180, 220, 450];
  const tariff = createAutomaticStandardResidentialTariffProfile(
    monthlyKwh,
    ARMENIA_TARIFF_DATASET,
    DATE
  );
  const annualKwh = monthlyKwh.reduce((total, value) => total + value, 0);
  const result = scenario({
    consumption: { monthlyKwh },
    tariff,
    production: { monthlyYieldFactors: monthlyKwh.map((value) => value / annualKwh) }
  });
  const expectedMinimum = 4 * (180 * 36.48 + 220 * 38.48 + 450 * 43.48);
  const expectedMaximum = 4 * (180 * 46.48 + 220 * 48.48 + 450 * 53.48);

  assert.deepEqual(tariff.monthlyTariffs.map((month) => month.tariffId).slice(0, 3), [
    'standard-up-to-200',
    'standard-201-to-400',
    'standard-over-400'
  ]);
  assert.equal(result.financial.annualSavingsRangeAmd.min, expectedMinimum);
  assert.equal(result.financial.annualSavingsRangeAmd.max, expectedMaximum);
});

test('actual day/night readings use registry rates and produce one effective estimate', () => {
  const tariff = createStandardResidentialTariffFromActualDayNight(
    450,
    { dayKwh: 300, nightKwh: 150 },
    ARMENIA_TARIFF_DATASET,
    DATE
  );
  const expectedRate = (300 * 53.48 + 150 * 43.48) / 450;
  const result = scenario({ consumption: { averageMonthlyKwh: 450 }, tariff });

  assert.equal(tariff.available, true);
  assert.equal(tariff.tariff.accuracy, 'actual-day-night');
  assert.equal(tariff.tariff.effectiveRateAmdPerKwh, expectedRate);
  assert.equal(result.financial.annualSavingsAmd, 450 * 12 * expectedRate);
  assert.equal(result.financial.annualSavingsRangeAmd, null);
});

test('Quick metrics, tariff provenance and Solar Passport retain range semantics', () => {
  const tariff = createAutomaticStandardResidentialTariff(450, ARMENIA_TARIFF_DATASET, DATE);
  const result = scenario({ consumption: { annualKwh: 1_000 }, tariff });
  const metrics = buildQuickResultMetrics({
    scenario: result,
    copy: calculatorModes.en.quick,
    locale: 'en-US'
  });
  const passport = buildSolarPassport({
    analysis: {
      schemaVersion: 'test',
      financial: { tariff: tariff.tariff },
      selectedScenario: result
    },
    id: 'passport-range',
    createdAt: '2026-09-08T12:00:00.000Z'
  });

  assert.equal(
    metrics.metrics.find((metric) => metric.id === 'estimated-annual-savings').value,
    '≈ 43,480–53,480 AMD/year'
  );
  assert.equal(
    formatTariffProvenance({
      tariff: { kind: tariff.kind, ...tariff.tariff },
      strings: en.product.consumption
    }),
    'Standard residential tariff · Above 400 kWh/month · 43.48–53.48 AMD/kWh'
  );
  assert.deepEqual(
    passport.analysis.selectedScenario.financial.annualSavingsRangeAmd,
    result.financial.annualSavingsRangeAmd
  );
});

test('tariff mode session switching cannot keep a stale custom rate active', () => {
  const values = new Map();
  const session = createCalculatorSession({
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    }
  });

  session.write({
    financialTariffMode: 'custom-effective',
    effectiveRateOverride: { rateAmdPerKwh: 47 }
  });
  assert.equal(session.read().effectiveRateOverride.rateAmdPerKwh, 47);

  session.write({ financialTariffMode: 'standard' });
  assert.equal(session.read().financialTariffMode, 'standard');
  assert.equal(session.read().effectiveRateOverride, null);
});

test('HY, RU and EN expose complete tariff range copy without fallback keys', () => {
  for (const [locale, content] of Object.entries({ hy, ru, en })) {
    const consumption = content.product.consumption;
    for (const key of [
      'standardTariff',
      'customEffectiveRate',
      'bracketUpTo',
      'bracketBetween',
      'bracketAbove',
      'monthlyBracket',
      'actualDayNightDisclosure',
      'invalidDayNight'
    ]) {
      assert.equal(
        typeof consumption[key],
        'string',
        `${locale} misses product.consumption.${key}`
      );
    }
    assert.equal(calculatorModes[locale].quick.tariffInfo.length, 4);
  }
});
