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
    'P25',
    'P50',
    'P75'
  ]) {
    assert.equal(quick.includes(forbidden), false, `Quick markup exposes ${forbidden}`);
  }
  assert.match(quick, /id='quick-calculator'/u);
});

test('Professional has exactly four customer steps and retains every engineering input', async () => {
  const professional = await source('src/templates/calculator.hbs');
  assert.equal((professional.match(/data-wizard-step='/gu) ?? []).length, 4);
  assert.doesNotMatch(professional, /System configuration|Best choice|Most popular/u);
  for (const marker of [
    'data-location-latitude',
    'data-location-longitude',
    'data-consumption-month',
    'data-roof-tilt',
    'data-roof-orientation',
    'data-roof-mounting-mode',
    'data-optional-upload'
  ]) {
    assert.match(professional, new RegExp(marker, 'u'));
  }
  assert.match(professional, /class='professional-panel'/u);
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
  assert.match(migration, /http-equiv='refresh'/u);
  assert.match(generator, /professionalShellFile|professionalHref/u);
  assert.doesNotMatch(generator, /renderRefineCalculator|roof-refinement/u);
});
