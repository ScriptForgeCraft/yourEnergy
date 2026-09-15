import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import Handlebars from 'handlebars';
import { loadEnv } from 'vite';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';
import en from '../src/content/en.js';
import aboutPageCopy from '../src/content/about.js';
import { contactPageCopy } from '../src/content/contacts.js';
import toolCopy from '../src/content/tools.js';
import wizardCopy from '../src/content/calculator-wizard.js';
import { processStoryCopy } from '../src/content/process-story.js';
import { calculatorModes, regionLabels } from '../src/content/calculator-modes.js';
import {
  ARMENIA_GRID_CO2_FACTOR,
  EPA_URBAN_TREE_CO2_EQUIVALENCY,
  buildEnvironmentalImpact
} from '../src/domain/index.js';
import { ARMENIA_REGIONAL_BENCHMARKS } from '../src/data/regions/armenia.js';
import { TEMPORARY_YOURENERGY_PRICEBOOK } from '../src/data/pricebooks/armenia.js';
import { ARMENIA_TARIFF_DATASET } from '../src/data/tariffs/armenia.js';
import { GENERATED_CONTENT_LOCALES } from '../src/content/schema.js';
import { createProcessImageContext } from '../src/config/process-images.js';
import { BLOG_COPY, getBlogPath, loadBlogArticles } from '../src/content/blog.js';
import {
  GALLERY_PROJECT_CASE_SLUGS,
  PROJECT_CASES,
  PROJECT_CASE_SLUGS
} from '../src/content/project-cases.js';

const root = resolve(import.meta.dirname, '..');
const mode = process.argv[2] ?? 'production';
const loadedPublicEnv = loadEnv(mode, root, 'VITE_');
const publicEnv = {
  ...loadedPublicEnv,
  ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('VITE_')))
};
const template = await readFile(resolve(root, 'src/templates/home.hbs'), 'utf8');
const calculatorTemplate = await readFile(resolve(root, 'src/templates/calculator.hbs'), 'utf8');
const quickCalculatorTemplate = await readFile(
  resolve(root, 'src/templates/calculator-quick.hbs'),
  'utf8'
);
const refineCalculatorTemplate = await readFile(
  resolve(root, 'src/templates/calculator-refine.hbs'),
  'utf8'
);
const offerCheckerTemplate = await readFile(
  resolve(root, 'src/templates/offer-checker.hbs'),
  'utf8'
);
const faqTemplate = await readFile(resolve(root, 'src/templates/faq.hbs'), 'utf8');
const supportTemplate = await readFile(resolve(root, 'src/templates/support.hbs'), 'utf8');
const placeholderTemplate = await readFile(resolve(root, 'src/templates/placeholder.hbs'), 'utf8');
const contactsTemplate = await readFile(resolve(root, 'src/templates/contacts.hbs'), 'utf8');
const projectsTemplate = await readFile(resolve(root, 'src/templates/projects.hbs'), 'utf8');
const projectCaseTemplate = await readFile(resolve(root, 'src/templates/project-case.hbs'), 'utf8');
const aboutTemplate = await readFile(resolve(root, 'src/templates/about.hbs'), 'utf8');
const blogIndexTemplate = await readFile(resolve(root, 'src/templates/blog-index.hbs'), 'utf8');
const blogArticleTemplate = await readFile(resolve(root, 'src/templates/blog-article.hbs'), 'utf8');

Handlebars.registerPartial(
  'site-header',
  await readFile(resolve(root, 'src/templates/partials/site-header.hbs'), 'utf8')
);
Handlebars.registerPartial(
  'site-footer',
  await readFile(resolve(root, 'src/templates/partials/site-footer.hbs'), 'utf8')
);
Handlebars.registerPartial(
  'journey-story',
  await readFile(resolve(root, 'src/templates/partials/journey-story.hbs'), 'utf8')
);
Handlebars.registerHelper('add', (left, right) => Number(left) + Number(right));

const render = Handlebars.compile(template, { noEscape: false });
const renderCalculator = Handlebars.compile(calculatorTemplate, { noEscape: false });
const renderQuickCalculator = Handlebars.compile(quickCalculatorTemplate, { noEscape: false });
const renderRefineCalculator = Handlebars.compile(refineCalculatorTemplate, { noEscape: false });
const renderOfferChecker = Handlebars.compile(offerCheckerTemplate, { noEscape: false });
const renderFaq = Handlebars.compile(faqTemplate, { noEscape: false });
const renderSupport = Handlebars.compile(supportTemplate, { noEscape: false });
const renderPlaceholder = Handlebars.compile(placeholderTemplate, { noEscape: false });
const renderContacts = Handlebars.compile(contactsTemplate, { noEscape: false });
const renderProjects = Handlebars.compile(projectsTemplate, { noEscape: false });
const renderProjectCase = Handlebars.compile(projectCaseTemplate, { noEscape: false });
const renderAbout = Handlebars.compile(aboutTemplate, { noEscape: false });
const renderBlogIndex = Handlebars.compile(blogIndexTemplate, { noEscape: false });
const renderBlogArticle = Handlebars.compile(blogArticleTemplate, { noEscape: false });
const writeGenerated = (file, markup) => writeFile(file, markup.replace(/[ \t]+\n/g, '\n'), 'utf8');

const runtimeLocales = Object.freeze(
  Object.fromEntries(GENERATED_CONTENT_LOCALES.map(({ key, locale }) => [key, locale]))
);

const origin = 'https://yourenergy.am';
const DEFAULT_OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_OSM_TILE_ATTRIBUTION = '© OpenStreetMap contributors';
const sameOriginPath = (value, fallback) => {
  const candidate = value?.trim();
  return candidate && /^\/(?!\/)/u.test(candidate) ? candidate : fallback;
};
const publishedAlternateLinks = Object.freeze([
  ...GENERATED_CONTENT_LOCALES.map(({ key, path }) => ({
    hreflang: key,
    href: `${origin}${path}`
  })),
  { hreflang: 'x-default', href: `${origin}/` }
]);

const languageLabels = Object.freeze({ hy: 'AM', ru: 'RU', en: 'EN' });
const localizedLanguageNames = Object.freeze({
  hy: Object.freeze({ hy: 'Հայերեն', ru: 'Ռուսերեն', en: 'Անգլերեն' }),
  ru: Object.freeze({ hy: 'Армянский', ru: 'Русский', en: 'Английский' }),
  en: Object.freeze({ hy: 'Armenian', ru: 'Russian', en: 'English' })
});

// Hero values use the same environment domain helper as SolarAnalysis. They
// are an explicitly labelled illustration, not hand-tuned marketing numbers.
const createHeroContent = (content) => {
  const example = content.hero?.dashboardExample;
  const environmental = buildEnvironmentalImpact({
    annualGenerationKwh: example?.annualGenerationKwh,
    gridEmissionFactor: ARMENIA_GRID_CO2_FACTOR,
    treeEquivalency: EPA_URBAN_TREE_CO2_EQUIVALENCY,
    at: new Date('2026-09-08T00:00:00.000Z')
  });
  const co2Tons = environmental.avoidedCo2Tons;
  const treeEquivalent = environmental.treeEquivalent;
  const locale = runtimeLocales[content.locale];
  return {
    ...content.hero,
    dashboardExample: {
      ...example,
      co2Tons,
      co2Display:
        co2Tons === null
          ? '—'
          : new Intl.NumberFormat(locale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1
            }).format(co2Tons),
      treeEquivalent,
      trees: treeEquivalent === null ? null : Math.round(treeEquivalent)
    }
  };
};

