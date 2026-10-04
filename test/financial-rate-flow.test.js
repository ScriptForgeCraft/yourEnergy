import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import { calculatorModes } from '../src/content/calculator-modes.js';
import en from '../src/content/en.js';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';
import {
  FINANCIAL_RATE_MODES,
  FINANCIAL_RATE_SOURCE_TYPES,
  buildSolarPassport,
  calculateSolarScenario,
  createAutomaticStandardResidentialTariff,
  createBillDerivedTariffSelection,
  createDefaultFinancialRate,
  createStandardFinancialRate,
  createUserTariffSelection,
  deriveEffectiveRateFromBill,
  normalizeFinancialRate,
  resolveFinancialRateSource,
  toFinancialRateRequest
} from '../src/domain/index.js';
import { resolveFinancialCalculation } from '../functions/_lib/financial-rate.js';
import { createCalculatorSession } from '../src/ui/calculator-session.js';
import { createProfessionalAnalysisIdentity } from '../src/ui/professional-analysis-identity.js';
import { createQuickAnalysisIdentity } from '../src/ui/quick-analysis-identity.js';
import { formatTariffProvenance } from '../src/ui/tariff-provenance.js';

const DATE = '2026-10-04';
const billConsumption = {
  mode: 'bill',
  averageMonthlyBillAmd: 11_111,
  billedKwh: 111
};
const usageConsumption = { mode: 'usage', averageMonthlyKwh: 350 };

const memoryStorage = () => {
  const records = new Map();
  return {
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, value)
  };
};

test('bill-derived rate keeps full precision for math and formats to at most two decimals', () => {
  const rate = deriveEffectiveRateFromBill({ billAmd: 11_111, billedKwh: 111 });

  assert.equal(rate, 11_111 / 111);
  assert.equal(new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(rate), '100.1');
  assert.equal(
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(48.387096),
    '48.39'
  );
});

test('one financial-rate state machine keeps bill-derived and custom provenance distinct', () => {
  const derived = createDefaultFinancialRate(billConsumption);
  const custom = resolveFinancialRateSource({
    mode: FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE,
    consumption: billConsumption,
    effectiveRateAmdPerKwh: 22
  });

  assert.deepEqual(derived, {
    mode: FINANCIAL_RATE_MODES.BILL_DERIVED,
    sourceType: FINANCIAL_RATE_SOURCE_TYPES.BILL_DERIVED
  });
  assert.deepEqual(custom, {
    mode: FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE,
    sourceType: FINANCIAL_RATE_SOURCE_TYPES.CUSTOM_EFFECTIVE,
    effectiveRateAmdPerKwh: 22
  });
  assert.equal('effectiveRateAmdPerKwh' in derived, false);
  assert.deepEqual(toFinancialRateRequest(derived, billConsumption), {
    sourceType: FINANCIAL_RATE_SOURCE_TYPES.BILL_DERIVED
  });
});

test('standard, custom and bill-derived transitions never retain an inactive rate', () => {
  const custom = resolveFinancialRateSource({
    mode: FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE,
    consumption: usageConsumption,
    effectiveRateAmdPerKwh: 22
  });
  const standard = createStandardFinancialRate({ explicit: true });

  assert.equal(custom.sourceType, FINANCIAL_RATE_SOURCE_TYPES.CUSTOM_EFFECTIVE);
  assert.equal(standard.sourceType, FINANCIAL_RATE_SOURCE_TYPES.STANDARD);
  assert.equal('effectiveRateAmdPerKwh' in standard, false);
  assert.deepEqual(
    normalizeFinancialRate(createDefaultFinancialRate(billConsumption), usageConsumption),
    createStandardFinancialRate()
  );
});

