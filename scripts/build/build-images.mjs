import { copyFile, cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import { RESPONSIVE_IMAGE_ASSETS, IMAGE_FORMATS } from '../../src/config/image-assets.js';
import { projectRoot, publicRoot } from './paths.mjs';

const sourceDir = resolve(projectRoot, 'assets/images');
const outputDir = resolve(publicRoot, 'images');
const cacheDir = resolve(projectRoot, '.generated/image-cache');
const staticAssets = JSON.parse(
  await readFile(resolve(projectRoot, 'src/config/static-assets.json'), 'utf8')
);

// Only owned generated directories are cleared. Cached encodings are content-addressed.
await rm(publicRoot, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await mkdir(cacheDir, { recursive: true });
await cp(resolve(projectRoot, 'public'), publicRoot, { recursive: true });
const currentCache = new Set();
const outputUrls = new Set();
const assetIds = new Set();

const claimOutput = (url) => {
  if (!url.startsWith('/') || url.includes('..') || outputUrls.has(url)) {
    throw new Error(`Invalid or duplicate asset URL: ${url}`);
  }
  outputUrls.add(url);
  return resolve(publicRoot, url.slice(1));
};
const requireSource = async (source) => {
  try {
    return await readFile(source);
  } catch (cause) {
    throw new Error(`Missing canonical source asset: ${source}`, { cause });
  }
};
for (const asset of staticAssets) {
  if (assetIds.has(asset.id)) throw new Error(`Duplicate asset ID: ${asset.id}`);
  assetIds.add(asset.id);
  const source = resolve(projectRoot, asset.source);
  await requireSource(source);
  for (const url of asset.urls) {
    const destination = claimOutput(url);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }
}

for (const { name, source, widths, quality } of RESPONSIVE_IMAGE_ASSETS) {
  if (assetIds.has(name)) throw new Error(`Duplicate asset ID: ${name}`);
  assetIds.add(name);
  const sourcePath = resolve(sourceDir, `${source}.png`);
  const bytes = await requireSource(sourcePath);
  const metadata = await sharp(bytes).metadata();
  const digest = createHash('sha256')
    .update(bytes)
    .update(JSON.stringify({ widths, quality, sharp: sharp.versions, encoder: 1 }))
    .digest('hex');
  const cache = resolve(cacheDir, digest);
  currentCache.add(digest);
  await mkdir(cache, { recursive: true });
  for (const width of widths) {
    if (!metadata.width || width > metadata.width) {
      throw new Error(
        `${sourcePath}: preset requests ${width}px; original is ${metadata.width ?? 'unknown'}px. Upscaling is forbidden.`
      );
    }
    const names = IMAGE_FORMATS.map((extension) => `${name}-${width}.${extension}`);
    const cached = names.map((filename) => resolve(cache, filename));
    const ready = await Promise.all(
      cached.map((file) =>
        stat(file).then(
          () => true,
          () => false
        )
      )
    );
    if (!ready.every(Boolean)) {
      const image = sharp(bytes).resize({ width, withoutEnlargement: true });
      await Promise.all([
        image
          .clone()
          .avif({ quality: quality ?? 56, effort: 5 })
          .toFile(cached[0]),
        image
          .clone()
          .webp({ quality: quality ? 84 : 76, effort: 5 })
          .toFile(cached[1]),
        image
          .clone()
          .jpeg({ quality: quality ? 88 : 78, progressive: true, mozjpeg: true })
          .toFile(cached[2])
      ]);
    }
    for (const [index, filename] of names.entries()) {
      await copyFile(cached[index], claimOutput(`/images/${filename}`));
    }
  }
}
for (const entry of await readdir(cacheDir)) {
  if (!currentCache.has(entry))
    await rm(resolve(cacheDir, entry), { recursive: true, force: true });
}
const og = await requireSource(resolve(sourceDir, 'common/og.png'));
await sharp(og)
  .resize(1200, 630, { fit: 'cover', position: 'centre', withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true })
  .toFile(claimOutput('/og.png'));
await writeFile(
  resolve(projectRoot, '.generated/asset-urls.json'),
  JSON.stringify([...outputUrls].sort(), null, 2)
);
