import existing from './equipment-data.json';
import solax from './solax-products.json';
import { createLocalizedCatalog } from './equipment-i18n.js';
import { equipmentImageUrl } from '../../../config/equipment-images.js';

// Source records contain the identifiers, files and positioning data shared by every locale.
// Display strings are applied only when the showroom requests a locale, so a product is never
// copied merely to change its language.
const sharedEquipmentCatalog = Object.freeze({
  ...existing,
  categories: solax.categories,
  products: [...existing.products, ...solax.products].map((product) => ({
    ...product,
    displayImage: equipmentImageUrl(product.image),
    thumbnailImage: equipmentImageUrl(product.image, 320)
  }))
});

export const createEquipmentCatalog = (locale = 'ru') =>
  createLocalizedCatalog(sharedEquipmentCatalog, locale);

export const productsInCategory = (products, categoryId) =>
  products.filter((product) => product.category === categoryId);
