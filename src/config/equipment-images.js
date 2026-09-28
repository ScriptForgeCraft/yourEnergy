export const EQUIPMENT_IMAGE_WIDTHS = Object.freeze([160, 320, 640, 960]);
export const equipmentImageUrl = (source, width = 960) =>
  /^\/assets\/equipment\/products\/.+\.png$/u.test(source || '')
    ? source.replace(/\.png$/u, `-${width}.webp`)
    : source;

export const equipmentImageSrcset = (source, widths = EQUIPMENT_IMAGE_WIDTHS) =>
  equipmentImageUrl(source) === source
    ? ''
    : widths.map((width) => `${equipmentImageUrl(source, width)} ${width}w`).join(', ');
