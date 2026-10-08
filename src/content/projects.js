import projectCatalog from '../data/projects/projects.json';

const LOCALE_TAGS = Object.freeze({ hy: 'hy-AM', ru: 'ru-RU', en: 'en-US' });

const number = (value, locale, options = {}) =>
  new Intl.NumberFormat(LOCALE_TAGS[locale] ?? 'en-US', options).format(value);

const CO2_UNITS = Object.freeze({ hy: 'տ', ru: 'т', en: 't' });

const metricValues = (project, locale) => [
  `${number(project.powerKwp, locale, { maximumFractionDigits: 1 })} kWp`,
  `${number(project.annualProductionKwh, locale)} kWh`,
  `${number(project.co2Tons, locale, { maximumFractionDigits: 1 })} ${CO2_UNITS[locale] ?? 't'}`
];

const validateProjectCatalog = (catalog) => {
  const seenSlugs = new Set();
  for (const project of catalog.projects ?? []) {
    if (!project?.slug) throw new Error('Each project in projects.json must have a slug.');
    if (seenSlugs.has(project.slug))
      throw new Error(`Duplicate project slug in projects.json: ${project.slug}`);
    seenSlugs.add(project.slug);

    const latitude = Number(project.location?.coordinates?.lat);
    const longitude = Number(project.location?.coordinates?.lng);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error(`Invalid latitude (location.coordinates.lat) for project ${project.slug}.`);
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error(`Invalid longitude (location.coordinates.lng) for project ${project.slug}.`);
    }
    if (!project.location?.regionKey)
      throw new Error(`Missing regionKey for project ${project.slug}.`);

    for (const locale of ['hy', 'ru', 'en']) {
      if (!project.translations?.[locale]?.title) {
        throw new Error(`Missing ${locale} title for project ${project.slug}.`);
      }
      if (!project.translations?.[locale]?.category) {
        throw new Error(`Missing ${locale} category for project ${project.slug}.`);
      }
      if (!project.translations?.[locale]?.city) {
        throw new Error(`Missing ${locale} city for project ${project.slug}.`);
      }
      if (!project.translations?.[locale]?.region) {
        throw new Error(`Missing ${locale} region for project ${project.slug}.`);
      }
    }
  }
  if (!seenSlugs.has(catalog.featuredSlug)) {
    throw new Error(`featuredSlug ${catalog.featuredSlug} is not present in projects.json.`);
  }
};

validateProjectCatalog(projectCatalog);

const translatedProject = (project, locale) => {
  const translation = project.translations?.[locale] ?? project.translations?.en ?? {};
  return {
    ...project,
    categoryKey: project.category,
    regionKey: project.location?.regionKey,
    coordinates: project.location?.coordinates,
    regionLabel: translation.region,
    ...translation,
    metrics: metricValues(project, locale)
  };
};

