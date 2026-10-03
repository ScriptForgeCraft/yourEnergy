import projectCatalog from '../data/projects/projects.json';

const LOCALE_TAGS = Object.freeze({ hy: 'hy-AM', ru: 'ru-RU', en: 'en-US' });
const CO2_UNITS = Object.freeze({ hy: 'տ', ru: 'т', en: 't' });
const COUNTRY_NAMES = Object.freeze({ hy: 'Հայաստան', ru: 'Армения', en: 'Armenia' });

const formatNumber = (value, locale, options = {}) =>
  new Intl.NumberFormat(LOCALE_TAGS[locale] ?? 'en-US', options).format(value);

const featuredProject = projectCatalog.projects.find(
  (project) => project.slug === projectCatalog.featuredSlug
);

if (!featuredProject) {
  throw new Error(`Featured project ${projectCatalog.featuredSlug} is missing from projects.json.`);
}

const featuredDetailCopy = Object.freeze({
  ru: {
    eyebrow: 'РЕАЛИЗОВАННЫЙ ПРОЕКТ',
    metaDescription: 'Карточка реализованного проекта YOURENERGY',
    introPrefix:
      'Реализованная солнечная система для частного дома с опубликованной установленной мощностью',
    photoCaption: 'Опубликованная фотография объекта',
    metricsTitle: 'Опубликованные показатели',
    metricLabels: ['Установленная мощность', 'Годовая выработка', 'Сокращение CO₂ в год'],
    recordsTitle: 'Техническая карточка объекта',
    records: [
      {
        label: 'Модули и количество',
        value: 'Не опубликовано',
        note: 'Марка, модель, номинальная мощность и число панелей в публичной записи не указаны.'
      },
      {
        label: 'Инвертор',
        value: 'Не опубликовано',
        note: 'Марка и модель инвертора в публичной записи не указаны.'
      },
      {
        label: 'Год установки',
        value: 'Не опубликовано',
        note: 'Дата монтажа и ввода в эксплуатацию в публичной записи не указана.'
      }
    ],
    productionSourceLabel: 'Источник годовой выработки',
    productionSourceValue: 'Не опубликовано',
    productionSourceSuffix:
      'опубликован в каталоге, но без ссылки на расчёт по данным солнечного ресурса или данные мониторинга.',
    disclosureTitle: 'О данных проекта',
    disclosure:
      'Показатели выше опубликованы в каталоге проектов YOURENERGY. В текущей записи нет источника и даты их измерения, поэтому годовая выработка не обозначается как расчёт по данным солнечного ресурса или фактически измеренная выработка.',
    back: 'Все проекты',
    calculatorAction: 'Рассчитать свой проект'
  },
  hy: {
    eyebrow: 'ԻՐԱԿԱՆԱՑՎԱԾ ՆԱԽԱԳԻԾ',
    metaDescription: 'YOURENERGY-ի իրականացված նախագծի քարտ',
    introPrefix: 'Առանձնատան համար իրականացված արևային համակարգ՝ հրապարակված տեղադրված հզորությամբ',
    photoCaption: 'Օբյեկտի հրապարակված լուսանկարը',
    metricsTitle: 'Հրապարակված ցուցանիշներ',
    metricLabels: ['Տեղադրված հզորություն', 'Տարեկան արտադրություն', 'CO₂-ի կրճատում'],
    recordsTitle: 'Օբյեկտի տեխնիկական քարտ',
    records: [
      {
        label: 'Մոդուլներ և քանակ',
        value: 'Չի հրապարակվել',
        note: 'Ապրանքանիշը, մոդելը, անվանական հզորությունը և վահանակների քանակը հրապարակային գրառման մեջ նշված չեն։'
      },
      {
        label: 'Ինվերտոր',
        value: 'Չի հրապարակվել',
        note: 'Ինվերտորի ապրանքանիշն ու մոդելը հրապարակային գրառման մեջ նշված չեն։'
      },
      {
        label: 'Տեղադրման տարի',
        value: 'Չի հրապարակվել',
        note: 'Տեղադրման և շահագործման հանձնման ամսաթիվը հրապարակային գրառման մեջ նշված չէ։'
      }
    ],
    productionSourceLabel: 'Տարեկան արտադրության աղբյուր',
    productionSourceValue: 'Չի հրապարակվել',
    productionSourceSuffix:
      'ցուցանիշը հրապարակված է կատալոգում, բայց առանց արևային ռեսուրսի տվյալներով հաշվարկի կամ մոնիթորինգի տվյալների հղման։',
    disclosureTitle: 'Նախագծի տվյալների մասին',
    disclosure:
      'Վերոնշյալ ցուցանիշները հրապարակված են YOURENERGY նախագծերի կատալոգում։ Ընթացիկ գրառումը չի պարունակում դրանց չափման աղբյուրն ու ամսաթիվը, ուստի տարեկան արտադրությունը չի ներկայացվում որպես արևային ռեսուրսի տվյալներով հաշվարկ կամ փաստացի չափված արտադրություն։',
    back: 'Բոլոր նախագծերը',
    calculatorAction: 'Հաշվարկել իմ նախագիծը'
  },
  en: {
    eyebrow: 'COMPLETED PROJECT',
    metaDescription: 'Completed YOURENERGY project record',
    introPrefix: 'A completed residential solar system with a published installed capacity of',
    photoCaption: 'Published photograph of the site',
    metricsTitle: 'Published results',
    metricLabels: ['Installed capacity', 'Annual production', 'CO₂ avoided a year'],
    recordsTitle: 'Technical project record',
    records: [
      {
        label: 'Modules and quantity',
        value: 'Not published',
        note: 'The panel brand, model, rated output and quantity are not stated in the public record.'
      },
      {
        label: 'Inverter',
        value: 'Not published',
        note: 'The inverter brand and model are not stated in the public record.'
      },
      {
        label: 'Installation year',
        value: 'Not published',
        note: 'The installation and commissioning date is not stated in the public record.'
      }
    ],
    productionSourceLabel: 'Annual-production source',
    productionSourceValue: 'Not published',
    productionSourceSuffix:
      'is published in the catalogue without a link to a solar-resource calculation or monitoring data.',
    disclosureTitle: 'About the project data',
    disclosure:
      'The figures above are published in the YOURENERGY projects catalogue. This record does not provide a source or measurement date, so annual production is not labelled as a solar-resource estimate or measured generation.',
    back: 'All projects',
    calculatorAction: 'Estimate my project'
  }
});

