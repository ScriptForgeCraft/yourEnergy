import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const sourceDir = resolve(root, 'assets/source');
const outputDir = resolve(root, 'public/images');

await mkdir(outputDir, { recursive: true });

const assets = [
  { name: 'hero-time-8', source: 'hero-times/hero-time-8', widths: [640, 1024, 1600] },
  { name: 'hero-time-12', source: 'hero-times/hero-time-12', widths: [640, 1024, 1600] },
  { name: 'hero-time-14', source: 'hero-times/hero-time-14', widths: [640, 1024, 1600] },
  { name: 'hero-time-16', source: 'hero-times/hero-time-16', widths: [640, 1024, 1600] },
  { name: 'hero-time-18', source: 'hero-times/hero-time-18', widths: [640, 1024, 1600] },
  { name: 'hero-time-20', source: 'hero-times/hero-time-20', widths: [640, 1024, 1600] },
  { name: 'roof-scan', widths: [480, 768, 1200, 1600] },
  { name: 'project-arabkir', widths: [480, 800, 1200] },
  { name: 'project-abovyan', widths: [480, 800] },
  { name: 'project-vagharshapat', widths: [480, 800] },
  { name: 'project-ararat', widths: [480, 800] },
  { name: 'engineer-onsite', widths: [480, 800, 1200] }
];

for (const { name, source = name, widths } of assets) {
  for (const width of widths) {
    const image = sharp(resolve(sourceDir, `${source}.png`)).resize({
      width,
      withoutEnlargement: true
    });

    await Promise.all([
      image
        .clone()
        .avif({ quality: 56, effort: 5 })
        .toFile(resolve(outputDir, `${name}-${width}.avif`)),
      image
        .clone()
        .webp({ quality: 76, effort: 5 })
        .toFile(resolve(outputDir, `${name}-${width}.webp`)),
      image
        .clone()
        .jpeg({ quality: 78, progressive: true, mozjpeg: true })
        .toFile(resolve(outputDir, `${name}-${width}.jpg`))
    ]);
  }
}

await sharp(resolve(sourceDir, 'og.png'))
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .png({ compressionLevel: 9, palette: true })
  .toFile(resolve(root, 'public/og.png'));
