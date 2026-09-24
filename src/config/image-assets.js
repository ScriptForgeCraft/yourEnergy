import { PROCESS_IMAGE_ASSETS } from './process-images.js';

// Source paths are relative to assets/images. Public names are stable across builds.
export const RESPONSIVE_IMAGE_ASSETS = [
  ...[8, 12, 14, 16, 18, 20].map((hour) => ({
    name: `hero-time-${hour}`,
    source: `home/hero/hero-time-${hour}`,
    widths: [640, 1024, 1600],
    quality: 68
  })),
  { name: 'roof-scan', source: 'calculator/roof-scan', widths: [480, 768, 1200, 1536] },
  ...['arabkir', 'abovyan', 'vagharshapat', 'ararat'].map((place) => ({
    name: `project-${place}`,
    source: `projects/project-${place}`,
    widths: place === 'arabkir' ? [480, 800, 1200] : [480, 800]
  })),
  ...PROCESS_IMAGE_ASSETS
];

export const IMAGE_FORMATS = ['avif', 'webp', 'jpg'];