const pageCopy = Object.freeze({
  ru: {
    meta: {
      title: 'Проекты солнечных электростанций в Армении | YOURENERGY',
      description:
        'Реализованные солнечные системы YOURENERGY для домов, бизнеса и производственных объектов в Армении.',
      ogTitle: 'Реальные проекты солнечной энергетики | YOURENERGY',
      ogDescription:
        'Смотрите реализованные солнечные системы и опубликованные показатели проектов.'
    },
    hero: {
      kicker: 'НАШИ ПРОЕКТЫ',
      titleLead: 'Энергия,',
      titleAccent: 'которая уже работает.',
      copy: 'Реальные солнечные системы в Армении. От идеи до стабильной выработки энергии.',
      action: 'Смотреть проекты',
      watch: 'Смотреть видео',
      pause: 'Поставить видео на паузу',
      duration: '00:48',
      countLabel: 'ПРОЕКТОВ В АРМЕНИИ'
    },
    featured: {
      kicker: 'ВЫБРАННЫЙ ПРОЕКТ',
      action: 'Открыть проект',
      galleryAction: 'Смотреть все фотографии',
      metricLabels: ['Мощность', 'Годовая выработка', 'CO₂ / год']
    },
    list: {
      title: 'Проекты',
      empty: 'По выбранным фильтрам проектов не найдено.',
      paginationLabel: 'Навигация по проектам',
      previousPage: 'Назад',
      nextPage: 'Вперёд',
      pageStatus: 'Показаны {start}–{end} из {total}'
    },
    filters: {
      all: 'Все',
      allRegions: 'Регион',
      sort: 'Сортировка',
      defaultSort: 'По умолчанию',
      powerSort: 'По мощности',
      productionSort: 'По выработке'
    },
    coverage: {
      title: 'Проекты по всей Армении',
      copy: 'Наши солнечные системы уже работают в разных регионах страны.',
      projectLabel: 'Проектов',
      regionLabel: 'Регионов',
      powerLabel: 'Общая мощность',
      productionLabel: 'Годовая выработка'
    },
    process: {
      title: 'Как мы реализуем проекты',
      steps: [
        { number: '1', icon: 'file', title: 'Анализ' },
        { number: '2', icon: 'roof-measure', title: 'Проектирование' },
        { number: '3', icon: 'wrench', title: 'Монтаж' },
        { number: '4', icon: 'chart-bars', title: 'Стабильная выработка' }
      ]
    },
    cta: {
      eyebrow: 'YOUR PROJECT COULD BE NEXT',
      title: 'Ваш проект может быть следующим.',
      copy: 'Узнайте, сколько энергии может производить ваш объект.',
      primary: 'Рассчитать мой проект',
      secondary: 'Обсудить проект'
    }
  },
  hy: {
    meta: {
      title: 'Արևային կայանների նախագծեր Հայաստանում | YOURENERGY',
      description:
        'YOURENERGY-ի իրականացված արևային համակարգեր Հայաստանի տների, բիզնեսների և արտադրական օբյեկտների համար։',
      ogTitle: 'Արևային էներգետիկայի իրական նախագծեր | YOURENERGY',
      ogDescription: 'Տեսեք իրականացված արևային համակարգերն ու նախագծերի հրապարակված ցուցանիշները։'
    },
    hero: {
      kicker: 'ՆԱԽԱԳԾԵՐ',
      titleLead: 'Էներգիա,',
      titleAccent: 'որն արդեն աշխատում է։',
      copy: 'Իրական արևային կայաններ Հայաստանում։ Գաղափարից մինչև կայուն արտադրություն։',
      action: 'Դիտել նախագծերը',
      watch: 'Դիտել վիդեոն',
      pause: 'Դադարեցնել վիդեոն',
      duration: '00:48',
      countLabel: 'ՆԱԽԱԳԻԾ ՀԱՅԱՍՏԱՆՈՒՄ'
    },
    featured: {
      kicker: 'ԸՆՏՐՎԱԾ ՆԱԽԱԳԻԾ',
      action: 'Բացել նախագիծը',
      galleryAction: 'Դիտել բոլոր լուսանկարները',
      metricLabels: ['Հզորություն', 'Տարեկան արտադրություն', 'CO₂ / տարի']
    },
    list: {
      title: 'Նախագծեր',
      empty: 'Ընտրված ֆիլտրերով նախագծեր չեն գտնվել։',
      paginationLabel: 'Նախագծերի նավարկում',
      previousPage: 'Նախորդ',
      nextPage: 'Հաջորդ',
      pageStatus: 'Ցուցադրված է {start}–{end}՝ {total}-ից'
    },
    filters: {
      all: 'Բոլորը',
      allRegions: 'Մարզ',
      sort: 'Դասավորել',
      defaultSort: 'Սկզբնական',
      powerSort: 'Ըստ հզորության',
      productionSort: 'Ըստ արտադրության'
    },
    coverage: {
      title: 'Նախագծեր ամբողջ Հայաստանում',
      copy: 'Մեր արևային համակարգերն արդեն գործում են Հայաստանի տարբեր մարզերում։',
      projectLabel: 'Նախագիծ',
      regionLabel: 'Մարզ',
      powerLabel: 'Ընդհանուր հզորություն',
      productionLabel: 'Տարեկան արտադրություն'
    },
    process: {
      title: 'Ինչպես ենք իրականացնում',
      steps: [
        { number: '1', icon: 'file', title: 'Վերլուծություն' },
        { number: '2', icon: 'roof-measure', title: 'Նախագծում' },
        { number: '3', icon: 'wrench', title: 'Տեղադրում' },
        { number: '4', icon: 'chart-bars', title: 'Կայուն արտադրություն' }
      ]
    },
    cta: {
      eyebrow: 'YOUR PROJECT COULD BE NEXT',
      title: 'Ձեր նախագիծը կարող է լինել հաջորդը։',
      copy: 'Տեսեք, թե որքան էներգիա կարող է արտադրել Ձեր օբյեկտը։',
      primary: 'Հաշվել իմ նախագիծը',
      secondary: 'Քննարկել նախագիծը'
    }
  },
  en: {
    meta: {
      title: 'Solar Power Projects in Armenia | YOURENERGY',
      description:
        'Completed YOURENERGY solar installations for homes, businesses and industrial sites across Armenia.',
      ogTitle: 'Real solar energy projects | YOURENERGY',
      ogDescription: 'See completed solar installations and the results they deliver.'
    },
    hero: {
      kicker: 'PROJECTS',
      titleLead: 'Energy',
      titleAccent: 'already at work.',
      copy: 'Real solar installations in Armenia. From an idea to dependable generation.',
      action: 'View projects',
      watch: 'Watch video',
      pause: 'Pause video',
      duration: '00:48',
      countLabel: 'PROJECTS IN ARMENIA'
    },
    featured: {
      kicker: 'FEATURED PROJECT',
      action: 'Open project',
      galleryAction: 'View all photos',
      metricLabels: ['Power', 'Annual production', 'CO₂ / year']
    },
    list: {
      title: 'Projects',
      empty: 'No projects match the selected filters.',
      paginationLabel: 'Project pagination',
      previousPage: 'Previous',
      nextPage: 'Next',
      pageStatus: 'Showing {start}–{end} of {total}'
    },
    filters: {
      all: 'All',
      allRegions: 'Region',
      sort: 'Sort',
      defaultSort: 'Default',
      powerSort: 'By power',
      productionSort: 'By production'
    },
    coverage: {
      title: 'Projects across Armenia',
      copy: 'Our solar systems are already operating in different regions of the country.',
      projectLabel: 'Projects',
      regionLabel: 'Regions',
      powerLabel: 'Installed power',
      productionLabel: 'Annual production'
    },
    process: {
      title: 'How we deliver',
      steps: [
        { number: '1', icon: 'file', title: 'Analysis' },
        { number: '2', icon: 'roof-measure', title: 'Engineering' },
        { number: '3', icon: 'wrench', title: 'Installation' },
        { number: '4', icon: 'chart-bars', title: 'Reliable generation' }
      ]
    },
    cta: {
      eyebrow: 'YOUR PROJECT COULD BE NEXT',
      title: 'Your project could be next.',
      copy: 'See how much energy your property could produce.',
      primary: 'Estimate my project',
      secondary: 'Discuss a project'
    }
  }
});

