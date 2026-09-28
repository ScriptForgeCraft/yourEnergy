export const EQUIPMENT_IMAGE_WIDTHS = Object.freeze([320, 960]);
export const equipmentImageUrl = (source, width = 960) =>
  /^\/assets\/equipment\/products\/.+\.png$/u.test(source || '')
    ? source.replace(/\.png$/u, `-${width}.webp`)
    : source;
