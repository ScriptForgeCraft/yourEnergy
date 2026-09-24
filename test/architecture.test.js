import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { access, readFile, readdir } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import staticAssets from '../src/config/static-assets.json';
import { IMAGE_FORMATS, RESPONSIVE_IMAGE_ASSETS } from '../src/config/image-assets.js';
import { createPageRegistry } from '../src/config/routes.js';
import { projectRoot, siteRoot } from '../scripts/build/paths.mjs';

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const file = resolve(directory, entry.name);
        return entry.isDirectory() ? walk(file) : [file];
      })
    )
  ).flat();
};
const exists = (file) =>
  access(file).then(
    () => true,
    () => false
  );
const relativePath = (root, file) => relative(root, file).split(sep).join('/');

test('canonical assets are complete, registered once and contain no binary duplicates', async () => {
  const ids = [
    ...staticAssets.map(({ id }) => id),
    ...RESPONSIVE_IMAGE_ASSETS.map(({ name }) => name)
  ];
  assert.equal(new Set(ids).size, ids.length, 'duplicate asset registry ID');
  const urls = [
    ...staticAssets.flatMap(({ urls }) => urls),
    ...RESPONSIVE_IMAGE_ASSETS.flatMap(({ name, widths }) =>
      widths.flatMap((width) => IMAGE_FORMATS.map((ext) => `/images/${name}-${width}.${ext}`))
    ),
    '/og.png'
  ];
  assert.equal(new Set(urls).size, urls.length, 'duplicate output URL');
  assert.ok(urls.every((url) => url.startsWith('/') && !url.includes('..')));
  const registered = [
    ...staticAssets.map(({ source }) => source),
    ...RESPONSIVE_IMAGE_ASSETS.map(({ source }) => `assets/images/${source}.png`),
    'assets/images/common/og.png'
  ].sort();
  assert.equal(new Set(registered).size, registered.length, 'same original registered twice');
  const files = await walk(resolve(projectRoot, 'assets'));
  assert.deepEqual(files.map((file) => relativePath(projectRoot, file)).sort(), registered);
  const hashes = new Map();
  for (const file of files) {
    const bytes = await readFile(file);
    const digest = createHash('sha256').update(bytes).digest('hex');
    assert.equal(
      hashes.has(digest),
      false,
      `duplicate originals: ${file} and ${hashes.get(digest)}`
    );
    hashes.set(digest, file);
  }
});

test('responsive presets never upscale and preserve explicit output dimensions', async () => {
  for (const asset of RESPONSIVE_IMAGE_ASSETS) {
    const metadata = await sharp(
      resolve(projectRoot, `assets/images/${asset.source}.png`)
    ).metadata();
    assert.ok(asset.widths.length > 0);
    assert.equal(new Set(asset.widths).size, asset.widths.length);
    assert.ok(
      asset.widths.every((width) => width > 0 && width <= metadata.width),
      asset.source
    );
    if (asset.width) assert.ok(asset.widths.includes(asset.width));
  }
});

test('generated routes have one registry and no root HTML fixtures', async () => {
  const pages = await createPageRegistry();
  assert.equal(new Set(pages.map(({ file }) => file)).size, pages.length);
  assert.deepEqual(
    (await walk(siteRoot)).map((file) => relativePath(siteRoot, file)).sort(),
    pages.map(({ file }) => file).sort()
  );
  for (const page of pages) {
    assert.equal(
      await exists(resolve(projectRoot, page.file)),
      false,
      `generated root fixture: ${page.file}`
    );
    assert.ok(!page.path.includes('/soon/'));
  }
  for (const prefix of ['', 'ru/', 'en/']) {
    for (const file of [
      'calculator/index.html',
      'calculator/pro/index.html',
      'calculator/refine/index.html',
      'calculator/pro/shell.html'
    ]) {
      assert.ok(
        pages.some((page) => page.file === `${prefix}${file}`),
        `compatibility route lost: ${prefix}${file}`
      );
    }
  }
});

test('build workspaces are ignored and canonical originals are not ignored', () => {
  const ignored = execFileSync(
    'git',
    ['check-ignore', '--no-index', '.generated/site/index.html', 'dist/index.html'],
    { cwd: projectRoot, encoding: 'utf8' }
  );
  assert.match(ignored, /\.generated\/site\/index\.html/u);
  assert.match(ignored, /dist\/index\.html/u);
  assert.throws(
    () =>
      execFileSync(
        'git',
        ['check-ignore', '--no-index', 'assets/images/home/hero/hero-time-8.png'],
        { cwd: projectRoot, stdio: 'pipe' }
      ),
    (error) => error.status === 1
  );
});

test('legacy PDFs and numbered renders resolve through one canonical source', () => {
  const byUrl = new Map(
    staticAssets.flatMap((asset) => asset.urls.map((url) => [url, asset.source]))
  );
  for (const [oldName, publishedName] of [
    ['longi-lr7-72hvdf-640-665m.pdf', 'LONGi-Hi-MO-X10-Guardian-LR7-72HVDF-640-665W-EN.pdf'],
    ['longi-lr8-66hvd-640-665m.pdf', 'LONGi-Hi-MO-X10-Scientist-LR8-66HVD-640-665W-EN.pdf'],
    ['solax-t-bat-sys-lv-d53-v1-2.pdf', 'SolaX-T-BAT-SYS-LV-D53-Datasheet-EN.pdf'],
    ['solax-x1-lite-lv-datasheet-v1-5.pdf', 'SolaX-X1-Lite-LV-8-12kW-Datasheet-EN.pdf']
  ]) {
    assert.ok(byUrl.has(`/documents/${oldName}`));
    assert.equal(
      byUrl.get(`/documents/${oldName}`),
      byUrl.get(`/assets/equipment/docs/${publishedName}`)
    );
  }
  for (const number of [1, 2, 3, 4])
    assert.ok(byUrl.has(`/assets/equipment/products/${number}.png`));
  const background = staticAssets.find(({ source }) => source.endsWith('/process-background.png'));
  assert.equal(background.urls.length, 7);
});