const createLanguageLinks = (currentLocale) =>
  GENERATED_CONTENT_LOCALES.filter(({ key }) => key !== currentLocale).map(({ key, path }) => ({
    href: path,
    hreflang: key,
    label: languageLabels[key],
    name: localizedLanguageNames[currentLocale][key]
  }));

const toolPath = (locale, type) => (locale === 'hy' ? `/${type}/` : `/${locale}/${type}/`);
const toolFile = (locale, type) =>
  locale === 'hy' ? `${type}/index.html` : `${locale}/${type}/index.html`;
const faqPath = (locale) => toolPath(locale, 'faq');
const faqFile = (locale) => toolFile(locale, 'faq');
const placeholderPath = (locale, type) => (locale === 'hy' ? `/${type}/` : `/${locale}/${type}/`);
const placeholderFile = (locale, type) =>
  locale === 'hy' ? `${type}/index.html` : `${locale}/${type}/index.html`;
const blogFile = (locale) => (locale === 'hy' ? 'blog/index.html' : `${locale}/blog/index.html`);
const blogArticleFile = (locale, slug) =>
  locale === 'hy' ? `blog/${slug}/index.html` : `${locale}/blog/${slug}/index.html`;
const projectCasePath = (locale, slug) =>
  locale === 'hy' ? `/projects/${slug}/` : `/${locale}/projects/${slug}/`;
const projectCaseFile = (locale, slug) =>
  locale === 'hy' ? `projects/${slug}/index.html` : `${locale}/projects/${slug}/index.html`;
const createToolAlternateLinks = (type) =>
  Object.freeze([
    ...GENERATED_CONTENT_LOCALES.map(({ key }) => ({
      hreflang: key,
      href: `${origin}${toolPath(key, type)}`
    })),
    { hreflang: 'x-default', href: `${origin}${toolPath('hy', type)}` }
  ]);
const createToolLanguageLinks = (currentLocale, type) =>
  GENERATED_CONTENT_LOCALES.filter(({ key }) => key !== currentLocale).map(({ key }) => ({
    href: toolPath(key, type),
    hreflang: key,
    label: languageLabels[key],
    name: localizedLanguageNames[currentLocale][key]
  }));
const createPlaceholderAlternateLinks = (type) =>
  Object.freeze([
    ...GENERATED_CONTENT_LOCALES.map(({ key }) => ({
      hreflang: key,
      href: `${origin}${placeholderPath(key, type)}`
    })),
    { hreflang: 'x-default', href: `${origin}${placeholderPath('hy', type)}` }
  ]);
const createPlaceholderLanguageLinks = (currentLocale, type) =>
  GENERATED_CONTENT_LOCALES.filter(({ key }) => key !== currentLocale).map(({ key }) => ({
    href: placeholderPath(key, type),
    hreflang: key,
    label: languageLabels[key],
    name: localizedLanguageNames[currentLocale][key]
  }));
const createBlogAlternateLinks = (slug = null) =>
  Object.freeze([
    ...GENERATED_CONTENT_LOCALES.map(({ key }) => ({
      hreflang: key,
      href: `${origin}${slug ? getBlogPath(key, slug) : placeholderPath(key, 'blog')}`
    })),
    { hreflang: 'x-default', href: `${origin}${slug ? getBlogPath('hy', slug) : '/blog/'}` }
  ]);
const createBlogLanguageLinks = (currentLocale, slug = null) =>
  GENERATED_CONTENT_LOCALES.filter(({ key }) => key !== currentLocale).map(({ key }) => ({
    href: slug ? getBlogPath(key, slug) : placeholderPath(key, 'blog'),
    hreflang: key,
    label: languageLabels[key],
    name: localizedLanguageNames[currentLocale][key]
  }));
const createProjectCaseAlternateLinks = (slug) =>
  Object.freeze([
    ...GENERATED_CONTENT_LOCALES.map(({ key }) => ({
      hreflang: key,
      href: `${origin}${projectCasePath(key, slug)}`
    })),
    { hreflang: 'x-default', href: `${origin}${projectCasePath('hy', slug)}` }
  ]);
const createProjectCaseLanguageLinks = (currentLocale, slug) =>
  GENERATED_CONTENT_LOCALES.filter(({ key }) => key !== currentLocale).map(({ key }) => ({
    href: projectCasePath(key, slug),
    hreflang: key,
    label: languageLabels[key],
    name: localizedLanguageNames[currentLocale][key]
  }));
const supportTypeForPath = (path) => (path.endsWith('/privacy/') ? 'privacy' : 'terms');

const escapeJsonForHtml = (value) =>
  JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');

const createJsonLd = (content, { includeFaq = true } = {}) => {
  const canonical = `https://yourenergy.am${content.path}`;
  const serviceName =
    content.locale === 'hy'
      ? 'Արևային համակարգի նախնական վերլուծություն'
      : content.locale === 'ru'
        ? 'Предварительный анализ солнечной системы'
        : 'Preliminary solar-system analysis';

  const graph = [
    {
      '@type': 'WebSite',
      '@id': 'https://yourenergy.am/#website',
      name: 'YOURENERGY',
      url: 'https://yourenergy.am/'
    },
    {
      '@type': 'Organization',
      '@id': 'https://yourenergy.am/#organization',
      name: 'Your Energy LLC',
      alternateName: 'YOURENERGY',
      url: 'https://yourenergy.am/',
      telephone: content.contact.phone
    },
    {
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: serviceName,
      serviceType: serviceName,
      description: content.meta.serviceDescription ?? content.meta.description,
      url: canonical,
      provider: { '@id': 'https://yourenergy.am/#organization' },
      areaServed: { '@type': 'Country', name: 'Armenia' }
    }
  ];

  // TODO(owner): provide one confirmed, structured street/locality/region
  // address before adding a PostalAddress to Organization JSON-LD. The supplied
  // free-form contact text contains multiple place labels, so splitting it here
  // would create unverified structured business data.

  if (includeFaq) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: content.faq.items.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer }
      }))
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph
  };
};

const createPageConfig = (content, extra = {}) => ({
  locale: runtimeLocales[content.locale],
  status: content.status,
  product: {
    ...content.product,
    passport: { months: content.passport.months }
  },
  map: {
    image: '/images/roof-scan-768.webp',
    tileUrl: publicEnv.VITE_MAP_TILE_URL?.trim() || DEFAULT_OSM_TILE_URL,
    tileAttribution: publicEnv.VITE_MAP_ATTRIBUTION?.trim() || DEFAULT_OSM_TILE_ATTRIBUTION
  },
  endpoints: {
    geocode: sameOriginPath(publicEnv.VITE_GEOCODING_ENDPOINT, '/api/geocode'),
    potential: sameOriginPath(publicEnv.VITE_POTENTIAL_ENDPOINT, '/api/potential'),
    analysis: sameOriginPath(publicEnv.VITE_ANALYSIS_ENDPOINT, '/api/analysis'),
    quickAnalysis: sameOriginPath(publicEnv.VITE_QUICK_ANALYSIS_ENDPOINT, '/api/quick-analysis')
  },
  ...extra
});

