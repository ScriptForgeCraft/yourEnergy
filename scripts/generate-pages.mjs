import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import Handlebars from 'handlebars';
import { loadEnv } from 'vite';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';
import en from '../src/content/en.js';
import toolCopy from '../src/content/tools.js';
import { TEMPORARY_YOURENERGY_PRICEBOOK } from '../src/data/pricebooks/armenia.js';
import { GENERATED_CONTENT_LOCALES } from '../src/content/schema.js';

const root = resolve(import.meta.dirname, '..');
const mode = process.argv[2] ?? 'production';
const loadedPublicEnv = loadEnv(mode, root, 'VITE_');
const publicEnv = {
  ...loadedPublicEnv,
  ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('VITE_')))
};
const template = await readFile(resolve(root, 'src/templates/home.hbs'), 'utf8');
const supportTemplate = await readFile(resolve(root, 'src/templates/support.hbs'), 'utf8');
const legacyRedirectTemplate = await readFile(
  resolve(root, 'src/templates/legacy-redirect.hbs'),
  'utf8'
);

const render = Handlebars.compile(template, { noEscape: false });
const renderSupport = Handlebars.compile(supportTemplate, { noEscape: false });
const renderLegacyRedirect = Handlebars.compile(legacyRedirectTemplate, { noEscape: false });
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
      telephone: content.contact.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: content.contact.address,
        addressCountry: 'AM'
      }
    },
    {
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: serviceName,
      serviceType: serviceName,
      url: canonical,
      provider: { '@id': 'https://yourenergy.am/#organization' },
      areaServed: { '@type': 'Country', name: 'Armenia' }
    }
  ];

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
  product: content.product,
  map: {
    image: '/images/roof-scan-768.webp',
    tileUrl: publicEnv.VITE_MAP_TILE_URL?.trim() || DEFAULT_OSM_TILE_URL,
    tileAttribution: publicEnv.VITE_MAP_ATTRIBUTION?.trim() || DEFAULT_OSM_TILE_ATTRIBUTION
  },
  endpoints: {
    geocode: sameOriginPath(publicEnv.VITE_GEOCODING_ENDPOINT, '/api/geocode'),
    potential: sameOriginPath(publicEnv.VITE_POTENTIAL_ENDPOINT, '/api/potential'),
    analysis: sameOriginPath(publicEnv.VITE_ANALYSIS_ENDPOINT, '/api/analysis')
  },
  ...extra
});

