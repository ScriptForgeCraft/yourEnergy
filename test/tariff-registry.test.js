import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ARMENIA_TARIFF_DATASET,
  createRegistryTariffSelection,
  createUserTariffSelection,
  getUsableTariffRate,
  normalizeConsumption,
  suggestStandardTariff
} from '../src/domain/index.js';

const DATE = '2026-09-08';

test('the Armenia residential registry is versioned and exposes every official day/night rate', () => {
  assert.equal(ARMENIA_TARIFF_DATASET.revision, '2026-psrc-residential-v1');
  assert.equal(ARMENIA_TARIFF_DATASET.source.status, 'confirmed');
  assert.deepEqual(
    ARMENIA_TARIFF_DATASET.records.map((record) => [record.id, record.dayRate, record.nightRate]),
    [
      ['social-vulnerable', 29.99, 19.99],
      ['standard-up-to-200', 46.48, 36.48],
      ['standard-201-to-400', 48.48, 38.48],
      ['standard-over-400', 53.48, 43.48]
    ]
  );
});

test('standard tariff suggestion respects Armenia monthly-kWh boundaries without selecting a rate', () => {
  for (const [kwh, expectedId] of [
    [200, 'standard-up-to-200'],
    [201, 'standard-201-to-400'],
    [400, 'standard-201-to-400'],
    [401, 'standard-over-400']
  ]) {
    assert.equal(suggestStandardTariff(kwh, ARMENIA_TARIFF_DATASET, DATE)?.id, expectedId);
  }
  assert.equal(suggestStandardTariff(null, ARMENIA_TARIFF_DATASET, DATE), null);
});

test('official tariff selections preserve source, revision, category and day/night period', () => {
  const socialNight = createRegistryTariffSelection(
    { tariffId: 'social-vulnerable', period: 'night' },
    ARMENIA_TARIFF_DATASET,
    DATE
  );
  const standardDay = createRegistryTariffSelection(
    { tariffId: 'standard-up-to-200', period: 'day' },
    ARMENIA_TARIFF_DATASET,
    DATE
  );

  assert.equal(socialNight.available, true);
  assert.equal(socialNight.tariff.rateAmdPerKwh, 19.99);
  assert.equal(socialNight.tariff.customerType, 'social-vulnerable');
  assert.equal(socialNight.tariff.period, 'night');
  assert.equal(socialNight.tariff.datasetRevision, ARMENIA_TARIFF_DATASET.revision);
  assert.equal(socialNight.tariff.source.provider, ARMENIA_TARIFF_DATASET.source.provider);
  assert.equal(standardDay.tariff.rateAmdPerKwh, 46.48);
});

test('a bill never infers an official bracket, while custom tariffs remain usable when explicitly entered', () => {
  const noSelection = normalizeConsumption({ averageMonthlyBillAmd: 30_000 });
  const custom = createUserTariffSelection({ rateAmdPerKwh: 51.25 }, DATE);
  const fromCustomBill = normalizeConsumption(
    { averageMonthlyBillAmd: 30_000 },
    { tariff: custom }
  );

  assert.equal(noSelection.available, false);
  assert.ok(noSelection.issues.includes('TARIFF_REQUIRED_FOR_BILL'));
  assert.equal(getUsableTariffRate(custom), 51.25);
  assert.equal(fromCustomBill.available, true);
  assert.equal(fromCustomBill.averageMonthlyKwh, 30_000 / 51.25);
});
