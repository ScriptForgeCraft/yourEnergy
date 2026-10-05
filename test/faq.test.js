import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import en from '../src/content/en.js';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';
import { siteRoot } from '../scripts/build/paths.mjs';

const locales = [
  { key: 'hy', content: hy, faqFile: 'faq/index.html', homeFile: 'index.html' },
  { key: 'ru', content: ru, faqFile: 'ru/faq/index.html', homeFile: 'ru/index.html' },
  { key: 'en', content: en, faqFile: 'en/faq/index.html', homeFile: 'en/index.html' }
];

const semanticIds = (content) => content.faq.items.map(({ id }) => id);
const categoryIds = (content) => content.faq.categories.map(({ id }) => id);
const faqAnswer = (content, id) => content.faq.items.find((item) => item.id === id).answer;

test('FAQ locales share semantic questions and complete category mappings', () => {
  const expectedQuestions = semanticIds(hy);
  const expectedCategories = categoryIds(hy);

  for (const { content } of locales) {
    assert.deepEqual(semanticIds(content), expectedQuestions);
    assert.deepEqual(categoryIds(content), expectedCategories);
    assert.equal(new Set(semanticIds(content)).size, content.faq.items.length);
    assert.ok(content.faq.items.every(({ category }) => expectedCategories.includes(category)));
    assert.equal(content.faq.categories.find(({ id }) => id === 'all').label.length > 0, true);
  }
});

test('sensitive FAQ answers are customer-facing, not editorial instructions', () => {
  const editorialMarkers = {
    financing: [/FAQ/u, /сайте только/u, /should only be published/u],
    warranty: [/На сайте следует/u, /Ցուցադրել միայն/u, /should be displayed/u],
    permits: [/Сайт не должен/u, /Կայքը չպետք է/u, /website should not/u],
    'solar-passport-pdf': [/FAQ/u, /share-link/u, /public share link/u]
  };

  for (const { content } of locales) {
    for (const [id, markers] of Object.entries(editorialMarkers)) {
      const answer = faqAnswer(content, id);
      for (const marker of markers) assert.doesNotMatch(answer, marker, `${id}: ${marker}`);
    }
  }
});

test('generated FAQ pages expose deep links, local search hooks and one FAQPage graph', async () => {
  for (const { content, faqFile } of locales) {
    const html = await readFile(resolve(siteRoot, faqFile), 'utf8');
    const json = html.match(/type='application\/ld\+json'>(.*?)<\/script>/u)?.[1];
    const graph = JSON.parse(json);
    const faqGraph = graph['@graph'].filter(({ '@type': type }) => type === 'FAQPage');

    assert.match(html, /data-faq-search/u);
    assert.match(html, /<details id='faq-professional-calculator'/u);
    assert.match(html, /id='category-cost-payback'/u);
    assert.match(html, /id='faq-payback'/u);
    assert.match(html, /class='faq-guide'/u);
    assert.equal(faqGraph.length, 1);
    assert.equal(faqGraph[0].mainEntity.length, content.faq.items.length);
  }
});

test('homepage FAQ preview routes point to their own category anchors', async () => {
  const expectedTargets = [
    'category-cost-payback',
    'category-warranty-service',
    'category-documents-permits',
    'category-storage'
  ];

  for (const { homeFile } of locales) {
    const html = await readFile(resolve(siteRoot, homeFile), 'utf8');
    const destinations = [...html.matchAll(/href='[^']*#(category-[a-z-]+)'/gu)].map(
      ([, target]) => target
    );
    assert.deepEqual(destinations.slice(-4), expectedTargets);
  }
});

test('FAQ enhancement stays external and keeps shared page chrome', async () => {
  const [template, module, stylesheet] = await Promise.all([
    readFile(new URL('../src/templates/faq.hbs', import.meta.url), 'utf8'),
    readFile(new URL('../src/faq.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/styles/faq.css', import.meta.url), 'utf8')
  ]);

  assert.match(template, /\{\{> site-header\}\}/u);
  assert.match(template, /\{\{> site-footer\}\}/u);
  assert.match(template, /<details id='faq-\{\{id\}\}'/u);
  assert.doesNotMatch(template, /\bon(?:click|input|change)=/u);
  assert.doesNotMatch(module, /innerHTML|onclick|oninput/u);
  assert.doesNotMatch(stylesheet, /rgb\(249 247 241/u);
  assert.match(stylesheet, /@media \(max-width: 680px\)/u);
});
