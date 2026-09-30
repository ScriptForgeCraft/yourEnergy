import { readFile } from 'node:fs/promises';

const BLOG_SOURCE_URL = new URL('./blog-articles.txt', import.meta.url);
const VERIFIED_DATE = '2026-09-14';

export const BLOG_COPY = Object.freeze({
  ru: {
    journal: 'YOURENERGY · журнал',
    heroBefore: 'Идеи. Технологии.',
    heroAccent: 'Чистая энергия.',
    heroText:
      'Практичные статьи о солнечной энергии для дома и бизнеса в Армении — без лишнего шума и неподтверждённых обещаний.',
    searchLabel: 'Поиск по статьям',
    searchPlaceholder: 'Поиск по статьям…',
    allArticles: 'Все статьи',
    featured: 'Главный материал',
    readArticle: 'Читать статью',
    latest: 'Последние статьи',
    popular: 'Популярные статьи',
    grid: 'Сетка',
    list: 'Список',
    noResults: 'По этому запросу ничего не найдено.',
    verified: 'Проверено',
    minRead: 'мин чтения',
    contents: 'В этой статье',
    sources: 'Источники',
    related: 'Читайте также',
    calculate: 'Рассчитать систему',
    editorialNote:
      'Материалы проверены по указанным источникам. Для решений по конкретному объекту нужен инженерный расчёт.',
    ctaTitle: 'Планируете солнечную систему?',
    ctaText: 'Начните с предварительного расчёта для вашего дома или бизнеса.',
    backToJournal: 'Все статьи',
    imageAlt: 'Солнечная энергетика в Армении'
  },
  en: {
    journal: 'YOURENERGY · journal',
    heroBefore: 'Ideas. Technology.',
    heroAccent: 'Clean energy.',
    heroText:
      'Practical articles about solar energy for homes and businesses in Armenia — without noise or unsupported promises.',
    searchLabel: 'Search articles',
    searchPlaceholder: 'Search articles…',
    allArticles: 'All articles',
    featured: 'Featured story',
    readArticle: 'Read article',
    latest: 'Latest articles',
    popular: 'Popular articles',
    grid: 'Grid',
    list: 'List',
    noResults: 'No articles match your search.',
    verified: 'Verified',
    minRead: 'min read',
    contents: 'In this article',
    sources: 'Sources',
    related: 'Read next',
    calculate: 'Calculate my system',
    editorialNote:
      'The material was checked against the cited sources. A site-specific decision still needs an engineering calculation.',
    ctaTitle: 'Planning a solar system?',
    ctaText: 'Start with a preliminary calculation for your home or business.',
    backToJournal: 'All articles',
    imageAlt: 'Solar energy in Armenia'
  },
  hy: {
    journal: 'YOURENERGY · ամսագիր',
    heroBefore: 'Գաղափարներ. Տեխնոլոգիաներ.',
    heroAccent: 'Մաքուր էներգիա.',
    heroText:
      'Արևային էներգիայի գործնական հոդվածներ Հայաստանի տների և բիզնեսների համար՝ առանց ավելորդ աղմուկի և չստուգված խոստումների։',
    searchLabel: 'Որոնել հոդվածներ',
    searchPlaceholder: 'Որոնել հոդվածներ…',
    allArticles: 'Բոլոր հոդվածները',
    featured: 'Գլխավոր հոդված',
    readArticle: 'Կարդալ հոդվածը',
    latest: 'Վերջին հոդվածներ',
    popular: 'Հանրաճանաչ հոդվածներ',
    grid: 'Ցանց',
    list: 'Ցուցակ',
    noResults: 'Ձեր որոնմամբ հոդվածներ չեն գտնվել։',
    verified: 'Ստուգված',
    minRead: 'րոպե ընթերցում',
    contents: 'Այս հոդվածում',
    sources: 'Աղբյուրներ',
    related: 'Կարդացեք նաև',
    calculate: 'Հաշվարկել համակարգը',
    editorialNote:
      'Նյութերը ստուգվել են նշված աղբյուրներով։ Կոնկրետ օբյեկտի համար անհրաժեշտ է ինժեներական հաշվարկ։',
    ctaTitle: 'Պլանավորո՞ւմ եք արևային համակարգ',
    ctaText: 'Սկսեք Ձեր տան կամ բիզնեսի նախնական հաշվարկից։',
    backToJournal: 'Բոլոր հոդվածները',
    imageAlt: 'Արևային էներգիա Հայաստանում'
  }
});

