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
  const [professional, controller, resultsView, propertyMap] = await Promise.all([
    source('src/templates/calculator.hbs'),
    source('src/ui/calculator-wizard.js'),
    source('src/ui/calculator/results-view.js'),
    source('src/services/property-map.js')
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
  assert.doesNotMatch(professional, /data-wizard-restart/u);
  assert.match(professional, /pro-result-layout/u);
  assert.match(professional, /data-result-hero-actions/u);
  assert.match(professional, /data-download-pdf/u);
  assert.match(professional, /wizard\.results\.nextCopy/u);
  assert.match(professional, /wizard\.results\.downloadReport/u);
  assert.match(professional, /wizard\.results\.editCalculation/u);
  assert.doesNotMatch(professional, /professional-technology/u);
  for (const marker of [
    'data-professional-lead-open',
    'data-professional-lead-dialog',
    'data-professional-lead-form',
    'data-professional-lead-status',
    'data-professional-lead-success',
    'data-professional-lead-content',
    'data-professional-lead-dismiss'
  ]) {
    assert.ok(professional.includes(marker), `missing Professional lead marker: ${marker}`);
  }
  assert.match(professional, /<select\b[^>]*\bdata-roof-mounting-mode\b/u);
  assert.doesNotMatch(professional, /data-wizard-nav='\{\{@index\}\}'[^>]*aria-label=/u);
  assert.match(professional, /class='consumption-estimate'/u);
  assert.match(
    professional,
    /class='consumption-estimate__value'><output data-consumption-annual>/u
  );
  assert.doesNotMatch(professional, /data-roof-add-center/u);
  assert.doesNotMatch(professional, /data-roof-enter-area/u);
  assert.doesNotMatch(professional, /data-roof-finish/u);
  assert.doesNotMatch(professional, /professional-roof-map__tip/u);
  assert.match(professional, /professional-roof-map__tools/u);
  assert.match(professional, /<details class='professional-roof-map__analysis'>/u);
  assert.match(professional, /professional-roof-map__analysis-panel/u);
  for (const marker of [
    'data-roof-line-width',
    'data-roof-point-radius',
    'data-roof-point-numbers',
    'data-roof-undo',
    'data-roof-reset'
  ]) {
    assert.match(professional, new RegExp(marker, 'u'));
  }
  assert.match(controller, /setRoofLineWeight\(roofLineWidth\?\.value\)/u);
  assert.match(controller, /setRoofPointRadius\(roofPointRadius\?\.value\)/u);
  assert.match(controller, /setRoofPointNumbers\(roofPointNumbers\?\.checked \?\? true\)/u);
  assert.match(controller, /roofMapTools\?\.removeAttribute\('open'\)/u);
  assert.match(controller, /roofMapAnalysis\?\.removeAttribute\('open'\)/u);
  assert.match(controller, /target\?\.closest\('\.leaflet-container'\)/u);
  assert.match(propertyMap, /setRoofLineWeight\(value\)[\s\S]*?drawRoof\(\)/u);
  assert.match(propertyMap, /setRoofPointRadius\(value\)[\s\S]*?drawRoof\(\)/u);
  assert.match(propertyMap, /setRoofPointNumbers\(visible\)[\s\S]*?drawRoof\(\)/u);
  assert.match(professional, /data-location-region/u);
  assert.match(professional, /data-location-locality/u);
  assert.match(professional, /data-location-map-wrap hidden/u);
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
  assert.match(controller, /if \(target === 0\)[\s\S]*?mountMap\('location'\)/u);
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
  assert.match(controller, /professionalLeadContent\.hidden = true/u);
  assert.match(controller, /professionalLeadDismiss\.hidden = true/u);
  assert.match(controller, /professionalLeadSuccess\.focus\(\)/u);
  assert.match(controller, /wizard\.lead\?\.resultUnavailable/u);
  assert.match(controller, /wizard\.lead\?\.formUnavailable/u);
  assert.match(controller, /professionalLeadDialog\.setAttribute\('open', ''\)/u);
  assert.match(resultsView, /analysis\.inverterRecommendation/u);
  assert.match(resultsView, /wizard\.inverterRecommendationTitle/u);
  assert.match(resultsView, /analysis\.mountingHardwareRecommendation/u);
  assert.match(resultsView, /wizard\.mountingHardwareTitle/u);
  assert.match(resultsView, /analysis\.storageRecommendation/u);
  assert.match(resultsView, /wizard\.storageRecommendationTitle/u);
  assert.match(resultsView, /pro-result-hero__metric/u);
  assert.match(resultsView, /term\.prepend\(symbol\)/u);
  assert.doesNotMatch(resultsView, /wrapper\.append\(symbol,/u);
  assert.match(resultsView, /equipmentImageSrcset/u);
  assert.match(resultsView, /metrics\?\.annualCoverage/u);
  assert.match(resultsView, /metrics\?\.recommendedPower/u);
  assert.match(resultsView, /metrics\?\.annualSavings/u);
  assert.match(controller, /createEquipmentCatalog/u);
  assert.match(controller, /loadDisplayProducts/u);
  assert.doesNotMatch(controller, /import \{ createEquipmentCatalog \} from/u);
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

test('Professional results use coverage terminology without duplicate production details', async () => {
  const [resultsView, modes, wizard, en, ru, hy] = await Promise.all([
    source('src/ui/calculator/results-view.js'),
    source('src/content/calculator-modes.js'),
    source('src/content/calculator-wizard.js'),
    source('src/content/en.js'),
    source('src/content/ru.js'),
    source('src/content/hy.js')
  ]);

  assert.match(resultsView, /pro-result-production__heading/u);
  assert.doesNotMatch(resultsView, /annualNetSurplusHelp/u);
  assert.match(resultsView, /roofCapacityNotLimiting/u);
  assert.doesNotMatch(modes, /selfConsumption/u);
  assert.match(modes, /annualCoverage/u);
  assert.match(wizard, /pvgisReferenceYield/u);
  for (const content of [en, ru, hy]) {
    assert.doesNotMatch(content, /cacheHit|cacheMiss/u);
    assert.match(content, /PVGIS/u);
  }
});

test('Professional result supplements are not hidden behind a legacy presentation flag', async () => {
  const resultsView = await source('src/ui/calculator/results-view.js');

  assert.doesNotMatch(resultsView, /legacyResultPresentation/u);
  assert.match(resultsView, /const storage = analysis\.storageRecommendation;\s*if \(storage\)/u);
  assert.match(resultsView, /const basis = calculationBasisDetail\(analysis\.calculationBasis\)/u);
  assert.match(resultsView, /ROOF_CAPACITY_LIMIT/u);
  assert.match(resultsView, /environmental\.treeEquivalent/u);
  assert.match(resultsView, /monthlyComparisonChart\(\{/u);
});

test('one calculator exposes two modes and migrates historic routes safely', async () => {
  const [quick, migration, controller, entry, main, generator] = await Promise.all([
    source('src/templates/calculator-quick.hbs'),
    source('src/templates/calculator-migration.hbs'),
    source('src/ui/calculator-mode.js'),
    source('src/ui/calculator-mode-entry.js'),
    source('src/main.js'),
    source('scripts/build/page-contexts.mjs')
  ]);
  assert.match(quick, /data-calculator-mode-stage/u);
  assert.equal((quick.match(/data-calculator-mode=/gu) ?? []).length >= 2, true);
  assert.match(controller, /professionalSource/u);
  assert.match(controller, /syncLanguageLinks/u);
  assert.match(controller, /searchParams\.set\('mode', 'pro'\)/u);
  assert.match(controller, /reserveStageSpace/u);
  assert.match(controller, /stage\.style\.minHeight/u);
  assert.match(quick, /calculator-mode-entry\.js/u);
  assert.match(entry, /initCalculatorMode/u);
  assert.match(main, /!document\.querySelector\('\[data-calculator-mode-stage\]'\)/u);
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
  assert.match(controller, /const ADDRESS_SEARCH_DEBOUNCE_MS = 1_000/u);
  assert.match(controller, /address\?\.addEventListener\('input', scheduleAddressSearch\)/u);
  assert.match(controller, /window\.setTimeout\([\s\S]*ADDRESS_SEARCH_DEBOUNCE_MS/u);
  assert.match(controller, /addEventListener\('click', searchAddressImmediately\)/u);
  assert.match(controller, /event\.key !== 'Enter'[\s\S]*searchAddressImmediately\(\)/u);
  assert.match(controller, /navigator\.geolocation\.getCurrentPosition/u);
  assert.match(controller, /locationSearchResults\.hidden = false/u);
  assert.match(config, /Permissions-Policy:.*geolocation=\(self\)/u);
  assert.doesNotMatch(
    controller,
    /data-use-current-location[\s\S]*setLocationAtCenter/u,
    'current location must not silently use the map centre'
  );
});
