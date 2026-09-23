import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '../functions/_lib/http.js';
import { validateAnalysisInput } from '../functions/_lib/pvgis.js';
import { validateP0AnalysisWorkflow } from '../functions/_lib/solar-analysis.js';
import {
  CALCULATOR_INPUT_LIMITS,
  createUserTariffSelection,
  normalizeConsumption,
  normalizeRoof,
  parseDecimalNumber
} from '../src/domain/index.js';
import { getDefaultCalculatorSystem } from '../src/data/equipment/calculator-defaults.js';

const validP0Body = () => ({
  property: {
    address: 'Manual point',
    latitude: 40.18,
    longitude: 44.51,
    confirmed: true,
    source: 'manual'
  },
  consumption: { averageMonthlyKwh: 850 },
  roof: {
    areaMethod: 'map-projected',
    mountingMode: 'roof-parallel',
    projectedAreaSqm: 70,
    polygonComplete: true,
    tiltDegrees: 30,
    azimuthDegrees: 180
  },
  system: { capacityKwp: 1, lossPercent: 14 }
});

test('calculator numbers accept localized decimal input and reject malformed numeric text', () => {
  assert.equal(parseDecimalNumber(' 1 234,50 '), 1234.5);
  assert.equal(parseDecimalNumber('1,234.5'), 1234.5);
  assert.equal(parseDecimalNumber('1.234,5'), 1234.5);
  assert.equal(parseDecimalNumber('0,25'), 0.25);

  for (const value of ['', '   ', 'NaN', 'Infinity', '-Infinity', '12e3', 'one hundred']) {
    assert.equal(parseDecimalNumber(value), null, `${value} must be rejected`);
  }
});

test('consumption and user tariff bounds reject invalid or extreme inputs while retaining commercial scale', () => {
  const tariff = createUserTariffSelection({ rateAmdPerKwh: '46,48' }, '2026-09-08');
  const bill = normalizeConsumption({ averageMonthlyBillAmd: '25 000,50' }, { tariff });
  const commercial = normalizeConsumption({ annualKwh: 50_000_000 });

  assert.equal(tariff.available, true);
  assert.equal(tariff.tariff.rateAmdPerKwh, 46.48);
  assert.equal(bill.available, true);
  assert.equal(bill.averageMonthlyBillAmd, 25_000.5);
  assert.equal(commercial.available, true);
  assert.equal(commercial.annualKwh, 50_000_000);

  for (const value of ['', 'NaN', 'Infinity', '-1', '0', 100_000_000 / 12 + 1]) {
    assert.equal(
      normalizeConsumption({ averageMonthlyKwh: value }).available,
      false,
      `${value} must not be accepted as monthly consumption`
    );
  }
  assert.equal(
    normalizeConsumption({ annualKwh: CALCULATOR_INPUT_LIMITS.annualConsumptionKwh.maximum + 1 })
      .available,
    false
  );
  assert.equal(
    normalizeConsumption(
      { averageMonthlyBillAmd: CALCULATOR_INPUT_LIMITS.averageMonthlyBillAmd.maximum + 1 },
      { tariff }
    ).available,
    false
  );
  assert.equal(
    createUserTariffSelection(
      { rateAmdPerKwh: CALCULATOR_INPUT_LIMITS.customTariffAmdPerKwh.maximum + 1 },
      '2026-09-08'
    ).available,
    false
  );
});

test('roof and PVGIS request validation accepts decimal commas but rejects unsafe values', () => {
  const roof = normalizeRoof({
    areaSqm: '1 234,5',
    tiltDegrees: '30,5',
    orientationDegrees: '180,25'
  });
  assert.equal(roof.areaSqm, 1234.5);
  assert.equal(roof.tiltDegrees, 30.5);
  assert.equal(roof.orientationDegrees, 180.25);
  assert.equal(
    normalizeRoof({ areaSqm: CALCULATOR_INPUT_LIMITS.roofAreaSqm.maximum + 1 }).areaSqm,
    null
  );

  const valid = validateAnalysisInput({
    property: { latitude: '40,18', longitude: '44.51' },
    system: { capacityKwp: 1, lossPercent: 14 },
    roof: { tiltDegrees: '30,5', azimuthDegrees: '180,25' }
  });
  assert.equal(valid.roof.tiltDegrees, 30.5);
  assert.equal(valid.roof.azimuthDegrees, 180.25);
  assert.throws(
    () =>
      validateAnalysisInput({
        property: { latitude: 40.18, longitude: 44.51 },
        system: { capacityKwp: 1, lossPercent: 14 },
        roof: { tiltDegrees: 'Infinity', azimuthDegrees: 180 }
      }),
    ApiError
  );
});

test('the server rejects an unknown calculation panel before a provider request can start', () => {
  const body = validP0Body();
  const validated = validateAnalysisInput(body);
  assert.throws(
    () =>
      validateP0AnalysisWorkflow({ ...body, equipment: { panelId: 'unknown-panel' } }, validated),
    ApiError
  );

  const accepted = validateP0AnalysisWorkflow(
    { ...body, equipment: { panelId: getDefaultCalculatorSystem().equipment.panelId } },
    validated
  );
  assert.equal(
    accepted.calculatorSystem.equipment.panelId,
    getDefaultCalculatorSystem().equipment.panelId
  );
});
