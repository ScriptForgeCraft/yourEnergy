import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const sourceDir = resolve(root, 'assets/source');
const outputDir = resolve(root, 'public/images');

await mkdir(outputDir, { recursive: true });

const assets = [
  ['roof-scan', [480, 768, 1200, 1600]],
  ['project-arabkir', [480, 800, 1200]],
  ['project-abovyan', [480, 800]],
  ['project-vagharshapat', [480, 800]],
  ['project-ararat', [480, 800]],
  ['engineer-onsite', [480, 800, 1200]]
];

for (const [name, widths] of assets) {
  for (const width of widths) {
    const image = sharp(resolve(sourceDir, `${name}.png`)).resize({
      width,
      withoutEnlargement: true
    });

    await Promise.all([
      image.clone().avif({ quality: 56, effort: 5 }).toFile(resolve(outputDir, `${name}-${width}.avif`)),
      image.clone().webp({ quality: 76, effort: 5 }).toFile(resolve(outputDir, `${name}-${width}.webp`)),
      image.clone().jpeg({ quality: 78, progressive: true, mozjpeg: true }).toFile(resolve(outputDir, `${name}-${width}.jpg`))
    ]);
  }
}

await sharp(resolve(sourceDir, 'og.png'))
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .png({ compressionLevel: 9, palette: true })
  .toFile(resolve(root, 'public/og.png'));
