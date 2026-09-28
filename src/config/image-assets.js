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
  {
    name: 'equipment-hero',
    source: 'equipment/hero/hero-bg',
    widths: [768, 1200, 1536],
    quality: 68
  },
  ...['arabkir', 'abovyan', 'vagharshapat', 'ararat'].map((place) => ({
    name: `project-${place}`,
    source: `projects/project-${place}`,
    widths: place === 'arabkir' ? [480, 800, 1200] : [480, 800]
  })),
  ...PROCESS_IMAGE_ASSETS
  ,{
    name: 'process-background',
    source: 'process/process-background',
    widths: [640, 1024, 1536],
    legacyUrls: ['/images/process-background.png', '/images/process-step-analysis-bg.png', '/images/process-step-design-bg.png', '/images/process-step-inspection-bg.png', '/images/process-step-installation-bg.png', '/images/process-step-proposal-bg.png', '/images/process-step-support-bg.png']
  }
];

export const IMAGE_FORMATS = ['avif', 'webp', 'jpg'];
