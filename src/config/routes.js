import { GENERATED_CONTENT_LOCALES } from '../content/schema.js';
import { PROJECT_CASE_SLUGS } from '../content/project-cases.js';
import { loadBlogArticles } from '../content/blog.js';

export const pagePath = (locale, route = '') =>
  `${locale === 'hy' ? '/' : `/${locale}/`}${route ? `${route}/` : ''}`;

// Content owns article/project identifiers; this registry owns page kinds and publication.
export const createPageRegistry = async () => {
  const articles = await loadBlogArticles();
  const pages = GENERATED_CONTENT_LOCALES.flatMap(({ key: locale }) => {
    const page = (kind, route = kind, extra = {}) => ({
      kind,
      locale,
      path: pagePath(locale, route),
      file: `${pagePath(locale, route).slice(1)}index.html`,
      indexable: true,
      ...extra
    });
    return [
      page('home', ''),
      ...['faq', 'equipment', 'calculator', 'projects', 'about', 'contacts', 'blog'].map((kind) =>
        page(kind, kind, { indexable: !['about', 'contacts'].includes(kind) })
      ),
      ...['privacy', 'terms'].map((kind) => page(kind, kind, { indexable: false })),
      page('calculator-pro', 'calculator/pro', { indexable: false }),
      page('calculator-refine', 'calculator/refine', { indexable: false }),
      page('calculator-shell', 'calculator/pro', {
        path: `${pagePath(locale, 'calculator/pro')}shell.html`,
        file: `${pagePath(locale, 'calculator/pro').slice(1)}shell.html`,
        indexable: false
      }),
      ...PROJECT_CASE_SLUGS.map((slug) => page('project-case', `projects/${slug}`, { slug })),
      ...articles.map((article) => {
        if (!article[locale]) throw new Error(`Missing ${locale} translation for blog article.`);
        return page('blog-article', `blog/${article[locale].slug}`, { article });
      })
    ];
  });
  const files = pages.map(({ file }) => file);
  if (new Set(files).size !== files.length) throw new Error('Duplicate page route in registry.');
  return pages;
};
