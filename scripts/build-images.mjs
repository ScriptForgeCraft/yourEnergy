import { mkdir, readdir, stat, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { PROCESS_IMAGE_ASSETS } from '../src/config/process-images.js';

const root = resolve(import.meta.dirname, '..');
const sourceDir = resolve(root, 'assets/source');
const outputDir = resolve(root, 'public/images');

await mkdir(outputDir, { recursive: true });

const assets = [
  { name: 'hero-time-8', source: 'hero-times/hero-time-8', widths: [640, 1024, 1600], quality: 68 },
  {
    name: 'hero-time-12',
    source: 'hero-times/hero-time-12',
    widths: [640, 1024, 1600],
    quality: 68
  },
  {
    name: 'hero-time-14',
    source: 'hero-times/hero-time-14',
    widths: [640, 1024, 1600],
    quality: 68
  },
  {
    name: 'hero-time-16',
    source: 'hero-times/hero-time-16',
    widths: [640, 1024, 1600],
    quality: 68
  },
  {
    name: 'hero-time-18',
    source: 'hero-times/hero-time-18',
    widths: [640, 1024, 1600],
    quality: 68
  },
  {
    name: 'hero-time-20',
    source: 'hero-times/hero-time-20',
    widths: [640, 1024, 1600],
    quality: 68
  },
  { name: 'roof-scan', widths: [480, 768, 1200, 1536] },
  { name: 'project-arabkir', widths: [480, 800, 1200] },
  { name: 'project-abovyan', widths: [480, 800] },
  { name: 'project-vagharshapat', widths: [480, 800] },
  { name: 'project-ararat', widths: [480, 800] },
  { name: 'engineer-onsite', widths: [480, 800, 1200] },
  ...PROCESS_IMAGE_ASSETS,
  { name: 'solutions-home', source: 'solutions/solutions-home', widths: [640, 1024, 1600] },
  { name: 'solutions-roof', source: 'solutions/solutions-roof', widths: [640, 1024, 1600] },
  {
    name: 'solutions-system',
    source: 'solutions/solutions-system',
    widths: [640, 1024, 1600]
  },
  {
    name: 'solutions-savings',
    source: 'solutions/solutions-savings',
    widths: [640, 1024, 1600]
  },
  {
    name: 'solutions-inspection',
    source: 'solutions/solutions-inspection',
    widths: [640, 1024, 1600]
  },
  {
    name: 'solutions-installation',
    source: 'solutions/solutions-installation',
    widths: [640, 1024, 1600]
  },
  {
    name: 'solutions-support',
    source: 'solutions/solutions-support',
    widths: [640, 1024, 1600]
  }
];

const outputExtensions = ['avif', 'webp', 'jpg'];
const expectedOutputs = new Set(
  assets.flatMap(({ name, widths }) =>
    widths.flatMap((width) => outputExtensions.map((extension) => `${name}-${width}.${extension}`))
  )
);
const managedNames = new Set(assets.map(({ name }) => name));

for (const filename of await readdir(outputDir)) {
  const match = filename.match(/^(.+)-(\d+)\.(avif|webp|jpg)$/u);
  if (match && managedNames.has(match[1]) && !expectedOutputs.has(filename)) {
    await unlink(resolve(outputDir, filename));
  }
}

const outputIsCurrent = async (sourcePath, outputPaths) => {
  const sourceModifiedAt = (await stat(sourcePath)).mtimeMs;
  try {
    const outputs = await Promise.all(outputPaths.map((outputPath) => stat(outputPath)));
    return outputs.every(({ mtimeMs }) => mtimeMs >= sourceModifiedAt);
  } catch {
    return false;
  }
};

for (const { name, source = name, widths, quality } of assets) {
  const sourcePath = resolve(sourceDir, `${source}.png`);
  const sourceMetadata = await sharp(sourcePath).metadata();

  for (const width of widths) {
    if (!sourceMetadata.width || width > sourceMetadata.width) {
      throw new Error(
        `${name} requests ${width}px, but its source is only ${sourceMetadata.width ?? 'unknown'}px wide.`
      );
    }

    const outputPaths = outputExtensions.map((extension) =>
      resolve(outputDir, `${name}-${width}.${extension}`)
    );
    if (await outputIsCurrent(sourcePath, outputPaths)) continue;

    const image = sharp(sourcePath).resize({
      width,
      withoutEnlargement: true
    });

    await Promise.all([
      image
        .clone()
        .avif({ quality: quality ?? 56, effort: 5 })
        .toFile(outputPaths[0]),
      image
        .clone()
        .webp({ quality: quality ? 84 : 76, effort: 5 })
        .toFile(outputPaths[1]),
      image
        .clone()
        .jpeg({ quality: quality ? 88 : 78, progressive: true, mozjpeg: true })
        .toFile(outputPaths[2])
    ]);
  }
}

await sharp(resolve(sourceDir, 'og.png'))
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .png({ compressionLevel: 9, palette: true })
  .toFile(resolve(root, 'public/og.png'));
