import assert from 'node:assert/strict';
import test from 'node:test';

import { getDefaultCalculatorSystem } from '../src/data/equipment/calculator-defaults.js';
import { ARMENIA_TARIFF_DATASET } from '../src/data/tariffs/armenia.js';
import {
  CALCULATION_BASIS_SOURCE_TYPE,
  buildRegionalQuickAnalysis,
  buildSolarAnalysis,
  createRegistryTariffSelection
} from '../src/domain/index.js';

const pvgisSource = {
  kind: 'provider',
  status: 'confirmed',
  provider: 'PVGIS',
  verifiedAt: '2026-09-23T10:00:00.000Z'
};

test('property-level calculation basis identifies PVGIS, catalog IDs, a roof assumption and the tariff registry', () => {
  const system = getDefaultCalculatorSystem();
  const analysis = buildSolarAnalysis({
    property: {
      coordinates: { lat: 40.18, lng: 44.51 },
      confirmed: true,
      source: { kind: 'manual', status: 'confirmed' }
    },
    consumption: { annualKwh: 9_000 },
    roof: {
      areaSqm: 60,
      usableAreaRatio: 0.7,
      mountingMode: 'elevated',
      orientationDegrees: 180,
      tiltDegrees: 30
    },
    production: { annualYieldKwhPerKwp: 1_500, source: pvgisSource },
    system,
    tariffSelection: createRegistryTariffSelection(
      { tariffId: 'standard-201-to-400', period: 'day' },
      ARMENIA_TARIFF_DATASET
    ),
    calculationConfig: { systemLossPercent: 14, mountingPlace: 'free' },
    mountingRecommendation: {
      basis: 'pvgis-fixed-free-standing-optimum',
      tiltDegrees: 27
    },
    scenarioTargets: [{ id: 'sized', targetCoverage: 1 }],
    selectedScenarioId: 'sized'
  });
  const basis = analysis.calculationBasis;

  assert.equal(basis.coordinates.sourceType, CALCULATION_BASIS_SOURCE_TYPE.USER_INPUT);
  assert.equal(basis.solarYield.sourceType, CALCULATION_BASIS_SOURCE_TYPE.PVGIS_RESULT);
  assert.equal(basis.solarYield.source.provider, 'PVGIS');
  assert.equal(basis.solarYield.configuration.systemLossPercent, 14);
  assert.equal(basis.solarYield.configuration.mountingPlace, 'free');
  assert.equal(
    basis.usableRoofRatio.sourceType,
    CALCULATION_BASIS_SOURCE_TYPE.CALCULATOR_ASSUMPTION
  );
  assert.equal(basis.usableRoofRatio.ratio, 0.7);
  assert.deepEqual(
    {
      productId: basis.solarModule.productId,
      watts: basis.solarModule.panelWatts,
      areaSqm: basis.solarModule.panelAreaSqm,
      sourceType: basis.solarModule.sourceType
    },
    {
      productId: system.equipment.panelId,
      watts: system.panelWatts,
      areaSqm: system.panelAreaSqm,
      sourceType: CALCULATION_BASIS_SOURCE_TYPE.CATALOG_TECHNICAL_VALUE
    }
  );
  assert.equal(basis.inverter.sourceType, CALCULATION_BASIS_SOURCE_TYPE.PRELIMINARY_RECOMMENDATION);
  assert.equal(basis.inverter.productId, analysis.inverterRecommendation.productId);
  assert.equal(basis.mounting.productId, analysis.mountingHardwareRecommendation.productId);
  assert.equal(basis.tariff.sourceType, CALCULATION_BASIS_SOURCE_TYPE.REGISTRY_VALUE);
  assert.equal(basis.tariff.tariffId, 'standard-201-to-400');
  assert.equal(basis.tariff.revision, ARMENIA_TARIFF_DATASET.revision);
  assert.deepEqual(
    analysis.sourceLedger
      .filter((entry) => ['panel', 'inverter', 'mounting-hardware'].includes(entry.key))
      .map((entry) => ({
        key: entry.key,
        kind: entry.source.kind,
        reference: entry.source.reference
      })),
    [
      { key: 'panel', kind: 'catalog', reference: system.equipment.panelId },
      { key: 'inverter', kind: 'catalog', reference: analysis.inverterRecommendation.productId },
      {
        key: 'mounting-hardware',
        kind: 'catalog',
        reference: analysis.mountingHardwareRecommendation.productId
      }
    ]
  );
});

test('regional Quick provenance stays a representative point and retains actual PVGIS configuration', () => {
  const analysis = buildRegionalQuickAnalysis({
    region: {
      id: 'yerevan',
      coordinates: { latitude: 40.1792, longitude: 44.4991 },
      source: { kind: 'manual', status: 'provided' }
    },
    consumption: { annualKwh: 9_000 },
    production: { annualYieldKwhPerKwp: 1_500, source: pvgisSource },
    calculationConfig: { systemLossPercent: 14, mountingPlace: 'free' }
  });

  assert.equal(
    analysis.calculationBasis.coordinates.sourceType,
    CALCULATION_BASIS_SOURCE_TYPE.REGIONAL_REFERENCE
  );
  assert.equal(analysis.calculationBasis.coordinates.regionId, 'yerevan');
  assert.equal(analysis.calculationBasis.solarYield.configuration.systemLossPercent, 14);
  assert.equal(analysis.calculationBasis.solarModule.productId, analysis.equipment.panelId);
});
