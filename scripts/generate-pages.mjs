import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import Handlebars from 'handlebars';
import { loadEnv } from 'vite';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';
import en from '../src/content/en.js';
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

const render = Handlebars.compile(template, { noEscape: false });
const renderSupport = Handlebars.compile(supportTemplate, { noEscape: false });
const writeGenerated = (file, markup) => writeFile(file, markup.replace(/[ \t]+\n/g, '\n'), 'utf8');

const runtimeLocales = Object.freeze(
  Object.fromEntries(GENERATED_CONTENT_LOCALES.map(({ key, locale }) => [key, locale]))
);

const origin = 'https://yourenergy.am';
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

const escapeJsonForHtml = (value) =>
  JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');

const createJsonLd = (content) => {
  const canonical = `https://yourenergy.am${content.path}`;
  const serviceName =
    content.locale === 'hy'
      ? 'Արևային համակարգի նախնական վերլուծություն'
      : content.locale === 'ru'
        ? 'Предварительный анализ солнечной системы'
        : 'Preliminary solar-system analysis';

  return {
    '@context': 'https://schema.org',
    '@graph': [
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
          addressLocality: 'Yerevan',
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
      },
      {
        '@type': 'FAQPage',
        mainEntity: content.faq.items.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer }
        }))
      }
    ]
  };
};

const createHomeContext = (content) => ({
  ...content,
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
  projects: {
    ...content.projects,
    items: content.projects.items.map((item) => ({
      ...item,
      cardClass: item.featured ? 'project-card--featured' : '',
      avifSrcset: `/images/${item.image}-480.avif 480w, /images/${item.image}-800.avif 800w${item.featured ? `, /images/${item.image}-1200.avif 1200w` : ''}`,
      webpSrcset: `/images/${item.image}-480.webp 480w, /images/${item.image}-800.webp 800w${item.featured ? `, /images/${item.image}-1200.webp 1200w` : ''}`,
      imageSizes: item.featured ? '(max-width: 720px) 82vw, 52vw' : '(max-width: 720px) 82vw, 24vw',
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
  pageConfig: escapeJsonForHtml({
    locale: runtimeLocales[content.locale],
    status: content.status,
    product: content.product,
    map: {
      image: '/images/roof-scan-768.webp',
      tileUrl: publicEnv.VITE_MAP_TILE_URL ?? '',
      tileAttribution: publicEnv.VITE_MAP_ATTRIBUTION ?? ''
    }
  })
});

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
  await writeGenerated(output, renderSupport(content));
}
