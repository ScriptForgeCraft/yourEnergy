import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import Handlebars from 'handlebars';
import { loadEnv } from 'vite';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';
import en from '../src/content/en.js';
import toolCopy from '../src/content/tools.js';
import wizardCopy from '../src/content/calculator-wizard.js';
import { solutionsHomeCopy } from '../src/content/solutions-home.js';
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
const supportTemplate = await readFile(resolve(root, 'src/templates/support.hbs'), 'utf8');

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
const renderSupport = Handlebars.compile(supportTemplate, { noEscape: false });
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

const createHomeContext = (content, { pageKind = 'home' } = {}) => {
  const hero = createHeroContent(content);
  const calculatorHref = toolPath(content.locale, 'calculator');
  const isHome = pageKind === 'home';
  const homeSectionHref = (href) =>
    !isHome && href.startsWith('#') ? `${content.homeHref}${href}` : href;
  const stageCopy = solutionsHomeCopy[content.locale];
  const journey = {
    ...stageCopy,
    regions: ARMENIA_REGIONAL_BENCHMARKS.map(({ id }) => ({
      id,
      label: regionLabels[content.locale][id]
    })),
    trust: stageCopy.trust.map(([title, note], index) => ({
      title,
      note,
      icon: [
        'm13 2-9 12h7l-1 8 10-13h-7l1-7Z',
        'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Zm-4 10 3 3 5-6',
        'M4 21c0-8 5-13 14-17M5 17C-2 6 13 2 21 2c0 10-2 20-16 15Z'
      ][index]
    })),
    steps: stageCopy.steps.map((label, index) => ({
      number: index + 1,
      displayNumber: String(index + 1).padStart(2, '0'),
      label,
      active: index === 0,
      stateClass: index === 0 ? 'is-active' : '',
      current: index === 0 ? 'step' : 'false',
      href:
        [
          calculatorHref,
          toolPath(content.locale, 'calculator/refine'),
          toolPath(content.locale, 'calculator/pro')
        ][index] ?? null
    }))
  };

  return {
    ...content,
    hero,
    headerOverlay: isHome,
    headerClass: isHome ? ' site-header--overlay' : '',
    currentLanguageLabel: content.locale === 'hy' ? 'AM' : content.locale.toUpperCase(),
    calculatorHref,
    headerCtaHref: calculatorHref,
    navLinks: {
      home: content.homeHref,
      calculator: calculatorHref,
      projects: homeSectionHref('#projects'),
      process: homeSectionHref('#process'),
      contacts: '#contacts'
    },
    solutionHref: calculatorHref,
    offerCheckerHref: toolPath(content.locale, 'offer-checker'),
    alternateLinks: publishedAlternateLinks,
    languageLinks: createLanguageLinks(content.locale),
    solutions: {
      ...content.solutions,
      items: content.solutions.items.map((item) => ({
        ...item,
        cardClass: item.popular ? 'solution-card solution-card--popular' : 'solution-card',
        buttonClass: item.popular ? 'button' : 'button button--outline',
        detailsLabel: content.common.details,
        ctaLabel: content.common.cta
      }))
    },
    journey,
    footer: {
      ...content.footer,
      columns: content.footer.columns.map((column) => ({
        ...column,
        links: column.links.map(([label, href]) => [
          label,
          href === '#calculator'
            ? calculatorHref
            : !isHome && href.startsWith('#')
              ? `${content.homeHref}${href}`
              : href
        ])
      }))
    },
    projects: {
      ...content.projects,
      items: content.projects.items.map((item) => ({
        ...item,
        cardClass: item.featured ? 'project-card--featured' : '',
        avifSrcset: `/images/${item.image}-480.avif 480w, /images/${item.image}-800.avif 800w${item.featured ? `, /images/${item.image}-1200.avif 1200w` : ''}`,
        webpSrcset: `/images/${item.image}-480.webp 480w, /images/${item.image}-800.webp 800w${item.featured ? `, /images/${item.image}-1200.webp 1200w` : ''}`,
        imageSizes: item.featured
          ? '(max-width: 720px) 82vw, 52vw'
          : '(max-width: 720px) 82vw, 24vw',
        illustrativeLabel: content.common.illustrative,
        badgeLabel: content.projects.badge
      }))
    },
    jsonLd: escapeJsonForHtml(createJsonLd(content)),
    homePageConfig: escapeJsonForHtml({
      locale: runtimeLocales[content.locale],
      hero
    }),
    journeyPageConfig: escapeJsonForHtml({
      locale: runtimeLocales[content.locale],
      journey
    })
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
    headerCtaHref: `${path}#quick-calculator`,
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

const homeContent = { hy, ru, en };

for (const { file, key } of GENERATED_CONTENT_LOCALES) {
  const content = homeContent[key];
  if (!content) {
    throw new Error(`Published locale ${key} is missing homepage content.`);
  }
  const output = resolve(root, file);
  await mkdir(dirname(output), { recursive: true });
  await writeGenerated(output, render(createHomeContext(content)));
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
