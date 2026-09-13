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
    editorialNote: 'Материалы проверены по указанным источникам. Для решений по конкретному объекту нужен инженерный расчёт.',
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
    ctaText: 'Սկսեք ձեր տան կամ բիզնեսի նախնական հաշվարկից։',
    backToJournal: 'Բոլոր հոդվածները',
    imageAlt: 'Արևային էներգիա Հայաստանում'
  }
});

const localizedDate = Object.freeze({
  ru: '14 сентября 2026',
  en: '14 September 2026',
  hy: '14 սեպտեմբերի 2026'
});

const articleImages = Object.freeze({
  'solar-panels-for-home-armenia': '/images/hero-time-20-1600.webp',
  'solar-savings-armenia': '/images/project-vagharshapat-800.webp',
  'do-i-need-solar-battery': '/images/project-abovyan-800.webp',
  'how-to-size-solar-system': '/images/roof-scan-1536.webp',
  'net-metering-armenia': '/images/project-arabkir-1200.webp'
});

const localeIndex = Object.freeze({ en: 0, ru: 1, hy: 2 });
const languageMarker = /-{70}\r?\n(RU|EN|HY)\r?\n-{70}\r?\n([\s\S]*?)(?=\r?\n-{70}\r?\n(?:RU|EN|HY)\r?\n-{70}|\s*$)/g;

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
  const h1Match = block.match(/H1:\r?\n([^\r\n]+)\r?\n\r?\n([\s\S]*?)\r?\n\r?\nCTA:\r?\n([^\r\n]+)\r?\n\r?\nSOURCES:\r?\n([\s\S]*?)\s*$/u);
  if (!h1Match) throw new Error(`Blog source has malformed ${locale.toUpperCase()} article content.`);

  const [, h1, body, cta, sourceText] = h1Match;
  const blocks = toContentBlocks(body);
  const headingBlocks = blocks.filter((item) => item.heading);
  const words = wordCount(`${h1} ${body}`);
  const readingTime = Math.max(1, Math.ceil(words / 190));
  const copy = BLOG_COPY[locale];

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
    image: articleImages[metadata.slug],
    imageAlt: copy.imageAlt,
    searchText: `${h1} ${description} ${metadata.category} ${body}`.toLocaleLowerCase(locale)
  };
};

const articlePath = (locale, slug) =>
  locale === 'hy' ? `/blog/${slug}/` : `/${locale}/blog/${slug}/`;

export const getBlogPath = articlePath;

export const loadBlogArticles = async () => {
  const source = await readFile(BLOG_SOURCE_URL, 'utf8');
  const blocks = [...source.matchAll(/ARTICLE \d+\r?\n=+\r?\n([\s\S]*?)(?=\r?\n=+\r?\nARTICLE \d+\r?\n=+|\s*$)/gu)];
  if (blocks.length !== 5) throw new Error(`Expected 5 blog articles, found ${blocks.length}.`);

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
    return Object.fromEntries(
      Object.entries(languages).map(([locale, languageBlock]) => [
        locale,
        parseLocalizedArticle(languageBlock, locale, {
          ...metadata,
          category: metadata.categoryByLocale[locale],
          path: articlePath(locale, slug)
        })
      ])
    );
  });
};