const headerNavigationKeys = Object.freeze([
  'home',
  'calculator',
  'projects',
  'process',
  'equipment',
  'contacts',
  'about',
  'blog'
]);

const createHeaderNavigationState = (activeKey = null) =>
  Object.fromEntries(
    headerNavigationKeys.map((key) => [key, key === activeKey ? 'is-active' : ''])
  );

const createHomeContext = (content, { pageKind = 'home' } = {}) => {
  const hero = createHeroContent(content);
  const calculatorHref = toolPath(content.locale, 'calculator');
  const faqHref = faqPath(content.locale);
  const projectsHref = placeholderPath(content.locale, 'projects');
  const contactsHref = placeholderPath(content.locale, 'contacts');
  const isHome = pageKind === 'home';
  const activeNavigation = createHeaderNavigationState(
    pageKind === 'home'
      ? 'home'
      : pageKind === 'calculator' || pageKind === 'offer-checker'
        ? 'calculator'
        : null
  );
  const homeSectionHref = (href) =>
    !isHome && href.startsWith('#') ? `${content.homeHref}${href}` : href;
  const processCopy = processStoryCopy[content.locale];
  const processStory = {
    ...processCopy,
    regions: ARMENIA_REGIONAL_BENCHMARKS.map(({ id }) => ({
      id,
      label: regionLabels[content.locale][id]
    })),
    steps: processCopy.steps.map((step, index) => ({
      ...step,
      index,
      image: createProcessImageContext(step.visual),
      headlineLines: step.headline.split('\n'),
      stateClass: index === 0 ? 'is-active' : '',
      ariaHidden: index === 0 ? 'false' : 'true',
      progressClass: index === 0 ? 'is-active' : 'is-future',
      isAnalysis: index === 0,
      isInspection: index === 1,
      isDesign: index === 2,
      isProposal: index === 3,
      isInstallation: index === 4,
      isSupport: index === 5,
      designPanels: index === 2 ? Array.from({ length: 12 }, (_, panel) => panel) : null,
      installPanels: index === 4 ? Array.from({ length: 9 }, (_, panel) => panel) : null
    }))
  };

  return {
    ...content,
    hero,
    currentLanguageLabel: content.locale === 'hy' ? 'AM' : content.locale.toUpperCase(),
    activeNavigation,
    calculatorHref,
    faqHref,
    contactsHref,
    headerCtaHref: calculatorHref,
    headerCtaLabel: content.common.headerCta,
    navLinks: {
      home: content.homeHref,
      calculator: calculatorHref,
      projects: projectsHref,
      process: homeSectionHref('#process'),
      equipment: '/equipment/',
      contacts: contactsHref,
      about: placeholderPath(content.locale, 'about'),
      blog: placeholderPath(content.locale, 'blog')
    },
    offerCheckerHref: toolPath(content.locale, 'offer-checker'),
    alternateLinks: publishedAlternateLinks,
    languageLinks: createLanguageLinks(content.locale),
    processStory,
    footer: {
      ...content.footer,
      columns: content.footer.columns.map((column) => ({
        ...column,
        links: column.links.map(([label, href]) => [
          label,
          href === '#calculator'
            ? calculatorHref
            : href === '#faq'
              ? faqHref
              : !isHome && href.startsWith('#')
                ? `${content.homeHref}${href}`
                : href
        ])
      }))
    },
    projects: {
      ...content.projects,
      allHref: projectsHref,
      discussHref: contactsHref,
      items: content.projects.items.map((item) => ({
        ...item,
        avifSrcset: `/images/${item.image}-480.avif 480w, /images/${item.image}-800.avif 800w`,
        webpSrcset: `/images/${item.image}-480.webp 480w, /images/${item.image}-800.webp 800w`,
        imageSizes: '(max-width: 720px) 82vw, (max-width: 1100px) 44vw, 22vw',
        illustrativeLabel: content.common.illustrative,
        href: projectsHref
      }))
    },
    faq: {
      ...content.faq,
      previewItems: content.faq.previewItems ?? content.faq.items.slice(0, 4)
    },
    jsonLd: escapeJsonForHtml(createJsonLd(content, { includeFaq: false })),
    homePageConfig: escapeJsonForHtml({
      locale: runtimeLocales[content.locale],
      hero
    }),
    processPageConfig: escapeJsonForHtml({
      locale: runtimeLocales[content.locale],
      processStory
    })
  };
};

