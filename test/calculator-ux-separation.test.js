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

test('Refine uses internal roof defaults while Pro exposes every engineering input', async () => {
  const [refine, professional] = await Promise.all([
    source('src/templates/calculator-refine.hbs'),
    source('src/templates/calculator.hbs')
  ]);
  assert.doesNotMatch(refine, /data-refine-(?:tilt|azimuth)/u);
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