const buildFeaturedCase = (locale) => {
  const translation = featuredProject.translations?.[locale] ?? featuredProject.translations?.en;
  const copy = featuredDetailCopy[locale];
  const power = `${formatNumber(featuredProject.powerKwp, locale, { maximumFractionDigits: 1 })} kWp`;
  const production = `${formatNumber(featuredProject.annualProductionKwh, locale)} kWh`;
  const co2 = `${formatNumber(featuredProject.co2Tons, locale, { maximumFractionDigits: 1 })} ${CO2_UNITS[locale]}`;

  return Object.freeze({
    slug: featuredProject.slug,
    meta: {
      title: `${translation.title} | YOURENERGY`,
      description: `${copy.metaDescription}: ${translation.title}.`,
      ogTitle: `${translation.title} | YOURENERGY`,
      ogDescription: `${translation.region}: ${power}, ${production}.`
    },
    eyebrow: copy.eyebrow,
    category: translation.category,
    location: `${translation.city}, ${COUNTRY_NAMES[locale]}`,
    title: translation.title,
    intro: `${copy.introPrefix} ${power}.`,
    image: featuredProject.image,
    imageAlt: translation.imageAlt,
    photoCaption: copy.photoCaption,
    metricsTitle: copy.metricsTitle,
    metrics: [
      { icon: 'zap', label: copy.metricLabels[0], value: power },
      { icon: 'chart-bars', label: copy.metricLabels[1], value: production },
      { icon: 'leaf', label: copy.metricLabels[2], value: co2 }
    ],
    recordsTitle: copy.recordsTitle,
    records: [
      ...copy.records,
      {
        label: copy.productionSourceLabel,
        value: copy.productionSourceValue,
        note: `${production} ${copy.productionSourceSuffix}`
      }
    ],
    disclosureTitle: copy.disclosureTitle,
    disclosure: copy.disclosure,
    back: copy.back,
    calculatorAction: copy.calculatorAction
  });
};

export const PROJECT_CASES = Object.freeze({
  [projectCatalog.featuredSlug]: Object.freeze({
    ru: buildFeaturedCase('ru'),
    hy: buildFeaturedCase('hy'),
    en: buildFeaturedCase('en')
  })
});

export const GALLERY_PROJECT_CASE_SLUGS = Object.freeze(
  projectCatalog.projects
    .filter((project) => project.slug !== projectCatalog.featuredSlug)
    .map((project) => project.slug)
);

export const PROJECT_CASE_SLUGS = Object.freeze(
  projectCatalog.projects.map((project) => project.slug)
);