const projectsPageCopy = Object.freeze({
  ru: {
    meta: {
      title: 'Наши проекты солнечных станций в Армении | YOURENERGY',
      description:
        'Реализованные солнечные станции YOURENERGY для домов, бизнеса и производственных объектов в Армении.',
      ogTitle: 'Реальные проекты солнечной энергетики | YOURENERGY',
      ogDescription: 'Смотрите реализованные солнечные станции и их результаты.'
    },
    hero: {
      kicker: 'НАШИ ПРОЕКТЫ',
      titleLead: 'Энергия,',
      titleAccent: 'которая уже работает.',
      copy: 'Реальные солнечные станции в Армении. От идеи до стабильной генерации.',
      watch: 'Смотреть видео',
      pause: 'Поставить видео на паузу',
      duration: '00:48',
      noteLead: 'Настоящие проекты.',
      noteTail: 'Настоящие результаты.',
      scroll: 'Листайте вниз',
      location: 'Ереван, Армения',
      coordinates: '40.1772° N, 44.5033° E',
      points: [
        { number: '01', title: 'Реальные объекты', copy: 'в разных регионах' },
        { number: '02', title: 'Проверенные решения', copy: 'для каждой задачи' },
        { number: '03', title: 'Чистая энергия', copy: 'в Армении' }
      ]
    },
    featured: {
      kicker: 'ВЫБРАННЫЙ ПРОЕКТ',
      total: '20',
      tag: 'Частный дом',
      imageAlt: 'Современный дом с солнечной станцией в Ереване',
      location: 'Ереван, Армения',
      title: 'Современный дом с солнечной станцией',
      copy: 'Надёжное и эстетичное решение для семьи, которое обеспечивает значительную часть потребления электроэнергии.',
      action: 'Подробнее о проекте',
      metrics: [
        { icon: 'zap', label: 'Установленная мощность', value: '8.4 kWp' },
        { icon: 'chart-bars', label: 'Годовая выработка', value: '8 420 kWh' },
        { icon: 'leaf', label: 'Сокращение CO₂ в год', value: '3.5 т' }
      ]
    },
    list: {
      kicker: 'ДРУГИЕ ПРОЕКТЫ',
      titleLead: 'Разные объекты.',
      titleTail: 'Один результат — чистая энергия.',
      viewAll: 'Смотреть все проекты'
    },
    process: {
      kicker: 'НАШ ПОДХОД',
      title: 'От идеи до результата',
      note: 'Комплексный подход к каждому проекту',
      steps: [
        {
          number: '1',
          title: 'Анализ и расчёт',
          copy: 'Подбираем оптимальное решение под ваши задачи'
        },
        { number: '2', title: 'Проектирование', copy: 'Разрабатываем техническое решение' },
        { number: '3', title: 'Монтаж', copy: 'Профессиональная установка и запуск' },
        { number: '4', title: 'Стабильная генерация', copy: 'Чистая энергия на долгие годы' }
      ]
    },
    cta: {
      title: 'Ваш проект может быть следующим',
      copy: 'Рассчитайте потенциал вашего объекта и получите персональное предложение.',
      primary: 'Получить расчёт',
      secondary: 'Обсудить проект',
      note: 'Чистая энергия начинается здесь'
    },
    gallery: [
      {
        tag: 'Частный дом',
        title: 'Загородный дом',
        city: 'Котайк',
        image: 'project-ararat',
        metrics: ['10.4 kWp', '13 500 kWh/год', '5.8 т CO₂']
      },
      {
        tag: 'Бизнес',
        title: 'Офисное здание',
        city: 'Ереван',
        image: 'project-abovyan',
        metrics: ['30 kWp', '42 000 kWh/год', '17.6 т CO₂']
      },
      {
        tag: 'Образование',
        title: 'Учебное учреждение',
        city: 'Ереван',
        image: 'project-arabkir',
        metrics: ['20 kWp', '28 000 kWh/год', '11.7 т CO₂']
      },
      {
        tag: 'Промышленность',
        title: 'Производственный объект',
        city: 'Армавир',
        image: 'project-vagharshapat',
        metrics: ['50 kWp', '68 000 kWh/год', '28.4 т CO₂']
      },
      {
        tag: 'Частный дом',
        title: 'Дом в горах',
        city: 'Дилижан',
        image: 'project-ararat',
        metrics: ['7.5 kWp', '9 800 kWh/год', '4.1 т CO₂']
      },
      {
        tag: 'Сельское хозяйство',
        title: 'Агропредприятие',
        city: 'Армавир',
        image: 'project-vagharshapat',
        metrics: ['25 kWp', '37 000 kWh/год', '15.4 т CO₂']
      }
    ]
  },
  hy: {
    meta: {
      title: 'Մեր արևային նախագծերը Հայաստանում | YOURENERGY',
      description:
        'YOURENERGY-ի իրականացված արևային կայաններ Հայաստանի տների, բիզնեսների և արտադրական օբյեկտների համար։',
      ogTitle: 'Արևային էներգետիկայի իրական նախագծեր | YOURENERGY',
      ogDescription: 'Տեսեք իրականացված արևային կայաններն ու դրանց արդյունքները։'
    },
    hero: {
      kicker: 'ՄԵՐ ՆԱԽԱԳԾԵՐԸ',
      titleLead: 'Էներգիա,',
      titleAccent: 'որն արդեն աշխատում է։',
      copy: 'Իրական արևային կայաններ Հայաստանում։ Գաղափարից մինչև կայուն արտադրություն։',
      watch: 'Դիտել տեսանյութը',
      pause: 'Դադարեցնել տեսանյութը',
      duration: '00:48',
      noteLead: 'Իրական նախագծեր։',
      noteTail: 'Իրական արդյունքներ։',
      scroll: 'Շարունակեք ներքև',
      location: 'Երևան, Հայաստան',
      coordinates: '40.1772° N, 44.5033° E',
      points: [
        { number: '01', title: 'Իրական օբյեկտներ', copy: 'տարբեր մարզերում' },
        { number: '02', title: 'Փորձված լուծումներ', copy: 'յուրաքանչյուր խնդրի համար' },
        { number: '03', title: 'Մաքուր էներգիա', copy: 'Հայաստանում' }
      ]
    },
    featured: {
      kicker: 'ԸՆՏՐՎԱԾ ՆԱԽԱԳԻԾ',
      total: '20',
      tag: 'Առանձնատուն',
      imageAlt: 'Ժամանակակից տուն արևային կայանով Երևանում',
      location: 'Երևան, Հայաստան',
      title: 'Ժամանակակից տուն արևային կայանով',
      copy: 'Ընտանիքի համար հուսալի և գեղագիտական լուծում, որը ծածկում է էլեկտրաէներգիայի սպառման զգալի մասը։',
      action: 'Նախագծի մանրամասները',
      metrics: [
        { icon: 'zap', label: 'Տեղադրված հզորություն', value: '8.4 kWp' },
        { icon: 'chart-bars', label: 'Տարեկան արտադրություն', value: '8 420 kWh' },
        { icon: 'leaf', label: 'CO₂-ի կրճատում', value: '3.5 տ' }
      ]
    },
    list: {
      kicker: 'ԱՅԼ ՆԱԽԱԳԾԵՐ',
      titleLead: 'Տարբեր օբյեկտներ։',
      titleTail: 'Մեկ արդյունք՝ մաքուր էներգիա։',
      viewAll: 'Տեսնել բոլոր նախագծերը'
    },
    process: {
      kicker: 'ՄԵՐ ՄՈՏԵՑՈՒՄԸ',
      title: 'Գաղափարից մինչև արդյունք',
      note: 'Համապարփակ մոտեցում յուրաքանչյուր նախագծի համար',
      steps: [
        { number: '1', title: 'Վերլուծություն և հաշվարկ', copy: 'Ընտրում ենք օպտիմալ լուծումը' },
        { number: '2', title: 'Նախագծում', copy: 'Մշակում ենք տեխնիկական լուծումը' },
        { number: '3', title: 'Տեղադրում', copy: 'Մասնագիտական տեղադրում և գործարկում' },
        { number: '4', title: 'Կայուն արտադրություն', copy: 'Մաքուր էներգիա երկար տարիներ' }
      ]
    },
    cta: {
      title: 'Ձեր նախագիծը կարող է լինել հաջորդը',
      copy: 'Հաշվարկեք ձեր օբյեկտի ներուժը և ստացեք անհատական առաջարկ։',
      primary: 'Ստանալ հաշվարկ',
      secondary: 'Քննարկել նախագիծը',
      note: 'Մաքուր էներգիան սկսվում է այստեղ'
    },
    gallery: [
      {
        tag: 'Առանձնատուն',
        title: 'Ամառանոց',
        city: 'Կոտայք',
        image: 'project-ararat',
        metrics: ['10.4 kWp', '13 500 kWh/տարի', '5.8 տ CO₂']
      },
      {
        tag: 'Բիզնես',
        title: 'Գրասենյակային շենք',
        city: 'Երևան',
        image: 'project-abovyan',
        metrics: ['30 kWp', '42 000 kWh/տարի', '17.6 տ CO₂']
      },
      {
        tag: 'Կրթություն',
        title: 'Ուսումնական կենտրոն',
        city: 'Երևան',
        image: 'project-arabkir',
        metrics: ['20 kWp', '28 000 kWh/տարի', '11.7 տ CO₂']
      },
      {
        tag: 'Արդյունաբերություն',
        title: 'Արտադրական օբյեկտ',
        city: 'Արմավիր',
        image: 'project-vagharshapat',
        metrics: ['50 kWp', '68 000 kWh/տարի', '28.4 տ CO₂']
      },
      {
        tag: 'Առանձնատուն',
        title: 'Տուն լեռներում',
        city: 'Դիլիջան',
        image: 'project-ararat',
        metrics: ['7.5 kWp', '9 800 kWh/տարի', '4.1 տ CO₂']
      },
      {
        tag: 'Գյուղատնտեսություն',
        title: 'Ագրոձեռնարկություն',
        city: 'Արմավիր',
        image: 'project-vagharshapat',
        metrics: ['25 kWp', '37 000 kWh/տարի', '15.4 տ CO₂']
      }
    ]
  },
  en: {
    meta: {
      title: 'Our solar projects in Armenia | YOURENERGY',
      description:
        'Completed YOURENERGY solar installations for homes, businesses and industrial sites across Armenia.',
      ogTitle: 'Real solar energy projects | YOURENERGY',
      ogDescription: 'See completed solar installations and the results they deliver.'
    },
    hero: {
      kicker: 'OUR PROJECTS',
      titleLead: 'Energy',
      titleAccent: 'already at work.',
      copy: 'Real solar installations in Armenia. From an idea to dependable generation.',
      watch: 'Watch video',
      pause: 'Pause video',
      duration: '00:48',
      noteLead: 'Real projects.',
      noteTail: 'Real results.',
      scroll: 'Scroll down',
      location: 'Yerevan, Armenia',
      coordinates: '40.1772° N, 44.5033° E',
      points: [
        { number: '01', title: 'Real sites', copy: 'across Armenia' },
        { number: '02', title: 'Proven solutions', copy: 'for every task' },
        { number: '03', title: 'Clean energy', copy: 'made in Armenia' }
      ]
    },
    featured: {
      kicker: 'FEATURED PROJECT',
      total: '20',
      tag: 'Private home',
      imageAlt: 'Modern home with a solar station in Yerevan',
      location: 'Yerevan, Armenia',
      title: 'Modern home with a solar station',
      copy: 'A reliable and elegant family solution that covers a significant share of household electricity use.',
      action: 'Project details',
      metrics: [
        { icon: 'zap', label: 'Installed capacity', value: '8.4 kWp' },
        { icon: 'chart-bars', label: 'Annual production', value: '8,420 kWh' },
        { icon: 'leaf', label: 'CO₂ avoided a year', value: '3.5 t' }
      ]
    },
    list: {
      kicker: 'MORE PROJECTS',
      titleLead: 'Different sites.',
      titleTail: 'One result — clean energy.',
      viewAll: 'View all projects'
    },
    process: {
      kicker: 'OUR APPROACH',
      title: 'From idea to result',
      note: 'A comprehensive approach to every project',
      steps: [
        {
          number: '1',
          title: 'Analysis and estimate',
          copy: 'We select the right solution for your needs'
        },
        { number: '2', title: 'Engineering', copy: 'We develop the technical solution' },
        { number: '3', title: 'Installation', copy: 'Professional installation and start-up' },
        { number: '4', title: 'Reliable generation', copy: 'Clean energy for years to come' }
      ]
    },
    cta: {
      title: 'Your project could be next',
      copy: 'Calculate your property’s potential and receive a personal proposal.',
      primary: 'Get an estimate',
      secondary: 'Discuss a project',
      note: 'Clean energy starts here'
    },
    gallery: [
      {
        tag: 'Private home',
        title: 'Country house',
        city: 'Kotayk',
        image: 'project-ararat',
        metrics: ['10.4 kWp', '13,500 kWh/year', '5.8 t CO₂']
      },
      {
        tag: 'Business',
        title: 'Office building',
        city: 'Yerevan',
        image: 'project-abovyan',
        metrics: ['30 kWp', '42,000 kWh/year', '17.6 t CO₂']
      },
      {
        tag: 'Education',
        title: 'Education centre',
        city: 'Yerevan',
        image: 'project-arabkir',
        metrics: ['20 kWp', '28,000 kWh/year', '11.7 t CO₂']
      },
      {
        tag: 'Industry',
        title: 'Production facility',
        city: 'Armavir',
        image: 'project-vagharshapat',
        metrics: ['50 kWp', '68,000 kWh/year', '28.4 t CO₂']
      },
      {
        tag: 'Private home',
        title: 'Mountain home',
        city: 'Dilijan',
        image: 'project-ararat',
        metrics: ['7.5 kWp', '9,800 kWh/year', '4.1 t CO₂']
      },
      {
        tag: 'Agriculture',
        title: 'Agricultural site',
        city: 'Armavir',
        image: 'project-vagharshapat',
        metrics: ['25 kWp', '37,000 kWh/year', '15.4 t CO₂']
      }
    ]
  }
});

