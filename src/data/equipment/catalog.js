import existing from './equipment-data.json';
import solax from './solax-products.json';

// Existing cards and their renders stay authoritative. New SolaX families supplement them.
export const equipmentCatalog = {
  ...existing,
  categories: solax.categories,
  products: [...existing.products, ...solax.products],
  ecosystemComponents: solax.ecosystemComponents
};

export const productsInCategory = (products, categoryId) =>
  products.filter((product) => product.category === categoryId);
