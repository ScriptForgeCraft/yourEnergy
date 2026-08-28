/**
 * Every published locale produces one crawlable home route. Support routes
 * are generated alongside it, but intentionally remain noindex.
 */
export const CONTENT_LOCALE_SCHEMA = Object.freeze([
  Object.freeze({ key: 'hy', locale: 'hy-AM', path: '/', file: 'index.html', published: true }),
  Object.freeze({
    key: 'ru',
    locale: 'ru-RU',
    path: '/ru/',
    file: 'ru/index.html',
    published: true
  }),
  Object.freeze({
    key: 'en',
    locale: 'en-US',
    path: '/en/',
    file: 'en/index.html',
    published: true
  })
]);

export const GENERATED_CONTENT_LOCALES = Object.freeze(
  CONTENT_LOCALE_SCHEMA.filter((locale) => locale.published)
);