const FEATURED_PROJECT_CASE_SLUG = 'modern-home-yerevan';
const galleryProjectCaseCopy = Object.freeze({
  ru: {
    eyebrow: 'РЕАЛИЗОВАННЫЙ ПРОЕКТ',
    metaDescription: 'Карточка проекта YOURENERGY',
    intro:
      'В публичной карточке объекта указаны категория, локация и показатели ниже. Данные о конкретных моделях оборудования в доступном каталоге не опубликованы.',
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
        note: 'Годовой показатель опубликован в каталоге, но без ссылки на расчёт PVGIS или данные мониторинга.'
      }
    ],
    disclosureTitle: 'О данных проекта',
    disclosure:
      'Показатели выше опубликованы в каталоге проектов YOURENERGY. В текущих публичных материалах нет источника и даты их измерения, поэтому годовая выработка не обозначается как PVGIS-расчёт или фактическая генерация.',
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
        note: 'Տարեկան ցուցանիշը հրապարակված է կատալոգում, բայց առանց PVGIS հաշվարկի կամ մոնիթորինգի տվյալների հղման։'
      }
    ],
    disclosureTitle: 'Նախագծի տվյալների մասին',
    disclosure:
      'Վերոնշյալ ցուցանիշները հրապարակված են YOURENERGY նախագծերի կատալոգում։ Ընթացիկ հրապարակային նյութերը չեն պարունակում դրանց չափման աղբյուրն ու ամսաթիվը, ուստի տարեկան արտադրությունը չի ներկայացվում որպես PVGIS հաշվարկ կամ փաստացի գեներացիա։',
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
        note: 'The annual figure is published in the catalogue without a link to a PVGIS calculation or monitoring data.'
      }
    ],
    disclosureTitle: 'About the project data',
    disclosure:
      'The figures above are published in the YOURENERGY projects catalogue. The available public material does not provide a source or measurement date, so annual production is not labelled as a PVGIS estimate or measured generation.',
    back: 'All projects',
    calculatorAction: 'Estimate my project'
  }
});

