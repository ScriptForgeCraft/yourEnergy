import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_CALCULATOR_PANEL_ID,
  getCalculatorSystemForPanel,
  getDefaultCalculatorSystem,
  getSolarPanelCalculationProfile
} from '../src/data/equipment/calculator/defaults.js';
import { getSolarPanelById, getSolarPanels } from '../src/data/equipment/calculator/catalog.js';
import { buildSolarAnalysis } from '../src/domain/index.js';

const source = { kind: 'provider', status: 'confirmed', provider: 'PVGIS fixture' };

test('the configured default resolves panel watts, physical area and provenance from the catalog', () => {
  const panel = getSolarPanelById(DEFAULT_CALCULATOR_PANEL_ID);
  const system = getDefaultCalculatorSystem();

  assert.ok(panel);
  assert.equal(system?.panelWatts, panel.calculation.panelWatts);
  assert.equal(system?.panelAreaSqm, panel.calculation.panelAreaSqm);
  assert.deepEqual(system?.equipment, {
    panelId: panel.id,
    panelBrand: panel.brand,
    panelModel: panel.model,
    panelWatts: panel.calculation.panelWatts,
    panelAreaSqm: panel.calculation.panelAreaSqm,
    source: 'equipment-catalog'
  });
});

test('a normalized panel profile includes only calculation fields present in the catalog', () => {
  const defaultPanel = getSolarPanelById(DEFAULT_CALCULATOR_PANEL_ID);
  const defaultProfile = getSolarPanelCalculationProfile(DEFAULT_CALCULATOR_PANEL_ID);
  const degradationPanel = getSolarPanels().find(
    (panel) => panel.calculation.annual_degradation_percent !== undefined
  );
  const degradationProfile = getSolarPanelCalculationProfile(degradationPanel?.id);

  assert.deepEqual(defaultProfile, {
    id: defaultPanel.id,
    brand: defaultPanel.brand,
    productName: defaultPanel.product_name,
    model: defaultPanel.model,
    watts: defaultPanel.calculation.panelWatts,
    areaSqm: defaultPanel.calculation.panelAreaSqm,
    dimensionsMm: {
      length: defaultPanel.calculation.dimensions_mm.length_mm,
      width: defaultPanel.calculation.dimensions_mm.width_mm,
      thickness: defaultPanel.calculation.dimensions_mm.thickness_mm
    },
    efficiencyPercent: defaultPanel.calculation.series_max_efficiency_percent,
    bifacialityPercent: defaultPanel.calculation.bifaciality_percent_nominal
  });
  assert.equal('annualDegradationPercent' in defaultProfile, false);
  assert.equal(
    degradationProfile?.annualDegradationPercent,
    degradationPanel.calculation.annual_degradation_percent
  );
});

test('a 100 m² roof at 70% usable area applies the catalog panel area once', () => {
  const system = getDefaultCalculatorSystem();
  const panel = getSolarPanelById(DEFAULT_CALCULATOR_PANEL_ID);
  const analysis = buildSolarAnalysis({
    consumption: { annualKwh: 30_000 },
    roof: {
      areaSqm: 100,
      usableAreaRatio: 0.7,
      orientationDegrees: 180,
      tiltDegrees: 30,
      polygonComplete: true
    },
    production: { annualYieldKwhPerKwp: 1_000, source },
    system,
    scenarioTargets: [{ id: 'roof-limited', targetCoverage: 1 }],
    selectedScenarioId: 'roof-limited'
  });
  const scenario = analysis.selectedScenario;
  const expectedPanelCount = Math.floor((100 * 0.7) / panel.calculation.panelAreaSqm);

  assert.equal(expectedPanelCount, 25);
  assert.equal(scenario.system.panelWatts, panel.calculation.panelWatts);
  assert.equal(scenario.system.panelAreaSqm, panel.calculation.panelAreaSqm);
  assert.equal(scenario.system.maximumPanelCount, expectedPanelCount);
  assert.equal(scenario.system.panelCount, expectedPanelCount);
  assert.equal(scenario.system.capacityKwp, 16.25);
  assert.equal(scenario.system.equipment.panelId, DEFAULT_CALCULATOR_PANEL_ID);
  assert.deepEqual(analysis.equipment, scenario.system.equipment);
  assert.ok(scenario.limitations.includes('ROOF_CAPACITY_LIMIT'));
});

test('another calculation-ready panel can be selected without a copied technical default', () => {
  const [defaultPanel, alternatePanel] = getSolarPanels();
  const alternateSystem = getCalculatorSystemForPanel(alternatePanel.id);

  assert.equal(defaultPanel.id, DEFAULT_CALCULATOR_PANEL_ID);
  assert.notEqual(alternatePanel.id, defaultPanel.id);
  assert.equal(alternateSystem?.panelWatts, alternatePanel.calculation.panelWatts);
  assert.equal(alternateSystem?.panelAreaSqm, alternatePanel.calculation.panelAreaSqm);
  assert.equal(alternateSystem?.equipment.panelId, alternatePanel.id);
  assert.equal(alternateSystem?.equipment.panelModel, alternatePanel.model);
});

test('a selected catalog panel supplies panel count, installed kWp and provenance without changing PVGIS yield', () => {
  const selectedPanel = getSolarPanels()[1];
  const system = getCalculatorSystemForPanel(selectedPanel.id);
  const analysis = buildSolarAnalysis({
    consumption: { annualKwh: 9_000 },
    production: { annualYieldKwhPerKwp: 1_000, source },
    system,
    scenarioTargets: [{ id: 'selected-panel', targetCoverage: 1 }],
    selectedScenarioId: 'selected-panel'
  });
  const scenario = analysis.selectedScenario;
  const expectedPanelCount = Math.ceil((9 * 1000) / selectedPanel.calculation.panelWatts);

  assert.equal(scenario.system.panelCount, expectedPanelCount);
  assert.equal(
    scenario.system.capacityKwp,
    (expectedPanelCount * selectedPanel.calculation.panelWatts) / 1000
  );
  assert.equal(scenario.system.equipment.panelId, selectedPanel.id);
  assert.equal(analysis.equipment.panelModel, selectedPanel.model);
  assert.equal(scenario.generation.annualKwh, scenario.system.capacityKwp * 1_000);
});