test('server recomputes bill-derived rate from raw inputs and ignores a spoofed browser quotient', () => {
  const { consumption, tariffSelection } = resolveFinancialCalculation(
    {
      consumption: {
        averageMonthlyBillAmd: billConsumption.averageMonthlyBillAmd,
        billedKwh: billConsumption.billedKwh
      },
      financialRate: {
        sourceType: FINANCIAL_RATE_SOURCE_TYPES.BILL_DERIVED,
        effectiveRateAmdPerKwh: 1
      }
    },
    DATE
  );

  assert.equal(consumption.kind, 'bill-with-kwh');
  assert.equal(tariffSelection.kind, 'bill-derived');
  assert.equal(tariffSelection.tariff.billAmd, 11_111);
  assert.equal(tariffSelection.tariff.billedKwh, 111);
  assert.equal(tariffSelection.tariff.effectiveRateAmdPerKwh, 11_111 / 111);
});

test('session handoff preserves bill-derived raw inputs without reinterpreting them as custom', () => {
  const session = createCalculatorSession({ storage: memoryStorage() });
  session.write({
    regionId: 'yerevan',
    consumption: billConsumption,
    financialRate: createDefaultFinancialRate(billConsumption)
  });

  for (const restored of [session.read(), session.read()]) {
    assert.deepEqual(restored.consumption, billConsumption);
    assert.equal(restored.financialRate.mode, FINANCIAL_RATE_MODES.BILL_DERIVED);
    assert.equal(restored.financialRate.sourceType, FINANCIAL_RATE_SOURCE_TYPES.BILL_DERIVED);
    assert.equal('effectiveRateAmdPerKwh' in restored.financialRate, false);
    assert.equal('effectiveRateOverride' in restored, false);
    assert.equal('financialTariffMode' in restored, false);
  }
});

test('changing consumption modes resets incompatible financial state in session storage', () => {
  const session = createCalculatorSession({ storage: memoryStorage() });
  session.write({
    consumption: billConsumption,
    financialRate: resolveFinancialRateSource({
      mode: FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE,
      consumption: billConsumption,
      effectiveRateAmdPerKwh: 22
    })
  });
  session.write({ consumption: usageConsumption });

  const restored = session.read();
  assert.deepEqual(restored.consumption, usageConsumption);
  assert.deepEqual(restored.financialRate, createStandardFinancialRate());
});

test('analysis identities include source and raw financial inputs but ignore display-only formatting', () => {
  const financialRate = createDefaultFinancialRate(billConsumption);
  const quick = (consumption, rate) =>
    createQuickAnalysisIdentity({ regionId: 'yerevan', consumption, financialRate: rate });
  const professional = (rate) =>
    createProfessionalAnalysisIdentity({
      property: { lat: 40.1772, lng: 44.5035 },
      consumption: billConsumption,
      financialRate: rate,
      roof: { areaMethod: 'measured-plane', planeAreaSqm: 50, complete: true }
    });

  assert.notEqual(quick(billConsumption, financialRate), quick(usageConsumption, financialRate));
  assert.notEqual(
    quick(billConsumption, financialRate),
    quick(billConsumption, {
      mode: FINANCIAL_RATE_MODES.CUSTOM_EFFECTIVE,
      effectiveRateAmdPerKwh: 22
    })
  );
  assert.equal(
    professional(financialRate),
    professional({ ...financialRate, displayValue: '100.1' })
  );
});

test('financial source changes alter money but not system sizing or generation', () => {
  const consumption = { averageMonthlyKwh: 111 };
  const production = { annualYieldKwhPerKwp: 1_000 };
  const investment = { capexAmdPerKwp: 100_000 };
  const run = (tariff) =>
    calculateSolarScenario({
      id: 'source-invariant',
      targetCoverage: 1,
      consumption,
      production,
      tariff,
      investment,
      effectiveDate: DATE
    });
  const standard = run(createAutomaticStandardResidentialTariff(111, undefined, DATE));
  const derivedSelection = createBillDerivedTariffSelection(
    { billAmd: 11_111, billedKwh: 111 },
    DATE
  );
  const derived = run(derivedSelection);
  const custom = run(createUserTariffSelection({ rateAmdPerKwh: 22 }, DATE));

  assert.equal(standard.system.capacityKwp, derived.system.capacityKwp);
  assert.equal(derived.system.capacityKwp, custom.system.capacityKwp);
  assert.equal(standard.generation.annualKwh, custom.generation.annualKwh);
  assert.equal(derived.financial.retailOffsetValueAmd, 111 * 12 * (11_111 / 111));
  assert.equal(custom.financial.retailOffsetValueAmd, 111 * 12 * 22);
  assert.notEqual(derived.financial.retailOffsetValueAmd, custom.financial.retailOffsetValueAmd);
});