const createProjectsPageContext = (content) => {
  const path = placeholderPath(content.locale, 'projects');
  const base = createHomeContext(content, { pageKind: 'projects' });
  const copy = projectsPageCopy[content.locale];
  if (!copy) throw new Error(`Missing projects page content for ${content.locale}.`);
  const metricsIcons = ['zap', 'chart-bars', 'leaf'];

  return {
    ...base,
    path,
    meta: copy.meta,
    activeNavigation: createHeaderNavigationState('projects'),
    alternateLinks: createPlaceholderAlternateLinks('projects'),
    languageLinks: createPlaceholderLanguageLinks(content.locale, 'projects'),
    projectsPage: {
      ...copy,
      videoSrc: sameOriginPath(publicEnv.VITE_PROJECTS_HERO_VIDEO, ''),
      contactHref: base.navLinks.contacts,
      featuredHref: projectCasePath(content.locale, FEATURED_PROJECT_CASE_SLUG),
      items: copy.gallery.map((item, index) => ({
        ...item,
        tagIcon: index === 3 ? 'chart-bars' : index === 5 ? 'leaf' : 'faq-home',
        action: copy.featured.action,
        href: projectCasePath(content.locale, GALLERY_PROJECT_CASE_SLUGS[index]),
        imageAlt: `${item.title}, ${item.city}`,
        avifSrcset: `/images/${item.image}-480.avif 480w, /images/${item.image}-800.avif 800w`,
        webpSrcset: `/images/${item.image}-480.webp 480w, /images/${item.image}-800.webp 800w`,
        metrics: item.metrics.map((value, metricIndex) => ({
          icon: metricsIcons[metricIndex],
          value
        }))
      }))
    }
  };
};

const createProjectCaseContext = (content, slug) => {
  const galleryCaseIndex = GALLERY_PROJECT_CASE_SLUGS.indexOf(slug);
  const galleryItem =
    galleryCaseIndex === -1 ? null : projectsPageCopy[content.locale]?.gallery[galleryCaseIndex];
  const galleryCopy = galleryProjectCaseCopy[content.locale];
  const copy =
    PROJECT_CASES[slug]?.[content.locale] ??
    (galleryItem && galleryCopy
      ? {
          ...galleryCopy,
          slug,
          meta: {
            title: `${galleryItem.title} | YOURENERGY`,
            description: `${galleryCopy.metaDescription}: ${galleryItem.title}.`,
            ogTitle: `${galleryItem.title} | YOURENERGY`,
            ogDescription: galleryCopy.intro
          },
          category: galleryItem.tag,
          location: galleryItem.city,
          title: galleryItem.title,
          image: galleryItem.image,
          imageAlt: `${galleryItem.title}, ${galleryItem.city}`,
          metrics: projectsPageCopy[content.locale].featured.metrics.map((metric, index) => ({
            ...metric,
            value: galleryItem.metrics[index]
          }))
        }
      : null);
  if (!copy) throw new Error(`Missing project case content for ${slug} in ${content.locale}.`);
  const path = projectCasePath(content.locale, slug);
  const base = createHomeContext(content, { pageKind: 'projects' });

  return {
    ...base,
    path,
    meta: copy.meta,
    activeNavigation: createHeaderNavigationState('projects'),
    alternateLinks: createProjectCaseAlternateLinks(slug),
    languageLinks: createProjectCaseLanguageLinks(content.locale, slug),
    projectCase: {
      ...copy,
      image: copy.image ?? 'project-arabkir',
      avifSrcset: `/images/${copy.image ?? 'project-arabkir'}-480.avif 480w, /images/${copy.image ?? 'project-arabkir'}-800.avif 800w`,
      webpSrcset: `/images/${copy.image ?? 'project-arabkir'}-480.webp 480w, /images/${copy.image ?? 'project-arabkir'}-800.webp 800w`,
      projectsHref: placeholderPath(content.locale, 'projects'),
      calculatorHref: toolPath(content.locale, 'calculator')
    }
  };
};

const createFaqContext = (content) => {
  const path = faqPath(content.locale);
  const base = createHomeContext(content, { pageKind: 'faq' });
  return {
    ...base,
    path,
    faqHref: path,
    meta: content.faq.meta,
    alternateLinks: createToolAlternateLinks('faq'),
    languageLinks: createToolLanguageLinks(content.locale, 'faq'),
    jsonLd: escapeJsonForHtml(createJsonLd({ ...content, path }))
  };
};

const createProfessionalCalculatorContext = (content) => {
  const calculatorMeta = toolCopy[content.locale]?.calculatorMeta;
  const wizard = wizardCopy[content.locale];
  const modeCopy = calculatorModes[content.locale];
  if (!calculatorMeta) throw new Error(`Missing calculator metadata for ${content.locale}.`);
  if (!wizard) throw new Error(`Missing calculator wizard copy for ${content.locale}.`);

  const path = toolPath(content.locale, 'calculator/pro');
  const base = createHomeContext(content, { pageKind: 'calculator' });
  return {
    ...base,
    path,
    meta: modeCopy.proMeta ?? calculatorMeta,
    wizard: { ...wizard, ...modeCopy.pro },
    offerCheckerHref: toolPath(content.locale, 'offer-checker'),
    alternateLinks: createToolAlternateLinks('calculator/pro'),
    languageLinks: createToolLanguageLinks(content.locale, 'calculator/pro'),
    toolShared: toolCopy[content.locale].shared,
    calculatorHref: toolPath(content.locale, 'calculator'),
    pageConfig: escapeJsonForHtml(
      createPageConfig(content, { wizard: { ...wizard, ...modeCopy.pro } })
    ),
    jsonLd: escapeJsonForHtml(createJsonLd({ ...content, path }, { includeFaq: false }))
  };
};

const createQuickCalculatorContext = (content) => {
  const modeCopy = calculatorModes[content.locale];
  const path = toolPath(content.locale, 'calculator');
  const base = createHomeContext(content, { pageKind: 'calculator' });
  return {
    ...base,
    path,
    meta: modeCopy.quickMeta,
    quick: modeCopy.quick,
    // Visitors are already at the calculator, so the header CTA should move
    // them forward to a conversation instead of pointing back to this page.
    headerCtaHref: base.navLinks.contacts,
    headerCtaLabel: content.projects.discuss,
    regions: ARMENIA_REGIONAL_BENCHMARKS.map((region) => ({
      id: region.id,
      label: regionLabels[content.locale][region.id]
    })),
    refineHref: toolPath(content.locale, 'calculator/refine'),
    proHref: toolPath(content.locale, 'calculator/pro'),
    offerCheckerHref: toolPath(content.locale, 'offer-checker'),
    alternateLinks: createToolAlternateLinks('calculator'),
    languageLinks: createToolLanguageLinks(content.locale, 'calculator'),
    toolShared: toolCopy[content.locale].shared,
    pageConfig: escapeJsonForHtml(
      createPageConfig(content, {
        quick: modeCopy.quick,
        tariffRegistry: {
          revision: ARMENIA_TARIFF_DATASET.revision,
          records: ARMENIA_TARIFF_DATASET.records.map(
            ({ id, customerType, minMonthlyKwh, maxMonthlyKwh, dayRate, nightRate }) => ({
              id,
              customerType,
              minMonthlyKwh,
              maxMonthlyKwh,
              dayRate,
              nightRate
            })
          )
        }
      })
    ),
    jsonLd: escapeJsonForHtml(createJsonLd({ ...content, path }, { includeFaq: false }))
  };
};

