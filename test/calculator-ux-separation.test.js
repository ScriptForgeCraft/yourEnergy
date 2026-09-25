import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { readStylesheet } from './helpers/styles.js';
import { equipmentProductHref } from '../src/ui/calculator/results-view.js';

const root = resolve(import.meta.dirname, '..');
const source = (path) =>
  path.endsWith('.css')
    ? readStylesheet(new URL(`../${path}`, import.meta.url))
    : readFile(resolve(root, path), 'utf8');

test('Quick keeps maps and professional fields out of its initial markup', async () => {
  const quick = await source('src/templates/calculator-quick.hbs');
  for (const forbidden of [
    'data-property-map',
    'data-roof-map-host',
    'data-consumption-month',
    'data-roof-tilt',
    'data-roof-orientation',
    'data-roof-mounting-mode',
    'data-calculation-panel',
    'data-storage-required',
    'P25',
    'P50',
    'P75'
  ]) {
    assert.equal(quick.includes(forbidden), false, `Quick markup exposes ${forbidden}`);
  }
  assert.match(quick, /id='quick-calculator'/u);
});

test('Professional has exactly four customer steps and retains every engineering input', async () => {
  const [professional, controller, resultsView] = await Promise.all([
    source('src/templates/calculator.hbs'),
    source('src/ui/calculator-wizard.js'),
    source('src/ui/calculator/results-view.js')
  ]);
  assert.equal((professional.match(/data-wizard-step='/gu) ?? []).length, 4);
  assert.doesNotMatch(professional, /System configuration|Best choice|Most popular/u);
  for (const marker of [
    'data-location-latitude',
    'data-location-longitude',
    'data-consumption-month',
    'data-roof-tilt',
    'data-roof-orientation',
    'data-roof-mounting-mode',
    'data-storage-required',
    'data-consumption-switch-monthly',
    "data-consumption-unit='amd'",
    'professional-roof-mounting-select',
    'professional-roof-notice'
  ]) {
    assert.match(professional, new RegExp(marker, 'u'));
  }
  assert.match(professional, /professional-roof-parameters/u);
  assert.match(professional, /data-wizard-restart/u);
  assert.match(professional, /wizard\.results\.calculationTitle/u);
  assert.match(professional, /wizard\.results\.benefits/u);
  assert.match(professional, /professional-technology/u);
  assert.match(professional, /wizard\.results\.technologyTitle/u);
  for (const marker of [
    'data-professional-lead-open',
    'data-professional-lead-dialog',
    'data-professional-lead-form',
    'data-professional-lead-status',
    'data-professional-lead-success'
  ]) {
    assert.ok(professional.includes(marker), `missing Professional lead marker: ${marker}`);
  }
  assert.match(professional, /<select\b[^>]*\bdata-roof-mounting-mode\b/u);
  assert.match(professional, /class='consumption-estimate'/u);
  assert.match(
    professional,
    /class='consumption-estimate__value'><output data-consumption-annual>/u
  );
  assert.doesNotMatch(professional, /data-roof-add-center/u);
  assert.doesNotMatch(professional, /data-roof-enter-area/u);
  assert.match(professional, /data-location-region/u);
  assert.match(professional, /data-location-locality/u);
  assert.match(professional, /data-potential-summary/u);
  assert.match(professional, /potential-monthly-details/u);
  assert.doesNotMatch(professional, /data-potential-summary-chart/u);
  assert.doesNotMatch(professional, /data-optional-upload/u);
  assert.match(controller, /ARMENIA_REGION_CENTERS/u);
  assert.match(controller, /localitiesForRegion/u);
  assert.match(controller, /localityCenter/u);
  assert.match(controller, /locateSelectedLocality/u);
  assert.match(controller, /map\?\.focusLocation\(center\)/u);
  assert.match(controller, /mapController\?\.finishRoof\(\)/u);
  assert.match(controller, /if \(state\.sitePotential\) renderPotential\(state\.sitePotential\)/u);
  assert.doesNotMatch(controller, /renderBars\(potentialSummaryChart/u);
  assert.doesNotMatch(professional, /data-calculation-panel/u);
  assert.match(controller, /getDefaultCalculatorSystem/u);
  assert.match(controller, /equipment: \{ panelId: recommendedPanelId \}/u);
  assert.doesNotMatch(controller, /session\.selectPanel\(panelId\)/u);
  assert.match(controller, /storageRequired: state\.storageRequired/u);
  assert.match(controller, /analysisMatchesPanel/u);
  assert.match(controller, /analysisMatchesStorageRequest/u);
  assert.match(controller, /storageRequired\?\.addEventListener\('change'/u);
  assert.match(controller, /buildProfessionalLeadContext/u);
  assert.match(controller, /professionalLeadForm\.setAttribute\('aria-busy', 'true'\)/u);
  assert.match(controller, /wizard\.lead\?\.resultUnavailable/u);
  assert.match(controller, /wizard\.lead\?\.formUnavailable/u);
  assert.match(controller, /professionalLeadDialog\.setAttribute\('open', ''\)/u);
  assert.match(resultsView, /analysis\.inverterRecommendation/u);
  assert.match(resultsView, /wizard\.inverterRecommendationTitle/u);
  assert.match(resultsView, /analysis\.mountingHardwareRecommendation/u);
  assert.match(resultsView, /wizard\.mountingHardwareTitle/u);
  assert.match(resultsView, /analysis\.storageRecommendation/u);
  assert.match(resultsView, /wizard\.storageRecommendationTitle/u);
  assert.match(resultsView, /result-overview__metric/u);
  assert.match(resultsView, /metrics\?\.annualCoverage/u);
  assert.match(resultsView, /metrics\?\.recommendedPower/u);
  assert.match(resultsView, /metrics\?\.panelCount/u);
  assert.match(controller, /createEquipmentCatalog/u);
  assert.match(resultsView, /card\.dataset\.recommendedProduct/u);
  assert.match(resultsView, /card\.target = '_blank'/u);
  assert.match(resultsView, /card\.rel = 'noopener noreferrer'/u);
  assert.doesNotMatch(controller, /issue === 'outline' \|\| issue === 'area'/u);
});

test('Professional product links preserve the recommendation ID in every locale', () => {
  const productId = 'longi-hi-mo-x10-guardian-lr7-72hvdf';

  assert.equal(equipmentProductHref(productId, 'hy-AM'), `/equipment/?product=${productId}`);
  assert.equal(equipmentProductHref(productId, 'ru-RU'), `/ru/equipment/?product=${productId}`);
  assert.equal(equipmentProductHref(productId, 'en-US'), `/en/equipment/?product=${productId}`);
});

test('Professional results use coverage terminology and retain the two PVGIS yield contexts', async () => {
  const [resultsView, modes, wizard, en, ru, hy] = await Promise.all([
    source('src/ui/calculator/results-view.js'),
    source('src/content/calculator-modes.js'),
    source('src/content/calculator-wizard.js'),
    source('src/content/en.js'),
    source('src/content/ru.js'),
    source('src/content/hy.js')
  ]);

  assert.match(resultsView, /monthlyComparisonChart/u);
  assert.match(resultsView, /annualNetSurplusHelp/u);
  assert.match(resultsView, /roofCapacityNotLimiting/u);
  assert.doesNotMatch(modes, /selfConsumption/u);
  assert.match(modes, /annualCoverage/u);
  assert.match(wizard, /pvgisReferenceYield/u);
  for (const content of [en, ru, hy]) {
    assert.doesNotMatch(content, /cacheHit|cacheMiss/u);
    assert.match(content, /PVGIS/u);
  }
});

test('one calculator exposes two modes and migrates historic routes safely', async () => {
  const [quick, migration, controller, generator] = await Promise.all([
    source('src/templates/calculator-quick.hbs'),
    source('src/templates/calculator-migration.hbs'),
    source('src/ui/calculator-mode.js'),
    source('scripts/build/page-contexts.mjs')
  ]);
  assert.match(quick, /data-calculator-mode-stage/u);
  assert.equal((quick.match(/data-calculator-mode=/gu) ?? []).length >= 2, true);
  assert.match(controller, /professionalSource/u);
  assert.match(controller, /syncLanguageLinks/u);
  assert.match(controller, /searchParams\.set\('mode', 'pro'\)/u);
  assert.match(migration, /http-equiv='refresh'/u);
  assert.match(generator, /createProfessionalCalculatorLanguageLinks/u);
  assert.doesNotMatch(generator, /renderRefineCalculator|roof-refinement/u);
});

test('Professional restores completed results and keeps inactive steps out of layout', async () => {
  const [controller, styles] = await Promise.all([
    source('src/ui/calculator-wizard.js'),
    source('src/styles/tools.css')
  ]);

  assert.match(controller, /syncRoofControls\(\{ preserveAnalysis: true \}\)/u);
  assert.match(controller, /root\.dataset\.currentStep = String\(target\)/u);
  assert.match(controller, /wizard\.results\?\.title/u);
  assert.match(controller, /window\.scrollTo\(\{ top: 0, left: 0, behavior: 'instant' \}\)/u);
  assert.match(
    styles,
    /\.calculator-page--professional \.wizard-step\[hidden\][^{]*\{[^}]*display: none !important;/su
  );
});

test('Professional location actions are honest, searchable and recoverable', async () => {
  const [template, controller, config] = await Promise.all([
    source('src/templates/calculator.hbs'),
    source('src/ui/calculator-wizard.js'),
    source('vite.config.js')
  ]);

  assert.match(template, /data-location-search-results/u);
  assert.match(template, /data-clear-address/u);
  assert.match(template, /addressSearchDisclosure/u);
  assert.match(template, /addressSearchAttribution/u);
  assert.doesNotMatch(template, /professional-upload-tab|data-optional-upload/u);
  assert.match(controller, /api\.geocode\(\{ query, locale \}/u);
  assert.match(controller, /navigator\.geolocation\.getCurrentPosition/u);
  assert.match(controller, /locationSearchResults\.hidden = false/u);
  assert.match(config, /Permissions-Policy:.*geolocation=\(self\)/u);
  assert.doesNotMatch(
    controller,
    /data-use-current-location[\s\S]*setLocationAtCenter/u,
    'current location must not silently use the map centre'
  );
});