test('results and Solar Passport preserve the selected financial provenance', () => {
  const selection = createBillDerivedTariffSelection({ billAmd: 11_111, billedKwh: 111 }, DATE);
  const tariff = { kind: selection.kind, ...selection.tariff };
  const passport = buildSolarPassport({
    analysis: { schemaVersion: 'test', financial: { tariff } },
    id: 'bill-derived-passport',
    createdAt: '2026-10-04T00:00:00.000Z'
  });

  assert.equal(
    passport.analysis.financial.tariff.tariffSource,
    FINANCIAL_RATE_SOURCE_TYPES.BILL_DERIVED
  );
  assert.equal(passport.analysis.financial.tariff.billAmd, 11_111);
  assert.equal(passport.analysis.financial.tariff.billedKwh, 111);
  assert.equal(
    formatTariffProvenance({
      tariff,
      strings: en.product.consumption,
      formatRate: (value) =>
        new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
    }),
    'From your bill · 100.1 AMD/kWh'
  );
});

test('HY, RU and EN define the complete financial-source and empty-state copy', () => {
  for (const [locale, content] of Object.entries({ hy, ru, en })) {
    const professional = content.product.consumption;
    const quick = calculatorModes[locale].quick;
    for (const key of [
      'tariffSettingTitle',
      'billDerivedRate',
      'billDerivedHelp',
      'customEffectiveRate',
      'customBillComparison',
      'emptyState',
      'billKwhRemove',
      'tariffInfoLabel',
      'tariffInfoTitle'
    ]) {
      assert.equal(typeof professional[key], 'string', `${locale} professional.${key}`);
    }
    assert.equal(Array.isArray(professional.tariffInfo), true, `${locale} professional.tariffInfo`);
    assert.equal(professional.tariffInfo.length, 3, `${locale} professional.tariffInfo length`);
    for (const key of [
      'tariffForSavings',
      'billEffectiveRate',
      'billDerivedHelp',
      'customBillComparison',
      'billKwhRemove'
    ]) {
      assert.equal(typeof quick[key], 'string', `${locale} quick.${key}`);
    }
  }
});

test('calculator templates keep one radio group, blank custom inputs and a truthful empty state', async () => {
  const root = resolve(import.meta.dirname, '..');
  const [quick, professional, quickController, professionalController] = await Promise.all([
    readFile(resolve(root, 'src/templates/calculator-quick.hbs'), 'utf8'),
    readFile(resolve(root, 'src/templates/calculator.hbs'), 'utf8'),
    readFile(resolve(root, 'src/ui/quick-calculator.js'), 'utf8'),
    readFile(resolve(root, 'src/ui/consumption-input.js'), 'utf8')
  ]);

  assert.equal((quick.match(/name='quick-tariff-mode'/gu) ?? []).length, 3);
  assert.equal((professional.match(/name='professional-tariff-mode'/gu) ?? []).length, 4);
  assert.match(quick, /data-quick-effective-rate[^>]*\/?>/u);
  assert.match(professional, /data-consumption-effective-rate[^>]*\/?>/u);
  assert.doesNotMatch(quick, /data-quick-effective-rate[^>]*value=/u);
  assert.doesNotMatch(professional, /data-consumption-effective-rate[^>]*value=/u);
  assert.match(professional, /data-consumption-annual-card hidden/u);
  assert.match(professional, /data-consumption-empty/u);
  assert.match(quickController, /maximumFractionDigits: 2/u);
  assert.match(professionalController, /maximumFractionDigits: 2/u);
  assert.match(quickController, /addEventListener\('blur'/u);
  assert.match(professionalController, /addEventListener\('blur'/u);
});
