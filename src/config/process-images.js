const createProcessImageAsset = (visual, { widths, width, height }) =>
  Object.freeze({
    visual,
    name: `process-step-${visual}`,
    source: `process/process-step-${visual}`,
    widths: Object.freeze(widths),
    width,
    height,
    quality: 74
  });

export const PROCESS_IMAGE_ASSETS = Object.freeze([
  createProcessImageAsset('analysis', {
    widths: [640, 1024, 1536],
    width: 1536,
    height: 1024
  }),
  ...['inspection', 'design', 'proposal', 'installation', 'support'].map((visual) =>
    createProcessImageAsset(visual, {
      widths: [640, 1024, 1600],
      width: 1600,
      height: 900
    })
  )
]);

const processImageByVisual = new Map(PROCESS_IMAGE_ASSETS.map((asset) => [asset.visual, asset]));

export const createProcessImageContext = (visual) => {
  const asset = processImageByVisual.get(visual);
  if (!asset) throw new Error(`Missing process image configuration for "${visual}".`);

  const srcset = (extension) =>
    asset.widths.map((width) => `/images/${asset.name}-${width}.${extension} ${width}w`).join(', ');

  return Object.freeze({
    src: `/images/${asset.name}-${asset.width}.jpg`,
    avifSrcset: srcset('avif'),
    webpSrcset: srcset('webp'),
    jpegSrcset: srcset('jpg'),
    width: asset.width,
    height: asset.height
  });
};
