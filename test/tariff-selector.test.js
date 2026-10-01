import assert from 'node:assert/strict';
import test from 'node:test';

import { createCalculatorSession } from '../src/ui/calculator-session.js';
import {
  DEFAULT_OFFICIAL_TARIFF,
  formatTariffProvenance,
  monthlyKwhForTariffSuggestion,
  normalizeTariffSelection,
  resolveTariffSelectionRate,
  suggestOfficialTariffSelection
} from '../src/ui/tariff-selector.js';

test('the default tariff is official, while an edited rate serializes as custom', () => {
  assert.deepEqual(normalizeTariffSelection(), DEFAULT_OFFICIAL_TARIFF);
  assert.deepEqual(normalizeTariffSelection({ rateAmdPerKwh: '53' }), { rateAmdPerKwh: 53 });
  assert.deepEqual(normalizeTariffSelection({ rateAmdPerKwh: '53.48' }), {
    rateAmdPerKwh: 53.48
  });
  assert.deepEqual(
    normalizeTariffSelection({
      tariffId: 'standard-over-400',
      period: 'day',
      rateAmdPerKwh: 1
    }),
    DEFAULT_OFFICIAL_TARIFF
  );
});

test('official selections resolve day/night and social rates from the registry', () => {
  for (const [selection, expected] of [
    [{ tariffId: 'standard-up-to-200', period: 'day' }, 46.48],
    [{ tariffId: 'standard-up-to-200', period: 'night' }, 36.48],
    [{ tariffId: 'standard-201-to-400', period: 'day' }, 48.48],
    [{ tariffId: 'standard-over-400', period: 'night' }, 43.48],
    [{ tariffId: 'social-vulnerable', period: 'day' }, 29.99],
    [{ tariffId: 'social-vulnerable', period: 'night' }, 19.99]
  ]) {
    assert.equal(resolveTariffSelectionRate(selection), expected);
  }
  assert.equal(resolveTariffSelectionRate({ rateAmdPerKwh: '53' }), 53);
});

test('known kWh suggests the exact standard bracket, including decimal boundaries', () => {
  for (const [kwh, tariffId] of [
    [150, 'standard-up-to-200'],
    [200, 'standard-up-to-200'],
    [200.01, 'standard-201-to-400'],
    [300, 'standard-201-to-400'],
    [400, 'standard-201-to-400'],
    [400.01, 'standard-over-400'],
    [500, 'standard-over-400']
  ]) {
    assert.deepEqual(suggestOfficialTariffSelection(DEFAULT_OFFICIAL_TARIFF, kwh), {
      tariffId,
      period: 'day'
    });
  }
  assert.deepEqual(
    suggestOfficialTariffSelection({ tariffId: 'social-vulnerable', period: 'night' }, 520),
    { tariffId: 'social-vulnerable', period: 'night' }
  );
});

test('bill amounts never infer a bracket, while usage and monthly profile provide a suggestion input', () => {
  assert.equal(
    monthlyKwhForTariffSuggestion({ mode: 'bill', averageMonthlyBillAmd: 25_000 }),
    null
  );
  assert.equal(monthlyKwhForTariffSuggestion({ mode: 'usage', averageMonthlyKwh: 520 }), 520);
  assert.equal(
    monthlyKwhForTariffSuggestion({ mode: 'monthly', monthlyKwh: Array(12).fill(300) }),
    300
  );
});

test('Quick and Professional share the exact official and custom session descriptors', () => {
  const values = new Map();
  const session = createCalculatorSession({
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    }
  });
  const official = { tariffId: 'standard-201-to-400', period: 'night' };
  session.write({ consumption: { mode: 'usage', averageMonthlyKwh: 300 }, userTariff: official });
  assert.deepEqual(session.read().userTariff, official);

  const custom = { rateAmdPerKwh: 53 };
  session.write({
    consumption: { mode: 'bill', averageMonthlyBillAmd: 25_000 },
    userTariff: custom
  });
  assert.deepEqual(session.read().userTariff, custom);
});

test('tariff provenance names official and user-provided values without exposing IDs', () => {
  const strings = {
    officialTariff: 'Official tariff',
    userProvidedTariff: 'User-provided tariff',
    tariffDay: 'Day',
    tariffNight: 'Night',
    tariffCategories: { 'standard-over-400': 'Over 400 kWh/month' }
  };
  assert.equal(
    formatTariffProvenance({
      tariff: {
        kind: 'registry',
        tariffId: 'standard-over-400',
        period: 'day',
        rateAmdPerKwh: 53.48
      },
      strings
    }),
    'Official tariff · Over 400 kWh/month · Day · 53.48 AMD/kWh'
  );
  assert.equal(
    formatTariffProvenance({ tariff: { kind: 'user', rateAmdPerKwh: 53 }, strings }),
    'User-provided tariff · 53 AMD/kWh'
  );
});