const localizedDate = Object.freeze({
  ru: '14 сентября 2026',
  en: '14 September 2026',
  hy: '14 սեպտեմբերի 2026'
});

// Each image record carries intrinsic dimensions and responsive candidates so
// the article pages can reserve space before the image loads and avoid serving
// a desktop-sized source to every reader.
const articleImages = Object.freeze({
  'solar-panels-for-home-armenia': {
    src: '/images/hero-time-20-1600.webp',
    avifSrcset:
      '/images/hero-time-20-640.avif 640w, /images/hero-time-20-1024.avif 1024w, /images/hero-time-20-1600.avif 1600w',
    webpSrcset:
      '/images/hero-time-20-640.webp 640w, /images/hero-time-20-1024.webp 1024w, /images/hero-time-20-1600.webp 1600w',
    width: 1600,
    height: 900
  },
  'solar-savings-armenia': {
    src: '/images/project-vagharshapat-800.webp',
    avifSrcset:
      '/images/project-vagharshapat-480.avif 480w, /images/project-vagharshapat-800.avif 800w',
    webpSrcset:
      '/images/project-vagharshapat-480.webp 480w, /images/project-vagharshapat-800.webp 800w',
    width: 800,
    height: 533
  },
  'do-i-need-solar-battery': {
    src: '/images/project-abovyan-800.webp',
    avifSrcset: '/images/project-abovyan-480.avif 480w, /images/project-abovyan-800.avif 800w',
    webpSrcset: '/images/project-abovyan-480.webp 480w, /images/project-abovyan-800.webp 800w',
    width: 800,
    height: 533
  },
  'how-to-size-solar-system': {
    src: '/images/roof-scan-1536.webp',
    avifSrcset:
      '/images/roof-scan-480.avif 480w, /images/roof-scan-768.avif 768w, /images/roof-scan-1200.avif 1200w, /images/roof-scan-1536.avif 1536w',
    webpSrcset:
      '/images/roof-scan-480.webp 480w, /images/roof-scan-768.webp 768w, /images/roof-scan-1200.webp 1200w, /images/roof-scan-1536.webp 1536w',
    width: 1536,
    height: 1024
  },
  'net-metering-armenia': {
    src: '/images/project-arabkir-1200.webp',
    avifSrcset:
      '/images/project-arabkir-480.avif 480w, /images/project-arabkir-800.avif 800w, /images/project-arabkir-1200.avif 1200w',
    webpSrcset:
      '/images/project-arabkir-480.webp 480w, /images/project-arabkir-800.webp 800w, /images/project-arabkir-1200.webp 1200w',
    width: 1200,
    height: 800
  }
});

const localeIndex = Object.freeze({ en: 0, ru: 1, hy: 2 });
const languageMarker =
  /-{70}\r?\n(RU|EN|HY)\r?\n-{70}\r?\n([\s\S]*?)(?=\r?\n-{70}\r?\n(?:RU|EN|HY)\r?\n-{70}|\s*$)/g;

const required = (value, name) => {
  if (!value?.trim()) throw new Error(`Blog source is missing ${name}.`);
  return value.trim();
};

const field = (block, label, nextLabel) => {
  const expression = new RegExp(
    `${label}:\\r?\\n([\\s\\S]*?)(?=\\r?\\n\\r?\\n${nextLabel}:|$)`,
    'u'
  );
  return required(block.match(expression)?.[1], label);
};

const wordCount = (text) => text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;

