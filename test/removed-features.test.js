import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const source = (path) => readFile(resolve(root, path), 'utf8');

test('obsolete public sections, routes and selectors are absent from the active source tree', async () => {
  const files = await Promise.all(
    [
      'src/templates/home.hbs',
      'src/templates/calculator.hbs',
      'src/templates/support.hbs',
      'src/templates/partials/site-header.hbs',
      'src/templates/partials/site-footer.hbs',
      'src/ui/scrollers.js',
      'src/styles/sections.css',
      'src/styles/tools.css',
      'scripts/generate-pages.mjs',
      'public/robots.txt'
    ].map(source)
  );
  const activeSource = files.join('\n').toLowerCase();
  for (const token of [
    'testimonials',
    'myenergy',
    '/soon/',
    'calculator-workspace-menu',
    'calculator-offer',
    'project-before-after',
    'support-anchor-list',
    'tool-hero__grid',
    'tool-intro',
    'tool-privacy',
    'tool-reference',
    'tool-input-unit',
    'tool-or',
    'offer-scope',
    'tool-form-actions',
    'tool-no-js'
  ]) {
    assert.equal(activeSource.includes(token), false, `obsolete token remains: ${token}`);
  }
});

test('page generator only emits useful support routes', async () => {
  const generator = await source('scripts/generate-pages.mjs');
  assert.match(generator, /'privacy\/index\.html'/u);
  assert.match(generator, /'terms\/index\.html'/u);
  assert.doesNotMatch(generator, /soon/iu);
});