const createRefineCalculatorContext = (content) => {
  const modeCopy = calculatorModes[content.locale];
  const path = toolPath(content.locale, 'calculator/refine');
  const base = createHomeContext(content, { pageKind: 'calculator' });
  return {
    ...base,
    path,
    meta: modeCopy.refineMeta,
    quick: modeCopy.quick,
    refine: modeCopy.refine,
    calculatorHref: toolPath(content.locale, 'calculator'),
    proHref: toolPath(content.locale, 'calculator/pro'),
    alternateLinks: createToolAlternateLinks('calculator/refine'),
    languageLinks: createToolLanguageLinks(content.locale, 'calculator/refine'),
    toolShared: toolCopy[content.locale].shared,
    pageConfig: escapeJsonForHtml(
      createPageConfig(content, { quick: modeCopy.quick, refine: modeCopy.refine })
    ),
    jsonLd: escapeJsonForHtml(createJsonLd({ ...content, path }, { includeFaq: false }))
  };
};

const createOfferCheckerContext = (content) => {
  const offerChecker = toolCopy[content.locale]?.offerChecker;
  if (!offerChecker) throw new Error(`Missing offer checker copy for ${content.locale}.`);
  const path = toolPath(content.locale, 'offer-checker');
  const base = createHomeContext(content, { pageKind: 'offer-checker' });
  return {
    ...base,
    path,
    meta: offerChecker.meta,
    offerChecker,
    offerCheckerScopeItems: scopeItems(offerChecker),
    alternateLinks: createToolAlternateLinks('offer-checker'),
    languageLinks: createToolLanguageLinks(content.locale, 'offer-checker'),
    headerCtaHref: toolPath(content.locale, 'calculator'),
    toolShared: toolCopy[content.locale].shared,
    pageConfig: escapeJsonForHtml(
      createPageConfig(content, { offerChecker: createOfferCheckerRuntime(content, offerChecker) })
    )
  };
};

const createPlaceholderContext = (content, { type, title }) => {
  const path = placeholderPath(content.locale, type);
  return {
    ...createHomeContext(content, { pageKind: 'placeholder' }),
    path,
    title,
    activeNavigation: createHeaderNavigationState(type),
    alternateLinks: createPlaceholderAlternateLinks(type),
    languageLinks: createPlaceholderLanguageLinks(content.locale, type)
  };
};

const createContactsContext = (content) => {
  const path = placeholderPath(content.locale, 'contacts');
  const contactPage = contactPageCopy[content.locale];
  if (!contactPage) throw new Error(`Missing contact-page content for ${content.locale}.`);
  return {
    ...createHomeContext(content, { pageKind: 'contacts' }),
    path,
    activeNavigation: createHeaderNavigationState('contacts'),
    alternateLinks: createPlaceholderAlternateLinks('contacts'),
    languageLinks: createPlaceholderLanguageLinks(content.locale, 'contacts'),
    contactPage,
    contactPageConfig: escapeJsonForHtml({
      locale: runtimeLocales[content.locale],
      copy: {
        invalid: contactPage.invalid,
        sending: contactPage.sending,
        unavailable: contactPage.unavailable
      }
    })
  };
};

const createAboutContext = (content) => {
  const aboutPage = aboutPageCopy[content.locale];
  if (!aboutPage) throw new Error(`Missing About page copy for ${content.locale}.`);

  return {
    ...createHomeContext(content, { pageKind: 'about' }),
    path: placeholderPath(content.locale, 'about'),
    meta: aboutPage.meta,
    activeNavigation: createHeaderNavigationState('about'),
    alternateLinks: createPlaceholderAlternateLinks('about'),
    languageLinks: createPlaceholderLanguageLinks(content.locale, 'about'),
    aboutPage
  };
};

