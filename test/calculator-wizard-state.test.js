import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculatePreliminaryPolygonArea,
  getRoofOutlineState,
  isRepeatedRoofFinishClick,
  shouldFinishRoofOnDoubleClick
} from '../src/services/property-map.js';
import {
  applyPotentialOutcome,
  createCalculatorWizardState,
  deriveWizardStepStates,
  isWizardStepAccessible,
  WIZARD_STEP_STATUSES
} from '../src/ui/calculator-wizard-state.js';
import { getRoofValidationIssue, roofAreaForDisplay } from '../src/ui/calculator-wizard.js';

const completePotential = Object.freeze({
  annualYieldKwhPerKwp: 1532,
  monthlyYieldKwhPerKwp: [70, 86, 113, 145, 168, 181, 186, 173, 148, 116, 78, 68]
});

test('rapid clicks on different roof corners are not mistaken for a finish double-click', () => {
  assert.equal(isRepeatedRoofFinishClick({ detail: 2, distanceMeters: 8 }), false);
  assert.equal(isRepeatedRoofFinishClick({ detail: 3, distanceMeters: 2 }), false);
  assert.equal(isRepeatedRoofFinishClick({ detail: 2, distanceMeters: 0.2 }), true);
  assert.equal(isRepeatedRoofFinishClick({ detail: 1, distanceMeters: 0 }), false);
  assert.equal(shouldFinishRoofOnDoubleClick({ pointCount: 3, repeatedClick: false }), false);
  assert.equal(shouldFinishRoofOnDoubleClick({ pointCount: 3, repeatedClick: true }), true);
  assert.equal(shouldFinishRoofOnDoubleClick({ pointCount: 2, repeatedClick: true }), false);
});

test('three valid roof corners are a complete outline without a separate finish flag', () => {
  const outline = getRoofOutlineState([
    { lat: 40.18, lng: 44.51 },
    { lat: 40.18, lng: 44.51012 },
    { lat: 40.18012, lng: 44.51012 }
  ]);

  assert.equal(outline.points.length, 3);
  assert.equal(outline.simplePolygon, true);
  assert.equal(outline.complete, true);
  assert.ok(outline.areaSqm > 0);
});

test('the Roof step shows contour area before tilt is known', () => {
  assert.equal(
    roofAreaForDisplay({
      areaMethod: 'map-projected',
      projectedAreaSqm: 84.37,
      effectiveAreaSqm: null
    }),
    84.37
  );
  assert.equal(
    roofAreaForDisplay({
      areaMethod: 'measured-plane',
      projectedAreaSqm: 84.37,
      effectiveAreaSqm: 92.5
    }),
    92.5
  );
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

test('roof validation points to the exact missing input in a recoverable order', () => {
  const base = {
    areaMethod: 'map-projected',
    polygonComplete: false,
    effectiveAreaSqm: null,
    azimuthDegrees: 180,
    tiltDegrees: 30
  };

  assert.equal(getRoofValidationIssue(base), 'outline');
  assert.equal(getRoofValidationIssue({ ...base, simplePolygon: false }), 'self-intersection');
  assert.equal(
    getRoofValidationIssue({
      ...base,
      polygonComplete: true,
      effectiveAreaSqm: 82.4,
      distanceFromPropertyMeters: 501
    }),
    'distance'
  );
  assert.equal(getRoofValidationIssue({ ...base, areaMethod: 'measured-plane' }), 'area');
  assert.equal(
    getRoofValidationIssue({
      ...base,
      polygonComplete: true,
      effectiveAreaSqm: null,
      azimuthDegrees: null,
      tiltDegrees: null
    }),
    'orientation'
  );
  assert.equal(
    getRoofValidationIssue({
      ...base,
      polygonComplete: true,
      effectiveAreaSqm: null,
      tiltDegrees: null
    }),
    'tilt'
  );
  assert.equal(
    getRoofValidationIssue({
      ...base,
      polygonComplete: true,
      effectiveAreaSqm: null,
      tiltDegrees: 80
    }),
    'area'
  );
  assert.equal(
    getRoofValidationIssue({
      ...base,
      polygonComplete: true,
      effectiveAreaSqm: 82.4,
      azimuthDegrees: null
    }),
    'orientation'
  );
  assert.equal(
    getRoofValidationIssue({
      ...base,
      polygonComplete: true,
      effectiveAreaSqm: 82.4,
      tiltDegrees: null
    }),
    'tilt'
  );
  assert.equal(
    getRoofValidationIssue({ ...base, polygonComplete: true, effectiveAreaSqm: 82.4 }),
    null
  );
});
