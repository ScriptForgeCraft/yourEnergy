import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const source = (path) => readFile(resolve(root, path), 'utf8');

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
  const [professional, controller] = await Promise.all([
    source('src/templates/calculator.hbs'),
    source('src/ui/calculator-wizard.js')
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
    'data-optional-upload',
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
  assert.match(professional, /<select data-roof-mounting-mode>/u);
  assert.match(professional, /class='consumption-estimate'/u);
  assert.match(
    professional,
    /class='consumption-estimate__value'><output data-consumption-annual>/u
  );
  assert.doesNotMatch(professional, /data-roof-add-center/u);
  assert.doesNotMatch(professional, /data-roof-enter-area/u);
  assert.match(professional, /data-location-region/u);
  assert.match(professional, /data-location-locality/u);
  assert.match(controller, /ARMENIA_REGION_CENTERS/u);
  assert.match(controller, /localitiesForRegion/u);
  assert.match(controller, /localityCenter/u);
  assert.match(controller, /locateSelectedLocality/u);
  assert.match(controller, /map\?\.focusLocation\(center\)/u);
  assert.match(controller, /mapController\?\.finishRoof\(\)/u);
  assert.match(controller, /getCalculatorSystemForPanel/u);
  assert.match(controller, /equipment: \{ panelId: state\.selectedPanelId \}/u);
  assert.match(controller, /storageRequired: state\.storageRequired/u);
  assert.match(controller, /session\.selectPanel\(panelId\)/u);
  assert.match(controller, /analysisMatchesPanel/u);
  assert.match(controller, /analysisMatchesStorageRequest/u);
  assert.match(controller, /storageRequired\?\.addEventListener\('change'/u);
  assert.match(controller, /analysis\.inverterRecommendation/u);
  assert.match(controller, /wizard\.inverterRecommendationTitle/u);
  assert.match(controller, /analysis\.storageRecommendation/u);
  assert.match(controller, /wizard\.storageRecommendationTitle/u);
  assert.doesNotMatch(controller, /issue === 'outline' \|\| issue === 'area'/u);
});

test('one calculator exposes two modes and migrates historic routes safely', async () => {
  const [quick, migration, controller, generator] = await Promise.all([
    source('src/templates/calculator-quick.hbs'),
    source('src/templates/calculator-migration.hbs'),
    source('src/ui/calculator-mode.js'),
    source('scripts/generate-pages.mjs')
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
  const [template, controller, config, headers] = await Promise.all([
    source('src/templates/calculator.hbs'),
    source('src/ui/calculator-wizard.js'),
    source('vite.config.js'),
    source('public/_headers')
  ]);

  assert.match(template, /data-location-search-results/u);
  assert.match(template, /data-clear-address/u);
  assert.match(template, /addressSearchDisclosure/u);
  assert.match(template, /addressSearchAttribution/u);
  assert.match(template, /fieldset[\s\S]*professional-upload-tab/u);
  assert.match(controller, /api\.geocode\(\{ query, locale \}/u);
  assert.match(controller, /navigator\.geolocation\.getCurrentPosition/u);
  assert.match(controller, /locationSearchResults\.hidden = false/u);
  assert.match(config, /Permissions-Policy:.*geolocation=\(self\)/u);
  assert.match(headers, /Permissions-Policy:.*geolocation=\(self\)/u);
  assert.doesNotMatch(
    controller,
    /data-use-current-location[\s\S]*setLocationAtCenter/u,
    'current location must not silently use the map centre'
  );
});