const createHomeContext = (content, { pageKind = 'home' } = {}) => {
  const calculatorHref = toolPath(content.locale, 'calculator');
  const isCalculator = pageKind === 'calculator';
  const isHome = pageKind === 'home';
  const calculatorPageHref = isCalculator ? '#calculator-start' : calculatorHref;
  const homeSectionHref = (href) =>
    !isHome && href.startsWith('#') ? `${content.homeHref}${href}` : href;

  return {
    ...content,
    calculatorHref,
    headerCtaHref: calculatorPageHref,
    navLinks: {
      home: calculatorPageHref,
      business: `${content.supportBase}/soon/#business`,
      projects: homeSectionHref('#projects'),
      process: homeSectionHref('#process'),
      about: homeSectionHref('#engineering'),
      blog: `${content.supportBase}/soon/#blog`,
      contacts: '#contacts'
    },
    solutionHref: calculatorHref,
    offerCheckerHref: `${calculatorHref}#offer-checker`,
    alternateLinks: publishedAlternateLinks,
    languageLinks: createLanguageLinks(content.locale),
    solutions: {
      ...content.solutions,
      items: content.solutions.items.map((item) => ({
        ...item,
        cardClass: item.popular ? 'solution-card--popular' : '',
        buttonClass: item.popular ? '' : 'button--outline',
        detailsLabel: content.common.details,
        ctaLabel: content.common.cta
      }))
    },
    footer: {
      ...content.footer,
      columns: content.footer.columns.map((column) => ({
        ...column,
        links: column.links.map(([label, href]) => [
          label,
          href === '#calculator'
            ? calculatorPageHref
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
        badgeLabel: content.projects.badge,
        beforeLabel: content.projects.before,
        afterLabel: content.projects.after
      }))
    },
    process: {
      ...content.process,
      steps: content.process.steps.map((step, index) => ({
        ...step,
        icon: index === 0 ? 'pin' : 'check'
      }))
    },
    jsonLd: escapeJsonForHtml(createJsonLd(content)),
    pageConfig: escapeJsonForHtml(createPageConfig(content))
  };
};

const createCalculatorContext = (content) => {
  const calculatorMeta = toolCopy[content.locale]?.calculatorMeta;
  const offerChecker = toolCopy[content.locale]?.offerChecker;
  if (!calculatorMeta) throw new Error(`Missing calculator metadata for ${content.locale}.`);
  if (!offerChecker) throw new Error(`Missing offer checker copy for ${content.locale}.`);

  const path = toolPath(content.locale, 'calculator');
  const base = createHomeContext(content, { pageKind: 'calculator' });
  const pendingPassport = content.product?.passport ?? {};
  return {
    ...base,
    isCalculatorPage: true,
    path,
    solutionHref: '#calculator-start',
    meta: calculatorMeta,
    metrics: content.metrics.map((metric) => ({ ...metric, value: '—' })),
    solutions: {
      ...base.solutions,
      items: base.solutions.items.map((item) => ({
        ...item,
        capacity: '—',
        generation: '—'
      }))
    },
    passport: {
      ...base.passport,
      badge: pendingPassport.pendingBadge,
      dialogTitle: pendingPassport.pendingTitle,
      reportAddress: pendingPassport.pendingAddress,
      reportDate: pendingPassport.pendingDate,
      capacity: '—',
      panels: '—',
      source: pendingPassport.pendingSource,
      chartDescription: pendingPassport.pendingChartDescription,
      months: base.passport.months.map((month) => ({ ...month, percent: 0, value: '—' }))
    },
    alternateLinks: createToolAlternateLinks('calculator'),
    languageLinks: createToolLanguageLinks(content.locale, 'calculator'),
    toolShared: toolCopy[content.locale].shared,
    offerChecker,
    offerCheckerScopeItems: scopeItems(offerChecker),
    pageConfig: escapeJsonForHtml(
      createPageConfig(content, { offerChecker: createOfferCheckerRuntime(content, offerChecker) })
    ),
    jsonLd: escapeJsonForHtml(createJsonLd({ ...content, path }, { includeFaq: false }))
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
  const calculatorOutput = resolve(root, toolFile(key, 'calculator'));
  await mkdir(dirname(calculatorOutput), { recursive: true });
  await writeGenerated(calculatorOutput, render(createCalculatorContext(content)));
}

const legacyOfferRedirects = Object.freeze({
  hy: {
    label: 'Վերահղում',
    title: 'Կոմերցիոն առաջարկի ստուգումը տեղափոխվել է հաշվիչ',
    copy: 'Բացեք միասնական հաշվիչը՝ առաջարկի գինը և կազմը ստուգելու համար։',
    continueLabel: 'Բացել առաջարկի ստուգումը'
  },
  ru: {
    label: 'Перенаправление',
    title: 'Проверка КП перенесена в калькулятор',
    copy: 'Откройте единый калькулятор, чтобы проверить цену и состав предложения.',
    continueLabel: 'Открыть проверку КП'
  },
  en: {
    label: 'Redirect',
    title: 'Proposal Checker has moved into the calculator',
    copy: 'Open the unified calculator to check an offer price and scope.',
    continueLabel: 'Open Proposal Checker'
  }
});

for (const { key } of GENERATED_CONTENT_LOCALES) {
  const content = homeContent[key];
  const targetHref = `${toolPath(key, 'calculator')}#offer-checker`;
  const path = toolPath(key, 'offer-checker');
  const output = resolve(root, toolFile(key, 'offer-checker'));
  await mkdir(dirname(output), { recursive: true });
  await writeGenerated(
    output,
    renderLegacyRedirect({
      ...createHomeContext(content, { pageKind: 'support' }),
      ...legacyOfferRedirects[key],
      path,
      targetHref,
      canonical: `${origin}${toolPath(key, 'calculator')}`
    })
  );
}

const commonSoonAnchors = [
  'business',
  'blog',
  'team',
  'certificates',
  'career',
  'warranty',
  'service',
  'documents',
  'account'
];

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
    'soon/index.html',
    {
      locale: 'hy',
      path: '/soon/',
      homeHref: '/',
      label: 'Շուտով',
      title: 'Այս բաժինը պատրաստվում է',
      copy: 'Մենք կառուցում ենք բիզնես լուծումների, բլոգի, փաստաթղթերի և MyEnergy անձնական հաշվի ամբողջական բաժինները։',
      back: 'Վերադառնալ գլխավոր էջ',
      anchors: commonSoonAnchors
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
    'ru/soon/index.html',
    {
      locale: 'ru',
      path: '/ru/soon/',
      homeHref: '/ru/',
      label: 'Скоро',
      title: 'Этот раздел готовится',
      copy: 'Мы готовим полноценные разделы для бизнеса, блога, документов и личного кабинета MyEnergy.',
      back: 'Вернуться на главную',
      anchors: commonSoonAnchors
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
  ],
  [
    'en/soon/index.html',
    {
      locale: 'en',
      path: '/en/soon/',
      homeHref: '/en/',
      label: 'Coming soon',
      title: 'This section is being prepared',
      copy: 'We are preparing detailed pages for business solutions, the blog, documents and the MyEnergy account.',
      back: 'Back to homepage',
      anchors: commonSoonAnchors
    }
  ]
];

for (const [file, content] of supportPages) {
  const output = resolve(root, file);
  await mkdir(dirname(output), { recursive: true });
  await writeGenerated(
    output,
    renderSupport({
      ...createHomeContext(homeContent[content.locale], { pageKind: 'support' }),
      ...content
    })
  );
}
