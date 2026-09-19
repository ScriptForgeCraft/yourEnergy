import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const existingData = JSON.parse(
  await readFile(new URL('../src/data/equipment/equipment-data.json', import.meta.url), 'utf8')
);
const solaxData = JSON.parse(
  await readFile(new URL('../src/data/equipment/solax-products.json', import.meta.url), 'utf8')
);
const solaxSource = JSON.parse(
  await readFile(new URL('../src/data/equipment/solax-source.json', import.meta.url), 'utf8')
);
const data = {
  ...existingData,
  categories: solaxData.categories,
  products: [...existingData.products, ...solaxData.products]
};
const localAsset = (path) => new URL(`../public${path}`, import.meta.url);
const publicRoot = new URL('../public/', import.meta.url);
const documentContents = new Map();
const loadDocument = (url) => {
  if (!documentContents.has(url)) documentContents.set(url, readFile(localAsset(url)));
  return documentContents.get(url);
};
const listFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const path = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
        return entry.isDirectory() ? listFiles(path) : [path];
      })
    )
  ).flat();
};
const publicPath = (file) =>
  `/${relative(fileURLToPath(publicRoot), fileURLToPath(file)).replaceAll('\\', '/')}`;

test('equipment products have unique ids and complete interactive content', () => {
  assert.equal(new Set(data.products.map(({ id }) => id)).size, data.products.length);
  for (const product of data.products) {
    assert.ok(data.categories.some(({ id, enabled }) => id === product.category && enabled));
    assert.equal(product.hotspots.length, 5);
    assert.equal(new Set(product.hotspots.map(({ id }) => id)).size, 5);
    assert.ok(product.hotspots.every(({ label, text }) => label && text));
    assert.ok(product.highlights.length && Object.keys(product.specs).length);
    assert.ok(product.documents.some(({ url }) => url === product.datasheetPdf));
  }
});

test('every primary SolaX catalog series has a published equipment card', () => {
  const publishedSourceIds = new Set([
    'x1-lite-lv',
    'tbat-lv-d53',
    ...solaxData.products.map(({ source }) => source.packId)
  ]);
  assert.deepEqual(publishedSourceIds, new Set(solaxSource.primary_products.map(({ id }) => id)));
  assert.equal(solaxSource.ecosystem_components.length, 12);
});

test('equipment images and customer-named PDF downloads exist and fit the static asset budget', async () => {
  for (const product of data.products) {
    assert.ok((await stat(localAsset(product.image))).size > 0);
    for (const document of product.documents) {
      assert.match(document.url.split('/').pop(), /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*\.pdf$/u);
      assert.ok(document.pages > 0 && document.language && document.sizeLabel);
      const file = await loadDocument(document.url);
      assert.equal(file.subarray(0, 5).toString(), '%PDF-');
      assert.ok(file.length < 25 * 1024 * 1024, document.url);
    }
  }
});

test('every public equipment asset is referenced by a published showroom card', async () => {
  const publicAssets = await listFiles(new URL('assets/equipment/', publicRoot));
  const referencedAssets = new Set([
    data.hero.background,
    ...data.products.flatMap((product) => [
      product.image,
      product.datasheetPdf,
      ...product.documents.map(({ url }) => url)
    ])
  ]);
  assert.deepEqual(
    new Set(publicAssets.map(publicPath)),
    referencedAssets,
    'remove an unused public asset or add it to an explicitly published showroom card'
  );
});

test('new products use sourced data and do not invent mounting warranty or current prices', () => {
  const panel = data.products.find(({ id }) => id === 'znshine-zxnr-bd132');
  assert.equal(panel.powerRange, '620–650 Вт');
  assert.equal(panel.specs.dimensions, '2382 × 1134 × 30 мм');
  assert.equal(panel.specs.maxEfficiency, '24,1% (650 Вт, STC)');
  const mounting = data.products.find(({ id }) => id === 'gck-triangle-2200');
  assert.ok(mounting.warrantyNote && mounting.documentsNote && mounting.imageNote);
  assert.equal(mounting.specs.warranty, undefined);
  assert.equal(mounting.price, undefined);
  assert.equal(data.products.filter(({ model }) => model === 'LR8-66HVD').length, 1);
});

test('equipment keeps a flat interactive hotspot layer and no pointer-follow parallax', async () => {
  const css = await readFile(new URL('../src/styles/equipment.css', import.meta.url), 'utf8');
  const js = await readFile(new URL('../src/ui/equipment-showroom.js', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /addEventListener\(['"](?:mousemove|pointermove)/u);
  assert.doesNotMatch(css, /preserve-3d|translateZ/u);
  assert.match(css, /\.product-hotspots\s*\{[^}]*z-index:\s*2;/u);
  assert.match(css, /\.product-hotspot\s*\{[^}]*pointer-events:\s*auto;/u);
  assert.match(js, /link\.download = url\.split/u);
});
