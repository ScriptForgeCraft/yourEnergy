import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PriceBookRepository,
  TEMPORARY_YOURENERGY_PRICEBOOK,
  buildCommercialEstimate,
  buildSolarAnalysis,
  compareOffer,
  createUserTariffSelection,
  getUsableTariffRate,
  normalizeConsumption
} from '../src/domain/index.js';

const ACTIVE_DATE = '2026-08-31';

const STANDARD_SCOPE = Object.freeze({
  panels: true,
  inverter: true,
  mounting: true,
  'standard-installation': true,
  'basic-grid-connection': true
});

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

const realAnalysisInputs = Object.freeze({
  effectiveDate: ACTIVE_DATE,
  property: {
    address: 'Manual property confirmation',
    coordinates: { lat: 40.18, lng: 44.51 },
    confirmed: true,
    source: { kind: 'manual', status: 'confirmed' }
  },
  consumption: { annualKwh: 12_000 },
  roof: {
    areaSqm: 100,
    usableAreaRatio: 0.7,
    orientationDegrees: 180,
    tiltDegrees: 30,
    polygonComplete: true,
    source: { kind: 'manual', status: 'confirmed' }
  },
  production: {
    annualYieldKwhPerKwp: 1_500,
    monthlyYieldFactors: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    source: { kind: 'provider', status: 'confirmed', provider: 'Test PVGIS adapter' }
  },
  system: { panelWatts: 580, panelAreaSqm: 2 },
  priceBook: TEMPORARY_YOURENERGY_PRICEBOOK
});

test('temporary price book produces rounded P25/P50/P75 commercial planning estimates', () => {
  const repository = new PriceBookRepository({
    records: [TEMPORARY_YOURENERGY_PRICEBOOK],
    clock: () => new Date(`${ACTIVE_DATE}T12:00:00.000Z`)
  });
  const priceBook = repository.getActive({ region: 'AM', systemType: 'residential-grid-tied' });
  const estimate = buildCommercialEstimate({
    capacityKwp: 6,
    priceBook,
    at: ACTIVE_DATE
  });

  assert.equal(priceBook.version, 'v0.1');
  assert.equal(estimate.available, true);
  assert.equal(estimate.kind, 'temporary');
  assert.deepEqual(estimate.ratesAmdPerWp, { p25: 232, p50: 247, p75: 264 });
  assert.deepEqual(estimate.rangeAmd, {
    p25: 1_390_000,
    p50: 1_480_000,
    p75: 1_580_000
  });
  assert.equal(estimate.primaryAmd, 1_480_000);
  assert.equal(estimate.validUntil, '2026-09-28');
  assertFiniteTree(estimate);
});

test('price book expires instead of silently serving a successor price', () => {
  const repository = new PriceBookRepository({ records: [TEMPORARY_YOURENERGY_PRICEBOOK] });
  const afterExpiry = '2026-09-29';
  const expired = buildCommercialEstimate({
    capacityKwp: 6,
    priceBook: TEMPORARY_YOURENERGY_PRICEBOOK,
    at: afterExpiry
  });

  assert.equal(repository.getActive({ at: afterExpiry }), null);
  assert.equal(expired.available, false);
  assert.equal(expired.reason, 'PRICEBOOK_EXPIRED');
  assert.equal(expired.primaryAmd, null);
  assertFiniteTree(expired);
});

test('a user-entered tariff is usable but remains distinguishable from unavailable tariff evidence', () => {
  const userTariff = createUserTariffSelection({ rateAmdPerKwh: 52 }, ACTIVE_DATE);
  const invalidTariff = createUserTariffSelection({ rateAmdPerKwh: 0 }, ACTIVE_DATE);
  const billWithUserTariff = normalizeConsumption(
    { averageMonthlyBillAmd: 5_200 },
    { tariff: userTariff }
  );
  const billWithoutTariff = normalizeConsumption({ averageMonthlyBillAmd: 5_200 });

  assert.equal(userTariff.kind, 'user');
  assert.equal(userTariff.available, true);
  assert.equal(userTariff.tariff.status, 'provided');
  assert.equal(getUsableTariffRate(userTariff), 52);
  assert.equal(billWithUserTariff.available, true);
  assert.equal(billWithUserTariff.averageMonthlyKwh, 100);
  assert.equal(invalidTariff.available, false);
  assert.equal(invalidTariff.reason, 'USER_TARIFF_INVALID');
  assert.equal(getUsableTariffRate(invalidTariff), null);
  assert.equal(billWithoutTariff.available, false);
  assert.ok(billWithoutTariff.issues.includes('TARIFF_REQUIRED_FOR_BILL'));
  assertFiniteTree(userTariff);
  assertFiniteTree(billWithUserTariff);
});

test('a real analysis with no tariff publishes no savings, payback or financial timeline', () => {
  const unavailableTariff = createUserTariffSelection({ rateAmdPerKwh: null }, ACTIVE_DATE);
  const analysis = buildSolarAnalysis({
    ...realAnalysisInputs,
    tariffSelection: unavailableTariff
  });
  const scenario = analysis.selectedScenario;

  assert.equal(analysis.financial.tariff.kind, 'unavailable');
  assert.equal(scenario.status, 'technical-ready');
  assert.equal(scenario.financial.annualSavingsAmd, null);
  assert.equal(scenario.financial.grossSavings25YearsAmd, null);
  assert.equal(scenario.financial.paybackYears, null);
  assert.deepEqual(scenario.financial.timeline, []);
  assert.ok(scenario.commercialEstimate.available);
  assertFiniteTree(analysis);
});

test('Offer Checker only compares a complete standard scope and returns P1 range statuses', () => {
  const shared = {
    capacityKwp: 6,
    systemType: 'residential-grid-tied',
    inclusions: STANDARD_SCOPE,
    priceBook: TEMPORARY_YOURENERGY_PRICEBOOK,
    at: ACTIVE_DATE
  };
  const below = compareOffer({ ...shared, totalAmd: 1_380_000 });
  const within = compareOffer({ ...shared, totalAmd: 1_482_000 });
  const above = compareOffer({ ...shared, totalAmd: 1_590_000 });

  assert.equal(below.status, 'below-range');
  assert.equal(within.status, 'within-range');
  assert.equal(above.status, 'above-range');
  assert.equal(within.amdPerWp, 247);
  assertFiniteTree(below);
  assertFiniteTree(within);
  assertFiniteTree(above);
});

test('Offer Checker refuses a price verdict for battery or incomplete scope', () => {
  const shared = {
    totalAmd: 1_482_000,
    capacityKwp: 6,
    systemType: 'residential-grid-tied',
    priceBook: TEMPORARY_YOURENERGY_PRICEBOOK,
    at: ACTIVE_DATE
  };
  const battery = compareOffer({
    ...shared,
    inclusions: { ...STANDARD_SCOPE, battery: true }
  });
  const incomplete = compareOffer({
    ...shared,
    inclusions: { ...STANDARD_SCOPE, inverter: false }
  });

  assert.equal(battery.status, 'not-comparable');
  assert.equal(battery.comparable, false);
  assert.ok(battery.reasons.includes('BATTERY_SCOPE_UNSUPPORTED'));
  assert.equal(incomplete.status, 'not-comparable');
  assert.equal(incomplete.comparable, false);
  assert.ok(incomplete.reasons.includes('CORE_SCOPE_INCOMPLETE'));
  assert.deepEqual(incomplete.missingInclusions, ['inverter']);
  assertFiniteTree(battery);
  assertFiniteTree(incomplete);
});