const toContentBlocks = (body) => {
  let headingIndex = 0;
  let paragraphIndex = 0;
  return body
    .trim()
    .split(/\r?\n\s*\r?\n/u)
    .map((chunk) => chunk.replace(/\r?\n/g, ' ').trim())
    .filter(Boolean)
    .map((chunk) => {
      const heading = chunk.match(/^###\s+(.+)$/u)?.[1];
      if (heading) {
        headingIndex += 1;
        return { heading, id: `section-${headingIndex}` };
      }
      paragraphIndex += 1;
      return {
        paragraph: chunk,
        lead: paragraphIndex === 1,
        callout: /^(Важно|Important|Կարևոր)/u.test(chunk)
      };
    });
};

const parseLocalizedArticle = (block, locale, metadata) => {
  const seoTitle = field(block, 'SEO TITLE', 'META DESCRIPTION');
  const description = field(block, 'META DESCRIPTION', 'H1');
  const h1Match = block.match(
    /H1:\r?\n([^\r\n]+)\r?\n\r?\n([\s\S]*?)\r?\n\r?\nCTA:\r?\n([^\r\n]+)\r?\n\r?\nSOURCES:\r?\n([\s\S]*?)\s*$/u
  );
  if (!h1Match)
    throw new Error(`Blog source has malformed ${locale.toUpperCase()} article content.`);

  const [, h1, body, cta, sourceText] = h1Match;
  const blocks = toContentBlocks(body);
  const headingBlocks = blocks.filter((item) => item.heading);
  const words = wordCount(`${h1} ${body}`);
  const readingTime = Math.max(1, Math.ceil(words / 190));
  const copy = BLOG_COPY[locale];

  const image = articleImages[metadata.slug];
  return {
    ...metadata,
    locale,
    seoTitle,
    description,
    h1: h1.trim(),
    cta: cta.trim(),
    sources: sourceText
      .trim()
      .split(/\r?\n/u)
      .map((source) => source.trim())
      .filter(Boolean),
    blocks,
    toc: headingBlocks,
    readingTime,
    readingTimeLabel: `${readingTime} ${copy.minRead}`,
    verifiedDate: localizedDate[locale],
    verifiedDateIso: VERIFIED_DATE,
    image: image.src,
    imageAvifSrcset: image.avifSrcset,
    imageWebpSrcset: image.webpSrcset,
    imageWidth: image.width,
    imageHeight: image.height,
    imageAlt: copy.imageAlt,
    searchText: `${h1} ${description} ${metadata.category} ${body}`.toLocaleLowerCase(locale),
    searchAlias: `${h1} ${description} ${metadata.category}`
  };
};

const articlePath = (locale, slug) =>
  locale === 'hy' ? `/blog/${slug}/` : `/${locale}/blog/${slug}/`;

export const getBlogPath = articlePath;

export const loadBlogArticles = async () => {
  const source = await readFile(BLOG_SOURCE_URL, 'utf8');
  const blocks = [
    ...source.matchAll(
      /ARTICLE \d+\r?\n=+\r?\n([\s\S]*?)(?=\r?\n=+\r?\n(?:ARTICLE \d+\r?\n=+|VERIFIED FACTS USED IN THE ARTICLES|END OF FILE)|\s*$)/gu
    )
  ];
  if (!blocks.length) throw new Error('Blog source contains no articles.');

  return blocks.map((match, articleIndex) => {
    const articleBlock = match[1];
    const slugPath = required(articleBlock.match(/SLUG:\r?\n([^\r\n]+)/u)?.[1], 'SLUG');
    const slug = slugPath.split('/').filter(Boolean).at(-1);
    const categories = required(articleBlock.match(/CATEGORY:\r?\n([^\r\n]+)/u)?.[1], 'CATEGORY')
      .split('/')
      .map((category) => category.trim());
    const languages = Object.fromEntries(
      [...articleBlock.matchAll(languageMarker)].map((languageMatch) => [
        languageMatch[1].toLowerCase(),
        languageMatch[2]
      ])
    );
    const metadata = {
      slug,
      slugPath,
      categoryKey: slug,
      articleIndex,
      categoryByLocale: Object.fromEntries(
        Object.entries(localeIndex).map(([locale, index]) => [locale, categories[index]])
      )
    };

    if (!articleImages[slug]) throw new Error(`Blog article ${slug} has no selected image.`);
    const localizedArticles = Object.fromEntries(
      Object.entries(languages).map(([locale, languageBlock]) => [
        locale,
        parseLocalizedArticle(languageBlock, locale, {
          ...metadata,
          category: metadata.categoryByLocale[locale],
          path: articlePath(locale, slug)
        })
      ])
    );
    // Local article text remains the primary index. Titles, descriptions and
    // categories from its translations are included as compact aliases, so a
    // Russian query can discover the English article (and vice versa).
    const searchAliases = Object.values(localizedArticles)
      .map(({ searchAlias }) => searchAlias)
      .join(' ');
    return Object.fromEntries(
      Object.entries(localizedArticles).map(([locale, article]) => [
        locale,
        { ...article, searchAliases }
      ])
    );
  });
};
