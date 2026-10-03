import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  ARMENIA_TARIFF_DATASET,
  createAutomaticStandardResidentialTariff,
  createUserTariffSelection,
  estimateStandardResidentialConsumptionFromBill,
  normalizeConsumption,
  suggestStandardTariff
} from '../src/domain/index.js';
import { createCalculatorSession } from '../src/ui/calculator-session.js';
import { calculatorModes } from '../src/content/calculator-modes.js';

const DATE = '2026-09-08';

test('known monthly kWh automatically resolves every standard residential bracket', () => {
  for (const [kwh, tariffId] of [
    [150, 'standard-up-to-200'],
    [200, 'standard-up-to-200'],
    [200.01, 'standard-201-to-400'],
    [300, 'standard-201-to-400'],
    [400, 'standard-201-to-400'],
    [400.01, 'standard-over-400'],
    [500, 'standard-over-400']
  ]) {
    assert.equal(suggestStandardTariff(kwh, ARMENIA_TARIFF_DATASET, DATE)?.id, tariffId);
    const selection = createAutomaticStandardResidentialTariff(kwh, ARMENIA_TARIFF_DATASET, DATE);
    assert.equal(selection.available, true);
    assert.equal(selection.kind, 'automatic-standard-residential');
    assert.equal(selection.tariff.tariffId, tariffId);
    assert.equal(selection.tariff.period, 'day-night-range');
    assert.equal(selection.tariff.rateAmdPerKwh, null);
    assert.equal(selection.tariff.effectiveRateAmdPerKwh, null);
    assert.equal(selection.tariff.minRateAmdPerKwh, selection.tariff.nightRateAmdPerKwh);
    assert.equal(selection.tariff.maxRateAmdPerKwh, selection.tariff.dayRateAmdPerKwh);
  }
});

test('bill estimates use the standard daytime reference rate and never oscillate at rate gaps', () => {
  const under200Bill = 150 * 46.48;
  const over200Bill = 300 * 48.48;
  assert.equal(
    estimateStandardResidentialConsumptionFromBill(under200Bill, ARMENIA_TARIFF_DATASET, DATE)
      .tariff.tariffId,
    'standard-up-to-200'
  );
  assert.equal(
    estimateStandardResidentialConsumptionFromBill(over200Bill, ARMENIA_TARIFF_DATASET, DATE).tariff
      .tariffId,
    'standard-201-to-400'
  );

  for (const bill of [9_297, 9_496, 9_696, 19_393, 20_392, 21_392]) {
    const estimate = estimateStandardResidentialConsumptionFromBill(
      bill,
      ARMENIA_TARIFF_DATASET,
      DATE
    );
    assert.equal(estimate.available, true);
    assert.ok(['within-bracket', 'nearest-valid-boundary'].includes(estimate.resolution));
    assert.equal(
      estimate.tariff.tariffId,
      createAutomaticStandardResidentialTariff(
        estimate.estimatedMonthlyKwh,
        ARMENIA_TARIFF_DATASET,
        DATE
      ).tariff.tariffId
    );
  }
});

test('bill-only consumption is an automatic estimate, while a valid effective rate overrides it', () => {
  const automatic = normalizeConsumption(
    { averageMonthlyBillAmd: 30_000 },
    { tariffDataset: ARMENIA_TARIFF_DATASET, effectiveDate: DATE }
  );
  assert.equal(automatic.available, true);
  assert.equal(automatic.kind, 'estimated-from-monthly-bill');
  assert.equal(automatic.source.status, 'estimated');
  assert.equal(automatic.estimation.assumption.includes('DAY_RATE_REFERENCE'), true);

  const override = createUserTariffSelection({ rateAmdPerKwh: 50 }, DATE);
  const overridden = normalizeConsumption(
    { averageMonthlyBillAmd: 30_000 },
    { tariff: override, effectiveDate: DATE }
  );
  assert.equal(overridden.kind, 'monthly-bill');
  assert.equal(overridden.averageMonthlyKwh, 600);
  assert.equal(createUserTariffSelection({ rateAmdPerKwh: 0 }, DATE).available, false);
});

test('legacy sessions retain only a safe custom effective-rate override', () => {
  const records = new Map();
  const session = createCalculatorSession({
    storage: {
      getItem: (key) => records.get(key) ?? null,
      setItem: (key, value) => records.set(key, value)
    }
  });
  records.set(
    session.key,
    JSON.stringify({ version: 6, userTariff: { tariffId: 'social-vulnerable', period: 'night' } })
  );
  assert.equal(session.read().effectiveRateOverride, null);

  records.set(session.key, JSON.stringify({ version: 6, userTariff: { rateAmdPerKwh: 45 } }));
  assert.deepEqual(session.read().effectiveRateOverride, { rateAmdPerKwh: 45 });

  records.set(session.key, JSON.stringify({ version: 6, userTariff: { rateAmdPerKwh: 53.48 } }));
  assert.equal(session.read().effectiveRateOverride, null);
});

test('Quick and Professional expose compact average-rate controls without client-owned registry fields', async () => {
  const root = resolve(import.meta.dirname, '..');
  const [quickTemplate, professionalTemplate] = await Promise.all([
    readFile(resolve(root, 'src/templates/calculator-quick.hbs'), 'utf8'),
    readFile(resolve(root, 'src/templates/calculator.hbs'), 'utf8')
  ]);
  for (const removed of [
    'data-tariff-selector',
    'data-tariff-period',
    'data-tariff-bracket',
    'social-vulnerable'
  ]) {
    assert.equal(quickTemplate.includes(removed), false);
    assert.equal(professionalTemplate.includes(removed), false);
  }
  assert.equal(professionalTemplate.includes('data-consumption-effective-rate'), true);
  assert.equal(quickTemplate.includes('data-quick-effective-rate'), true);
  assert.equal(quickTemplate.includes('data-quick-tariff-info'), true);
  assert.equal(quickTemplate.includes('data-quick-tariff-options'), true);
  assert.equal(professionalTemplate.includes('data-actual-day-kwh'), true);
  assert.equal(professionalTemplate.includes('data-actual-night-kwh'), true);
  assert.equal(quickTemplate.includes('data-actual-day-kwh'), false);
  assert.equal(quickTemplate.includes('data-actual-night-kwh'), false);
  assert.equal(quickTemplate.includes("name='quick-day-percent'"), false);
  assert.equal(professionalTemplate.includes("name='day-percent'"), false);
  for (const locale of ['hy', 'ru', 'en']) {
    const quick = calculatorModes[locale].quick;
    for (const requiredKey of [
      'tariffForSavings',
      'standardTariff',
      'customEffectiveRate',
      'tariffInfoTitle',
      'effectiveRateHelp',
      'bracketUpTo',
      'bracketBetween',
      'bracketAbove'
    ]) {
      assert.equal(typeof quick[requiredKey], 'string', `${locale} misses ${requiredKey}`);
    }
    assert.equal(quick.tariffInfo.length, 4, `${locale} tariff info is incomplete`);
  }
});
