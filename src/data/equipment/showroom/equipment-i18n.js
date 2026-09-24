import {
  EQUIPMENT_COPY,
  CATEGORY_LABELS,
  LEGACY_SPEC_KEYS,
  PRODUCT_COPY,
  TEXT,
  REPLACEMENTS,
  UNIT_REPLACEMENTS,
  WORDS
} from './translations.js';

const CYRILLIC = /\p{Script=Cyrillic}/u;
export const missingEquipmentTranslations = new Set();

const productOverride = (product, locale, field, value) =>
  PRODUCT_COPY[product.id]?.[locale]?.[field] ?? value;

const normalizeNumbers = (value, locale) =>
  locale === 'en' ? value.replace(/(\d),(\d)/gu, '$1.$2') : value;

const localizeText = (value, locale) => {
  if (typeof value !== 'string' || locale === 'ru' || !CYRILLIC.test(value)) return value;
  if (TEXT[value]) return TEXT[value][locale === 'hy' ? 0 : 1];

  let result = value;
  for (const [source, translations] of REPLACEMENTS) {
    result = result.replaceAll(source, translations[locale === 'hy' ? 0 : 1]);
  }
  for (const [source, translations] of UNIT_REPLACEMENTS) {
    const escaped = source.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    result = result.replace(
      new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, 'gu'),
      translations[locale === 'hy' ? 0 : 1]
    );
  }
  result = result.replace(/\p{Script=Cyrillic}+/gu, (word) => {
    const translation = WORDS[word]?.[locale === 'hy' ? 0 : 1];
    if (translation) return translation;
    missingEquipmentTranslations.add(word);
    return locale === 'hy' ? 'տվյալ' : 'detail';
  });
  return normalizeNumbers(result, locale);
};

const localizeProduct = (product, locale) => {
  const translate = (field, value) =>
    localizeText(productOverride(product, locale, field, value), locale);
  const specs = Object.fromEntries(
    Object.entries(product.specs ?? {}).map(([key, value]) => [
      LEGACY_SPEC_KEYS[key] ?? key,
      localizeText(value, locale)
    ])
  );
  return {
    ...product,
    model: translate('model', product.model),
    powerRange: translate('powerRange', product.powerRange),
    shortDescription: translate('shortDescription', product.shortDescription),
    badge: translate('badge', product.badge),
    imageNote: translate('imageNote', product.imageNote),
    documentsNote: translate('documentsNote', product.documentsNote),
    warrantyNote: translate('warrantyNote', product.warrantyNote),
    downloadLabel: translate('downloadLabel', product.downloadLabel),
    highlights: product.highlights.map(({ label, value }) => ({
      label: localizeText(label, locale),
      value: localizeText(value, locale)
    })),
    hotspots: product.hotspots.map(({ label, text, ...hotspot }) => ({
      ...hotspot,
      label: localizeText(label, locale),
      text: localizeText(text, locale)
    })),
    benefits: product.benefits?.map(({ label, text, ...benefit }) => ({
      ...benefit,
      label: localizeText(label, locale),
      text: localizeText(text, locale)
    })),
    specs,
    documents: product.documents.map(({ label, ...document }) => ({
      ...document,
      label: localizeText(label, locale),
      sizeLabel: localizeText(document.sizeLabel, locale)
    }))
  };
};

export const createLocalizedCatalog = (catalog, locale) => {
  const localized = {
    ...catalog,
    hero: {
      ...catalog.hero,
      eyebrow: EQUIPMENT_COPY[locale].page.eyebrow,
      title: EQUIPMENT_COPY[locale].page.title,
      subtitle: EQUIPMENT_COPY[locale].page.subtitle
    },
    categories: catalog.categories.map((category) => ({
      ...category,
      label: CATEGORY_LABELS[category.id]?.[locale] ?? localizeText(category.label, locale)
    })),
    products: catalog.products.map((product) => localizeProduct(product, locale))
  };
  return localized;
};

export const findUnlocalizedStrings = (value, path = '$', found = []) => {
  if (typeof value === 'string' && CYRILLIC.test(value)) found.push({ path, value });
  else if (Array.isArray(value))
    value.forEach((item, index) => findUnlocalizedStrings(item, `${path}[${index}]`, found));
  else if (value && typeof value === 'object')
    Object.entries(value).forEach(([key, item]) =>
      findUnlocalizedStrings(item, `${path}.${key}`, found)
    );
  return found;
};

export const formatProductCount = (count, locale) => {
  if (locale === 'hy') return `${count} մոդել`;
  if (locale === 'en') return `${count} ${count === 1 ? 'model' : 'models'}`;
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} моделей`;
  if (last === 1) return `${count} модель`;
  if (last >= 2 && last <= 4) return `${count} модели`;
  return `${count} моделей`;
};

export const isWarrantyLabel = (label) => /гарант|երաշխ|warranty/iu.test(label);
