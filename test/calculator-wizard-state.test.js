import assert from 'node:assert/strict';
import test from 'node:test';

import { calculatePreliminaryPolygonArea } from '../src/services/property-map.js';
import {
  applyPotentialOutcome,
  createCalculatorWizardState,
  deriveWizardStepStates,
  isWizardStepAccessible,
  WIZARD_STEP_STATUSES
} from '../src/ui/calculator-wizard-state.js';
import { getTariffSemantics } from '../src/ui/consumption-input.js';

const completePotential = Object.freeze({
  annualYieldKwhPerKwp: 1532,
  monthlyYieldKwhPerKwp: [70, 86, 113, 145, 168, 181, 186, 173, 148, 116, 78, 68]
});

test('PVGIS unavailable leaves Roof available and a retry preserves roof and consumption', () => {
  let state = createCalculatorWizardState({
    confirmedProperty: { lat: 40.1801, lng: 44.5101 },
    potentialStatus: WIZARD_STEP_STATUSES.LOADING
  });

  state = applyPotentialOutcome(state, { status: WIZARD_STEP_STATUSES.UNAVAILABLE });
  let statuses = deriveWizardStepStates({
    ...state,
    roofComplete: false,
    consumptionComplete: false
  });
  assert.equal(statuses.object, WIZARD_STEP_STATUSES.COMPLETE);
  assert.equal(statuses.potential, WIZARD_STEP_STATUSES.UNAVAILABLE);
  assert.equal(statuses.roof, WIZARD_STEP_STATUSES.AVAILABLE);
  assert.equal(statuses.consumption, WIZARD_STEP_STATUSES.AVAILABLE);
  assert.equal(statuses.result, WIZARD_STEP_STATUSES.LOCKED);

  const points = [
    { lat: 40.18, lng: 44.51 },
    { lat: 40.18, lng: 44.51012 },
    { lat: 40.18012, lng: 44.51012 }
  ];
  const areaSqm = calculatePreliminaryPolygonArea(points);
  assert.ok(Number.isFinite(areaSqm));
  assert.ok(areaSqm > 0);

  state.roof = {
    points,
    areaSqm,
    complete: true,
    tiltDegrees: 30,
    azimuthDegrees: 180
  };
  state.consumption = { mode: 'usage', averageMonthlyKwh: 950 };
  const roofSnapshot = structuredClone(state.roof);
  const consumptionSnapshot = structuredClone(state.consumption);

  statuses = deriveWizardStepStates({ ...state, roofComplete: true, consumptionComplete: true });
  assert.equal(statuses.roof, WIZARD_STEP_STATUSES.COMPLETE);
  assert.equal(statuses.consumption, WIZARD_STEP_STATUSES.COMPLETE);
  assert.equal(statuses.result, WIZARD_STEP_STATUSES.LOCKED);

  state = applyPotentialOutcome(state, {
    status: WIZARD_STEP_STATUSES.COMPLETE,
    potential: completePotential
  });
  statuses = deriveWizardStepStates({ ...state, roofComplete: true, consumptionComplete: true });
  assert.equal(statuses.potential, WIZARD_STEP_STATUSES.COMPLETE);
  assert.deepEqual(state.roof, roofSnapshot);
  assert.deepEqual(state.consumption, consumptionSnapshot);
});

test('result is unavailable until a successful analysis, even when all inputs are complete', () => {
  const base = {
    confirmedProperty: { lat: 40.18, lng: 44.51 },
    potentialStatus: WIZARD_STEP_STATUSES.UNAVAILABLE,
    roofComplete: true,
    consumptionComplete: true
  };

  assert.equal(
    deriveWizardStepStates({ ...base, analysisStatus: WIZARD_STEP_STATUSES.LOCKED }).result,
    WIZARD_STEP_STATUSES.LOCKED
  );
  assert.equal(
    deriveWizardStepStates({ ...base, analysisStatus: WIZARD_STEP_STATUSES.LOADING }).result,
    WIZARD_STEP_STATUSES.LOADING
  );
  assert.equal(
    isWizardStepAccessible(WIZARD_STEP_STATUSES.LOADING, { allowLoading: false }),
    false
  );
  assert.equal(
    deriveWizardStepStates({ ...base, analysisStatus: WIZARD_STEP_STATUSES.COMPLETE }).result,
    WIZARD_STEP_STATUSES.COMPLETE
  );
});

test('tariff semantics are required only for average bill input', () => {
  const strings = {
    tariffBillLabel: 'Bill rate',
    tariffBillHelp: 'Bill help',
    tariffOptionalLabel: 'Optional rate',
    tariffOptionalHelp: 'Optional help'
  };

  assert.deepEqual(getTariffSemantics('bill', strings), {
    required: true,
    label: 'Bill rate',
    help: 'Bill help'
  });
  assert.deepEqual(getTariffSemantics('usage', strings), {
    required: false,
    label: 'Optional rate',
    help: 'Optional help'
  });
  assert.deepEqual(getTariffSemantics('monthly', strings), {
    required: false,
    label: 'Optional rate',
    help: 'Optional help'
  });
});
