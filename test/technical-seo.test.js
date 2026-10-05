import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createPageRegistry } from '../src/config/routes.js';
import { siteRoot } from '../scripts/build/paths.mjs';
import { resolve } from 'node:path';
import { equipmentImageUrl, equipmentImageSrcset } from '../src/config/equipment-images.js';

test('each locale has a real noindex error document and no missing navigation runtime', async () => {
  const pages = await createPageRegistry();
  assert.equal(pages.filter(({ kind }) => kind === 'not-found').length, 3);
  for (const page of pages) {
    const html = await readFile(resolve(siteRoot, page.file), 'utf8');
    if (page.kind === 'not-found') assert.match(html, /noindex,follow/u);
    if (html.includes('data-mobile-menu'))
      assert.match(html, /src='\/src\/(?:main|equipment)\.js'/u, page.path);
  }
});

test('about hero signals preserve a text boundary between title and description', async () => {
  const template = await readFile(new URL('../src/templates/about.hbs', import.meta.url), 'utf8');
  assert.match(template, /<strong>\{\{title\}\}<\/strong>&#32;<small>\{\{copy\}\}<\/small>/u);

  for (const file of ['about/index.html', 'ru/about/index.html', 'en/about/index.html']) {
    const html = await readFile(resolve(siteRoot, file), 'utf8');
    const signals = [
      ...html.matchAll(/<span><strong>[^<]+<\/strong>&#32;<small>[^<]+<\/small><\/span>/gu)
    ];
    assert.equal(signals.length, 3, file);
    assert.doesNotMatch(html, /<span><strong>[^<]+<\/strong><small>[^<]+<\/small><\/span>/u, file);
  }
});

test('indexable pages have unique titles and descriptions within each locale', async () => {
  const pages = await createPageRegistry();
  const titles = new Set();
  const descriptions = new Set();
  for (const page of pages.filter(({ indexable }) => indexable)) {
    const html = await readFile(resolve(siteRoot, page.file), 'utf8');
    const title = html.match(/<title>(.*?)<\/title>/u)?.[1];
    const description = html.match(/<meta name='description' content='([^']+)'/u)?.[1];
    assert.ok(title && description, page.path);
    for (const [set, value] of [
      [titles, title],
      [descriptions, description]
    ]) {
      const key = `${page.locale}:${value}`;
      assert.ok(!set.has(key), `Duplicate metadata: ${page.path}: ${value}`);
      set.add(key);
    }
    const siblings = pages.filter(
      (candidate) =>
        candidate.indexable &&
        candidate.kind === page.kind &&
        candidate.slug === page.slug &&
        candidate.article?.hy.slug === page.article?.hy.slug
    );
    for (const sibling of siblings)
      assert.ok(
        html.includes(`hreflang='${sibling.locale}' href='https://yourenergy.am${sibling.path}'`),
        `${page.path}: missing reciprocal ${sibling.locale}`
      );
    assert.ok(html.includes("hreflang='x-default'"), page.path);
  }
});

test('equipment variants only transform registered product PNG URLs', () => {
  assert.equal(
    equipmentImageUrl('/assets/equipment/products/panel.png'),
    '/assets/equipment/products/panel-960.webp'
  );
  assert.equal(
    equipmentImageUrl('/assets/equipment/products/panel.png', 320),
    '/assets/equipment/products/panel-320.webp'
  );
  assert.equal(equipmentImageUrl(null), null);
  assert.equal(equipmentImageUrl('/icons.svg'), '/icons.svg');
  assert.equal(equipmentImageSrcset('/icons.svg'), '');
  assert.equal(
    equipmentImageSrcset('/assets/equipment/products/panel.png', [160, 640]),
    '/assets/equipment/products/panel-160.webp 160w, /assets/equipment/products/panel-640.webp 640w'
  );
});

test('shared navigation keeps visible keyboard focus and bounded mobile-menu imagery', async () => {
  const css = await readFile(new URL('../src/styles/main.css', import.meta.url), 'utf8');
  const header = await readFile(
    new URL('../src/templates/partials/site-header.hbs', import.meta.url),
    'utf8'
  );
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*3px solid/u);
  assert.doesNotMatch(css, /:focus-visible\s*\{[^}]*outline:\s*(?:none|0)/u);
  assert.match(header, /src='\/yourenergy-mark.svg' width='39' height='39'/u);
});
