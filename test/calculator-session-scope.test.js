import assert from 'node:assert/strict';
import test from 'node:test';
import { ANALYSIS_SCHEMA_VERSION } from '../src/domain/solar-analysis.js';
import { createCalculatorSession } from '../src/ui/calculator-session.js';
import {
  createProfessionalAnalysisIdentity,
  isRestorableProfessionalAnalysis
} from '../src/ui/professional-analysis-identity.js';

const sessionStorage = () => {
  const values = new Map();
  return {
    values,
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    }
  };
};

const professionalInputs = (overrides = {}) => ({
  property: { coordinates: { lat: 40.177, lng: 44.503 } },
  consumption: { kind: 'annual-kwh', annualKwh: 7_200 },
  tariff: { tariffId: 'standard', period: 'day' },
  roof: {
    areaMethod: 'map-projected',
    mountingMode: 'roof-parallel',
    projectedAreaSqm: 95,
    planeAreaSqm: null,
    polygonComplete: true,
    tiltDegrees: 25,
    orientationDegrees: 180
  },
  system: { capacityKwp: 1, lossPercent: 14 },
  panelId: 'ja-solar-jam72d40-590-mb',
  storageRequired: false,
  ...overrides
});

const professionalAnalysis = {
  scope: 'manual-roof-plane',
  schemaVersion: ANALYSIS_SCHEMA_VERSION,
  selectedScenario: { id: 'property-roof' }
};

test('a legacy Quick result migrates only into Quick state and retains shared inputs', () => {
  const { storage, values } = sessionStorage();
  const session = createCalculatorSession({ storage });
  values.set(
    session.key,
    JSON.stringify({
      version: 2,
      regionId: 'yerevan',
      consumption: { mode: 'usage', averageMonthlyKwh: 850 },
      analysis: { scope: 'regional-preliminary', selectedScenario: { id: 'regional' } },
      analysisStatus: 'complete'
    })
  );

  const restoredAfterQuickToPro = session.read();
  const restoredAfterRefresh = session.read();

  assert.equal(restoredAfterQuickToPro.quickAnalysis.selectedScenario.id, 'regional');
  assert.equal(restoredAfterQuickToPro.professionalAnalysis, null);
  assert.equal('analysis' in restoredAfterQuickToPro, false);
  assert.equal(restoredAfterQuickToPro.consumption.averageMonthlyKwh, 850);
  assert.deepEqual(restoredAfterRefresh, restoredAfterQuickToPro);
});

test('a legacy Professional result without an input fingerprint is discarded but its inputs remain', () => {
  const { storage, values } = sessionStorage();
  const session = createCalculatorSession({ storage });
  values.set(
    session.key,
    JSON.stringify({
      version: 2,
      property: { coordinates: { lat: 40.177, lng: 44.503 }, confirmed: true },
      roof: { areaMethod: 'map-projected', areaSqm: 95, complete: true },
      consumption: { kind: 'annual-kwh', annualKwh: 7_200 },
      analysis: professionalAnalysis,
      analysisStatus: 'complete'
    })
  );

  const restored = session.read();

  assert.deepEqual(restored.property.coordinates, { lat: 40.177, lng: 44.503 });
  assert.equal(restored.roof.areaSqm, 95);
  assert.equal(restored.professionalAnalysis, null);
  assert.equal(restored.professionalAnalysisStatus, 'idle');
});

test('Quick and Professional results survive their own refresh and Back/Forward snapshots', () => {
  const { storage } = sessionStorage();
  const session = createCalculatorSession({ storage });
  const inputs = professionalInputs();
  const identity = createProfessionalAnalysisIdentity(inputs);

  session.saveQuickAnalysis({
    scope: 'regional-preliminary',
    selectedScenario: { id: 'regional' }
  });
  const quickRoute = session.read();
  assert.equal(quickRoute.quickAnalysis.selectedScenario.id, 'regional');
  assert.equal(quickRoute.professionalAnalysis, null);

  session.write({
    property: inputs.property,
    consumption: inputs.consumption,
    userTariff: inputs.tariff,
    roof: inputs.roof,
    selectedPanelId: inputs.panelId
  });
  session.saveProfessionalAnalysis({
    analysis: professionalAnalysis,
    identity,
    solarPassport: { id: 'professional-passport' }
  });

  const professionalRoute = session.read();
  const backToQuick = session.read();
  const forwardToProfessional = session.read();
  assert.equal(professionalRoute.quickAnalysis.selectedScenario.id, 'regional');
  assert.equal(professionalRoute.professionalAnalysis.selectedScenario.id, 'property-roof');
  assert.equal(backToQuick.quickAnalysis.selectedScenario.id, 'regional');
  assert.equal(forwardToProfessional.professionalSolarPassport.id, 'professional-passport');
});

test('Professional restoration requires a matching property, roof, consumption and panel identity', () => {
  const inputs = professionalInputs();
  const identity = createProfessionalAnalysisIdentity(inputs);
  const matches = (candidate) =>
    isRestorableProfessionalAnalysis({
      analysis: professionalAnalysis,
      status: 'complete',
      storedIdentity: identity,
      currentIdentity: createProfessionalAnalysisIdentity(candidate)
    });

  assert.equal(matches(inputs), true);
  assert.equal(
    matches(professionalInputs({ property: { coordinates: { lat: 40.19, lng: 44.503 } } })),
    false,
    'location change invalidates Professional result'
  );
  assert.equal(
    matches(professionalInputs({ roof: { ...inputs.roof, projectedAreaSqm: 96 } })),
    false,
    'roof change invalidates Professional result'
  );
  assert.equal(
    matches(professionalInputs({ consumption: { kind: 'annual-kwh', annualKwh: 7_500 } })),
    false,
    'consumption change invalidates Professional result'
  );
  assert.equal(
    matches(professionalInputs({ panelId: 'trina-solar-tallmax-590' })),
    false,
    'panel change invalidates Professional result'
  );
});

test('changing a Professional panel clears only its incompatible property result', () => {
  const { storage } = sessionStorage();
  const session = createCalculatorSession({ storage });
  session.saveQuickAnalysis({
    scope: 'regional-preliminary',
    selectedScenario: { id: 'regional' }
  });
  session.saveProfessionalAnalysis({
    analysis: professionalAnalysis,
    identity: createProfessionalAnalysisIdentity(professionalInputs())
  });

  session.selectPanel('trina-solar-tallmax-590');
  const restored = session.read();

  assert.equal(restored.quickAnalysis.selectedScenario.id, 'regional');
  assert.equal(restored.professionalAnalysis, null);
  assert.equal(restored.professionalAnalysisStatus, 'idle');
  assert.equal(restored.professionalAnalysisIdentity, null);
});