const withCatalog = (locale) => {
  const copy = pageCopy[locale];
  const projects = projectCatalog.projects.map((project) => translatedProject(project, locale));
  return Object.freeze({ ...copy, catalog: projects });
};

export const projectsPageCopy = Object.freeze({
  ru: withCatalog('ru'),
  hy: withCatalog('hy'),
  en: withCatalog('en')
});

export const PROJECT_CATALOG = projectCatalog;
export const FEATURED_PROJECT_CASE_SLUG = projectCatalog.featuredSlug;

export const galleryProjectCaseCopy = Object.freeze({
  ru: {
    eyebrow: 'РЕАЛИЗОВАННЫЙ ПРОЕКТ',
    metaDescription: 'Карточка проекта YOURENERGY',
    intro:
      'В публичной карточке объекта указаны категория, местоположение и показатели ниже. Данные о конкретных моделях оборудования в доступном каталоге не опубликованы.',
    photoCaption: 'Опубликованная фотография объекта',
    metricsTitle: 'Опубликованные показатели',
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
      },
      {
        label: 'Источник годовой выработки',
        value: 'Не опубликовано',
        note: 'Годовой показатель опубликован в каталоге, но без ссылки на расчёт по данным солнечного ресурса или данные мониторинга.'
      }
    ],
    disclosureTitle: 'О данных проекта',
    disclosure:
      'Показатели выше опубликованы в каталоге проектов YOURENERGY. В текущих публичных материалах нет источника и даты их измерения, поэтому годовая выработка не обозначается как расчёт по данным солнечного ресурса или фактически измеренная выработка.',
    back: 'Все проекты',
    calculatorAction: 'Рассчитать свой проект'
  },
  hy: {
    eyebrow: 'ԻՐԱԿԱՆԱՑՎԱԾ ՆԱԽԱԳԻԾ',
    metaDescription: 'YOURENERGY նախագծի քարտ',
    intro:
      'Օբյեկտի հրապարակային քարտում նշված են կատեգորիան, տեղադրությունը և ստորև ներկայացված ցուցանիշները։ Հասանելի կատալոգում սարքավորումների կոնկրետ մոդելները հրապարակված չեն։',
    photoCaption: 'Օբյեկտի հրապարակված լուսանկարը',
    metricsTitle: 'Հրապարակված ցուցանիշներ',
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
      },
      {
        label: 'Տարեկան արտադրության աղբյուր',
        value: 'Չի հրապարակվել',
        note: 'Տարեկան ցուցանիշը հրապարակված է կատալոգում, բայց առանց արևային ռեսուրսի տվյալներով հաշվարկի կամ մոնիթորինգի տվյալների հղման։'
      }
    ],
    disclosureTitle: 'Նախագծի տվյալների մասին',
    disclosure:
      'Վերոնշյալ ցուցանիշները հրապարակված են YOURENERGY նախագծերի կատալոգում։ Ընթացիկ հրապարակային նյութերը չեն պարունակում դրանց չափման աղբյուրն ու ամսաթիվը, ուստի տարեկան արտադրությունը չի ներկայացվում որպես արևային ռեսուրսի տվյալներով հաշվարկ կամ փաստացի չափված արտադրություն։',
    back: 'Բոլոր նախագծերը',
    calculatorAction: 'Հաշվարկել իմ նախագիծը'
  },
  en: {
    eyebrow: 'COMPLETED PROJECT',
    metaDescription: 'YOURENERGY project record',
    intro:
      'The public project card provides the category, location and results below. Specific equipment models are not published in the available catalogue.',
    photoCaption: 'Published photograph of the site',
    metricsTitle: 'Published results',
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
      },
      {
        label: 'Annual-production source',
        value: 'Not published',
        note: 'The annual figure is published in the catalogue without a link to a solar-resource calculation or monitoring data.'
      }
    ],
    disclosureTitle: 'About the project data',
    disclosure:
      'The figures above are published in the YOURENERGY projects catalogue. The available public material does not provide a source or measurement date, so annual production is not labelled as a solar-resource estimate or measured generation.',
    back: 'All projects',
    calculatorAction: 'Estimate my project'
  }
});