const createBlogArticleJsonLd = (article, content) =>
  escapeJsonForHtml({
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${origin}${article.path}#article`,
    headline: article.h1,
    description: article.description,
    image: [`${origin}${article.image}`],
    dateModified: article.verifiedDateIso,
    inLanguage: runtimeLocales[content.locale],
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${origin}${article.path}` },
    author: { '@type': 'Organization', name: 'YOURENERGY' },
    publisher: { '@type': 'Organization', name: 'YOURENERGY', url: origin }
  });

const createBlogIndexContext = (content, articles) => {
  const localeArticles = articles.map((article, index) => ({
    ...article[content.locale],
    number: String(index + 1)
  }));
  const categories = localeArticles.map((article) => ({
    key: article.categoryKey,
    label: article.category
  }));
  return {
    ...createHomeContext(content, { pageKind: 'blog' }),
    path: placeholderPath(content.locale, 'blog'),
    blogCopy: BLOG_COPY[content.locale],
    featured: localeArticles[0],
    articles: localeArticles,
    categories,
    calculatorHref: toolPath(content.locale, 'calculator'),
    activeNavigation: createHeaderNavigationState('blog'),
    alternateLinks: createBlogAlternateLinks(),
    languageLinks: createBlogLanguageLinks(content.locale)
  };
};

const createBlogArticleContext = (content, article, articles) => {
  const localizedArticle = article[content.locale];
  return {
    ...createHomeContext(content, { pageKind: 'blog' }),
    blogHref: placeholderPath(content.locale, 'blog'),
    blogCopy: BLOG_COPY[content.locale],
    article: localizedArticle,
    calculatorHref: toolPath(content.locale, 'calculator'),
    relatedArticles: articles
      .filter((candidate) => candidate[content.locale].slug !== localizedArticle.slug)
      .slice(0, 2)
      .map((candidate) => candidate[content.locale]),
    activeNavigation: createHeaderNavigationState('blog'),
    alternateLinks: createBlogAlternateLinks(localizedArticle.slug),
    languageLinks: createBlogLanguageLinks(content.locale, localizedArticle.slug),
    articleJsonLd: createBlogArticleJsonLd(localizedArticle, content)
  };
};

const homeContent = { hy, ru, en };
const blogArticles = await loadBlogArticles();

for (const { file, key } of GENERATED_CONTENT_LOCALES) {
  const content = homeContent[key];
  if (!content) {
    throw new Error(`Published locale ${key} is missing homepage content.`);
  }
  const output = resolve(root, file);
  await mkdir(dirname(output), { recursive: true });
  await writeGenerated(output, render(createHomeContext(content)));
}

for (const { key } of GENERATED_CONTENT_LOCALES) {
  const content = homeContent[key];
  const output = resolve(root, blogFile(key));
  await mkdir(dirname(output), { recursive: true });
  await writeGenerated(output, renderBlogIndex(createBlogIndexContext(content, blogArticles)));

  for (const article of blogArticles) {
    const articleOutput = resolve(root, blogArticleFile(key, article[key].slug));
    await mkdir(dirname(articleOutput), { recursive: true });
    await writeGenerated(
      articleOutput,
      renderBlogArticle(createBlogArticleContext(content, article, blogArticles))
    );
  }
}

for (const { key } of GENERATED_CONTENT_LOCALES) {
  const content = homeContent[key];
  const output = resolve(root, faqFile(key));
  await mkdir(dirname(output), { recursive: true });
  await writeGenerated(output, renderFaq(createFaqContext(content)));
}

const scopeItems = (tool) => [
  { key: 'panels', name: 'scope-panels', label: tool.scope.panels },
  { key: 'inverter', name: 'scope-inverter', label: tool.scope.inverter },
  { key: 'mounting', name: 'scope-mounting', label: tool.scope.mounting },
  {
    key: 'standard-installation',
    name: 'scope-standard-installation',
    label: tool.scope.installation
  },
  {
    key: 'basic-grid-connection',
    name: 'scope-basic-grid-connection',
    label: tool.scope.grid
  },
  { key: 'battery', name: 'scope-battery', label: tool.scope.battery }
];

const createOfferCheckerRuntime = (content, tool) => ({
  toolType: 'offer-checker',
  locale: runtimeLocales[content.locale],
  priceBook: TEMPORARY_YOURENERGY_PRICEBOOK,
  strings: {
    invalid: tool.invalid,
    resultAwaiting: tool.resultAwaiting,
    notComparable: tool.notComparable,
    expiry: tool.expiry,
    status: tool.status,
    scope: Object.fromEntries(scopeItems(tool).map(({ key, label }) => [key, label])),
    scopeIncomplete: tool.scopeIncomplete,
    reason: tool.reason,
    questions: tool.questions
  }
});

for (const { key } of GENERATED_CONTENT_LOCALES) {
  const content = homeContent[key];
  const quickOutput = resolve(root, toolFile(key, 'calculator'));
  await mkdir(dirname(quickOutput), { recursive: true });
  await writeGenerated(quickOutput, renderQuickCalculator(createQuickCalculatorContext(content)));
  const professionalOutput = resolve(root, toolFile(key, 'calculator/pro'));
  await mkdir(dirname(professionalOutput), { recursive: true });
  await writeGenerated(
    professionalOutput,
    renderCalculator(createProfessionalCalculatorContext(content))
  );
  const refineOutput = resolve(root, toolFile(key, 'calculator/refine'));
  await mkdir(dirname(refineOutput), { recursive: true });
  await writeGenerated(
    refineOutput,
    renderRefineCalculator(createRefineCalculatorContext(content))
  );
}

for (const { key } of GENERATED_CONTENT_LOCALES) {
  const content = homeContent[key];
  const output = resolve(root, toolFile(key, 'offer-checker'));
  await mkdir(dirname(output), { recursive: true });
  await writeGenerated(output, renderOfferChecker(createOfferCheckerContext(content)));
}

for (const { key } of GENERATED_CONTENT_LOCALES) {
  const content = homeContent[key];
  const output = resolve(root, placeholderFile(key, 'projects'));
  await mkdir(dirname(output), { recursive: true });
  await writeGenerated(output, renderProjects(createProjectsPageContext(content)));
}

for (const { key } of GENERATED_CONTENT_LOCALES) {
  const content = homeContent[key];
  for (const slug of PROJECT_CASE_SLUGS) {
    const output = resolve(root, projectCaseFile(key, slug));
    await mkdir(dirname(output), { recursive: true });
    await writeGenerated(output, renderProjectCase(createProjectCaseContext(content, slug)));
  }
}

for (const { key } of GENERATED_CONTENT_LOCALES) {
  const content = homeContent[key];
  const output = resolve(root, placeholderFile(key, 'about'));
  await mkdir(dirname(output), { recursive: true });
  await writeGenerated(output, renderAbout(createAboutContext(content)));
}

const placeholderPages = Object.freeze([
  {
    type: 'contacts',
    titles: { hy: 'Կապ', ru: 'Контакты', en: 'Contacts' }
  }
]);

for (const { key } of GENERATED_CONTENT_LOCALES) {
  const content = homeContent[key];
  for (const { type, titles } of placeholderPages) {
    const output = resolve(root, placeholderFile(key, type));
    await mkdir(dirname(output), { recursive: true });
    await writeGenerated(
      output,
      type === 'contacts'
        ? renderContacts(createContactsContext(content))
        : renderPlaceholder(createPlaceholderContext(content, { type, title: titles[key] }))
    );
  }
}

const supportPages = [
  [
    'privacy/index.html',
    {
      locale: 'hy',
      path: '/privacy/',
      homeHref: '/',
      label: 'Իրավական նախագիծ',
      title: 'Գաղտնիության քաղաքականություն',
      copy: 'Այս դեմո տարբերակում հասցեն և հաշվի ֆայլը չեն ուղարկվում սերվեր։ Փաստաթուղթը պետք է իրավական ստուգում անցնի հրապարակումից առաջ։',
      back: 'Վերադառնալ գլխավոր էջ'
    }
  ],
  [
    'terms/index.html',
    {
      locale: 'hy',
      path: '/terms/',
      homeHref: '/',
      label: 'Իրավական նախագիծ',
      title: 'Օգտագործման պայմաններ',
      copy: 'Կայքում ցուցադրված հաշվարկներն ու նախագծերը ցուցադրական օրինակներ են և չեն հանդիսանում առևտրային առաջարկ։',
      back: 'Վերադառնալ գլխավոր էջ'
    }
  ],
  [
    'ru/privacy/index.html',
    {
      locale: 'ru',
      path: '/ru/privacy/',
      homeHref: '/ru/',
      label: 'Юридический черновик',
      title: 'Политика конфиденциальности',
      copy: 'В этой демо-версии адрес и файл счёта не отправляются на сервер. Документ требует юридического согласования перед публикацией.',
      back: 'Вернуться на главную'
    }
  ],
  [
    'ru/terms/index.html',
    {
      locale: 'ru',
      path: '/ru/terms/',
      homeHref: '/ru/',
      label: 'Юридический черновик',
      title: 'Условия использования',
      copy: 'Расчёты и проекты на сайте являются демонстрационными примерами и не считаются коммерческим предложением.',
      back: 'Вернуться на главную'
    }
  ],
  [
    'en/privacy/index.html',
    {
      locale: 'en',
      path: '/en/privacy/',
      homeHref: '/en/',
      label: 'Draft legal notice',
      title: 'Privacy policy',
      copy: 'In this demonstration version, the address and electricity-bill file are not sent to a server. This draft requires legal approval before publication.',
      back: 'Back to homepage'
    }
  ],
  [
    'en/terms/index.html',
    {
      locale: 'en',
      path: '/en/terms/',
      homeHref: '/en/',
      label: 'Draft legal notice',
      title: 'Terms of use',
      copy: 'The estimates and projects shown on this site are demonstration examples and do not constitute a commercial offer.',
      back: 'Back to homepage'
    }
  ]
];

for (const [file, content] of supportPages) {
  const output = resolve(root, file);
  const supportType = supportTypeForPath(content.path);
  await mkdir(dirname(output), { recursive: true });
  await writeGenerated(
    output,
    renderSupport({
      ...createHomeContext(homeContent[content.locale], { pageKind: 'support' }),
      ...content,
      alternateLinks: createToolAlternateLinks(supportType),
      languageLinks: createToolLanguageLinks(content.locale, supportType)
    })
  );
}
