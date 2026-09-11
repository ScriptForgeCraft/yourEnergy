import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

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
  { name: 'roof-scan', widths: [480, 768, 1200, 1600] },
  { name: 'project-arabkir', widths: [480, 800, 1200] },
  { name: 'project-abovyan', widths: [480, 800] },
  { name: 'project-vagharshapat', widths: [480, 800] },
  { name: 'project-ararat', widths: [480, 800] },
  { name: 'engineer-onsite', widths: [480, 800, 1200] },
  {
    name: 'process-step-analysis',
    source: 'process/process-step-analysis',
    widths: [640, 1024, 1600],
    quality: 68
  },
  {
    name: 'process-step-inspection',
    source: 'process/process-step-inspection',
    widths: [640, 1024, 1600],
    quality: 68
  },
  {
    name: 'process-step-design',
    source: 'process/process-step-design',
    widths: [640, 1024, 1600],
    quality: 68
  },
  {
    name: 'process-step-proposal',
    source: 'process/process-step-proposal',
    widths: [640, 1024, 1600],
    quality: 68
  },
  {
    name: 'process-step-installation',
    source: 'process/process-step-installation',
    widths: [640, 1024, 1600],
    quality: 68
  },
  {
    name: 'process-step-support',
    source: 'process/process-step-support',
    widths: [640, 1024, 1600],
    quality: 68
  },
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

for (const { name, source = name, widths, quality } of assets) {
  for (const width of widths) {
    const image = sharp(resolve(sourceDir, `${source}.png`)).resize({
      width,
      withoutEnlargement: true
    });

    await Promise.all([
      image
        .clone()
        .avif({ quality: quality ?? 56, effort: 5 })
        .toFile(resolve(outputDir, `${name}-${width}.avif`)),
      image
        .clone()
        .webp({ quality: quality ? 84 : 76, effort: 5 })
        .toFile(resolve(outputDir, `${name}-${width}.webp`)),
      image
        .clone()
        .jpeg({ quality: quality ? 88 : 78, progressive: true, mozjpeg: true })
        .toFile(resolve(outputDir, `${name}-${width}.jpg`))
    ]);
  }
}

await sharp(resolve(sourceDir, 'og.png'))
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .png({ compressionLevel: 9, palette: true })
  .toFile(resolve(root, 'public/og.png'));
