import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createEquipmentCatalog } from '../src/data/equipment/catalog.js';
import {
  EQUIPMENT_COPY,
  findUnlocalizedStrings,
  missingEquipmentTranslations
} from '../src/data/equipment/equipment-i18n.js';
import { productFromDeepLink } from '../src/ui/equipment-showroom.js';

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

test('every published SolaX card has a source record', () => {
  const publishedSourceIds = new Set([
    'x1-lite-lv',
    'tbat-lv-d53',
    ...solaxData.products.map(({ source }) => source.packId)
  ]);
  const sourceIds = new Set(solaxSource.primary_products.map(({ id }) => id));
  assert.ok([...publishedSourceIds].every((id) => sourceIds.has(id)));
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

test('every published showroom asset exists in the public equipment collection', async () => {
  const publicAssets = await listFiles(new URL('assets/equipment/', publicRoot));
  const referencedAssets = new Set([
    data.hero.background,
    ...data.products.flatMap((product) => [
      product.image,
      product.datasheetPdf,
      ...product.documents.map(({ url }) => url)
    ])
  ]);
  const publicAssetPaths = new Set(publicAssets.map(publicPath));
  assert.ok([...referencedAssets].every((path) => publicAssetPaths.has(path)));
});

test('localized catalogues share every technical identifier and provide complete HY/EN copy', () => {
  const ruCatalog = createEquipmentCatalog('ru');
  missingEquipmentTranslations.clear();
  for (const locale of ['hy', 'en']) {
    const catalog = createEquipmentCatalog(locale);
    assert.deepEqual(
      catalog.categories.map(({ id }) => id),
      ruCatalog.categories.map(({ id }) => id)
    );
    assert.deepEqual(
      catalog.products.map(({ id }) => id),
      ruCatalog.products.map(({ id }) => id)
    );
    assert.deepEqual(
      catalog.products.map(({ image, datasheetPdf }) => ({ image, datasheetPdf })),
      ruCatalog.products.map(({ image, datasheetPdf }) => ({ image, datasheetPdf }))
    );
    assert.deepEqual(
      catalog.products.map(({ brand, name }) => ({ brand, name })),
      ruCatalog.products.map(({ brand, name }) => ({ brand, name }))
    );
    assert.deepEqual(findUnlocalizedStrings(catalog), []);
  }
  assert.deepEqual([...missingEquipmentTranslations], []);
});

test('localized LONGi Guardian uses the canonical display strings', () => {
  const hy = createEquipmentCatalog('hy').products.find(
    ({ id }) => id === 'longi-hi-mo-x10-guardian-lr7-72hvdf'
  );
  const en = createEquipmentCatalog('en').products.find(
    ({ id }) => id === 'longi-hi-mo-x10-guardian-lr7-72hvdf'
  );
  assert.equal(hy.model, 'LR7-72HVDF');
  assert.equal(en.model, 'LR7-72HVDF');
  assert.equal(hy.powerRange, '640–665 Վտ');
  assert.equal(en.powerRange, '640–665 W');
  assert.equal(
    hy.shortDescription,
    'Բարձր արդյունավետությամբ կրկնակի ապակյա մոդուլ՝ HPBC 2.0 տեխնոլոգիայով և Anti-Dust կառուցվածքով՝ բարդ պայմաններում հուսալի աշխատանքի համար։'
  );
  assert.equal(
    en.shortDescription,
    'High-efficiency dual-glass module with HPBC 2.0 and an Anti-Dust design for reliable performance in demanding conditions.'
  );
});

test('a valid product deep link opens the requested localized showroom product', () => {
  const productId = 'longi-hi-mo-x10-guardian-lr7-72hvdf';
  const products = createEquipmentCatalog('en').products;
  const productById = new Map(products.map((product) => [product.id, product]));
  const selected = productFromDeepLink(productById, products[0], `?product=${productId}`);

  assert.equal(selected?.id, productId);
  assert.equal(selected?.category, 'solar-panels');
  assert.ok(selected?.image);
  assert.ok(selected?.shortDescription);
  assert.ok(Object.keys(selected?.specs ?? {}).length);
  assert.ok(selected?.highlights?.length);
  assert.ok(selected?.documents?.length);
});

test('an invalid product deep link falls back to the normal showroom default', () => {
  const products = createEquipmentCatalog('hy').products;
  const productById = new Map(products.map((product) => [product.id, product]));

  assert.equal(
    productFromDeepLink(productById, products[0], '?product=not-a-catalog-product'),
    products[0]
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

test('equipment has a complete static first product before JavaScript runs', async () => {
  const html = await readFile(new URL('../equipment/index.html', import.meta.url), 'utf8');
  const [product] = createEquipmentCatalog('hy').products;

  assert.match(
    html,
    new RegExp(`<h1 id='equipment-title' data-page-title>${EQUIPMENT_COPY.hy.page.title}</h1>`, 'u')
  );
  assert.match(html, new RegExp(`<h2 data-product-name>${product.name}</h2>`, 'u'));
  assert.match(
    html,
    new RegExp(`<p class='product-panel__model' data-product-model>${product.model}</p>`, 'u')
  );
  assert.match(html, /data-accordion-label='specs'>[^<]+<[/]span>/u);
  assert.doesNotMatch(html, /<h[1-3][^>]*><\/h[1-3]>/u);
  assert.doesNotMatch(html, /cellOrientation/u);
  assert.doesNotMatch(html, /կավելացվի ավելի ուշ/u);
});
