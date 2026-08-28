import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const distRoot = resolve(projectRoot, 'dist');
const origin = 'https://yourenergy.am';
const expectedPages = [
  'index.html',
  'ru/index.html',
  'privacy/index.html',
  'terms/index.html',
  'soon/index.html',
  'ru/privacy/index.html',
  'ru/terms/index.html',
  'ru/soon/index.html',
  'en/index.html',
  'en/privacy/index.html',
  'en/terms/index.html',
  'en/soon/index.html'
];

const failures = [];

function fail(message) {
  failures.push(message);
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function attrs(fragment) {
  const result = new Map();
  for (const match of fragment.matchAll(
    /\s([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gu
  )) {
    result.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

function tagAttributes(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'giu'))].map((match) =>
    attrs(match[0])
  );
}

function findMeta(html, key, value) {
  return tagAttributes(html, 'meta').find((attributes) => attributes.get(key) === value);
}

function hasId(html, id) {
  const idPattern = new RegExp(`\\bid\\s*=\\s*(["'])${escapeRegExp(id)}\\1`, 'u');
  return idPattern.test(html);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function normalizeLocalPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded === '/') return 'index.html';
  if (decoded.endsWith('/')) return `${decoded.slice(1)}index.html`;
  if (extname(decoded)) return decoded.slice(1);
  return `${decoded.slice(1)}/index.html`;
}

function sameOriginUrl(value, currentPath) {
  try {
    const base = new URL(`${origin}/${currentPath.replace(/\\/gu, '/')}`);
    const url = new URL(value, base);
    return url.origin === origin ? url : null;
  } catch {
    return null;
  }
}

function isIgnorableUrl(value) {
  return /^(?:data:|mailto:|tel:|javascript:)/iu.test(value);
}

async function validateAsset(value, sourcePage) {
  if (!value || value.startsWith('#') || isIgnorableUrl(value)) return;
  const url = sameOriginUrl(value, sourcePage);
  if (!url) return;

  const target = resolve(distRoot, normalizeLocalPath(url.pathname));
  if (!relative(distRoot, target) || relative(distRoot, target).startsWith('..')) {
    fail(`${sourcePage}: asset resolves outside dist: ${value}`);
    return;
  }

  if (!(await exists(target))) {
    fail(`${sourcePage}: missing local asset ${value}`);
  }
}

function extractSrcsetUrls(value) {
  return value
    .split(',')
    .map((part) => part.trim().split(/\s+/u)[0])
    .filter(Boolean);
}

async function validateAssets(html, page) {
  for (const match of html.matchAll(/<(img|source|script|link|use)\b[^>]*>/giu)) {
    const tagName = match[1].toLowerCase();
    const attributes = attrs(match[0]);
    const rel = attributes.get('rel')?.toLowerCase() ?? '';

    if (tagName === 'img' || tagName === 'source' || tagName === 'script') {
      await validateAsset(attributes.get('src'), page);
    }
    if (tagName === 'source' && attributes.has('srcset')) {
      for (const url of extractSrcsetUrls(attributes.get('srcset'))) await validateAsset(url, page);
    }
    if (tagName === 'link' && /(?:stylesheet|icon|modulepreload)/u.test(rel)) {
      await validateAsset(attributes.get('href'), page);
    }
    if (tagName === 'use') await validateAsset(attributes.get('href'), page);
  }
}

function getJsonLd(html, page) {
  const documents = [];
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/giu)) {
    const openingTag = match[0].slice(0, match[0].indexOf('>') + 1);
    const attributes = attrs(openingTag);
    if (attributes.get('type')?.toLowerCase() !== 'application/ld+json') continue;
    try {
      documents.push(JSON.parse(match[1].trim()));
    } catch (error) {
      fail(`${page}: invalid JSON-LD (${error.message})`);
    }
  }
  return documents;
}

function flattenJsonLd(document) {
  return Array.isArray(document['@graph']) ? document['@graph'] : [document];
}

function includesType(node, expectedType) {
  const value = node['@type'];
  return Array.isArray(value) ? value.includes(expectedType) : value === expectedType;
}

function validateJsonLd(html, page) {
  const documents = getJsonLd(html, page);
  if (documents.length === 0) {
    fail(`${page}: missing JSON-LD`);
    return;
  }

  const nodes = documents.flatMap(flattenJsonLd);
  for (const type of ['WebSite', 'Organization', 'Service', 'FAQPage']) {
    if (!nodes.some((node) => includesType(node, type))) {
      fail(`${page}: JSON-LD missing ${type}`);
    }
  }

  const faq = nodes.find((node) => includesType(node, 'FAQPage'));
  if (!faq || !Array.isArray(faq.mainEntity) || faq.mainEntity.length === 0) {
    fail(`${page}: FAQPage needs visible FAQ mainEntity entries`);
  } else if (
    faq.mainEntity.some(
      (item) =>
        !includesType(item, 'Question') ||
        !item.name ||
        !item.acceptedAnswer ||
        !includesType(item.acceptedAnswer, 'Answer') ||
        !item.acceptedAnswer.text
    )
  ) {
    fail(`${page}: FAQPage contains an incomplete question/answer`);
  }

  const organization = nodes.find((node) => includesType(node, 'Organization'));
  if (
    !organization ||
    organization.name !== 'Your Energy LLC' ||
    organization.telephone !== '+374 91 095 950' ||
    organization.address?.streetAddress !== 'Artashisyan 48 14 Kotayq, Zovuni, 26 33 str, Yerevan'
  ) {
    fail(`${page}: Organization JSON-LD must contain the supplied contact details`);
  }

  const serialized = JSON.stringify(documents);
  if (/\+374\s*10\s*123\s*456|info@yourenergy\.am/iu.test(serialized)) {
    fail(`${page}: demo contact data leaked into JSON-LD`);
  }
  if (/LocalBusiness|Review|AggregateRating|Rating/iu.test(serialized)) {
    fail(`${page}: prohibited demo business/review schema is present`);
  }
}

async function validateAnchors(html, page, pages) {
  for (const match of html.matchAll(/<a\b[^>]*>/giu)) {
    const href = attrs(match[0]).get('href');
    if (!href || href === '#' || isIgnorableUrl(href)) continue;
    const url = sameOriginUrl(href, page);
    if (!url) continue;
    const targetPage = normalizeLocalPath(url.pathname);
    const targetHtml = pages.get(targetPage);
    if (!targetHtml) {
      fail(`${page}: link ${href} points to a missing local page`);
      continue;
    }
    if (!url.hash) continue;
    if (!hasId(targetHtml, decodeURIComponent(url.hash.slice(1)))) {
      fail(`${page}: anchor ${href} has no matching id`);
    }
  }
}

function validateBaseDocument(html, page, locale) {
  if (!/^\s*<!doctype html>/iu.test(html)) fail(`${page}: missing HTML doctype`);
  if (!new RegExp(`<html\\b[^>]*\\blang\\s*=\\s*(["'])${locale}\\1`, 'iu').test(html)) {
    fail(`${page}: expected <html lang="${locale}">`);
  }
  const h1s = [...html.matchAll(/<h1\b[^>]*>/giu)];
  if (h1s.length !== 1) fail(`${page}: expected one h1, found ${h1s.length}`);
  if (/\{\{\{?[^}]+\}\}\}?|<%=?/u.test(html)) fail(`${page}: unrendered template token found`);
  if (/href\s*=\s*(["'])#\1/iu.test(html)) fail(`${page}: forbidden href="#" found`);
  if (/localhost|127\.0\.0\.1/iu.test(html)) fail(`${page}: localhost URL found`);
}

async function validateHomeSeo(html, page, canonical) {
  const canonicalLink = tagAttributes(html, 'link').find(
    (attributes) => attributes.get('rel') === 'canonical'
  );
  if (canonicalLink?.get('href') !== canonical) fail(`${page}: canonical must be ${canonical}`);

  const alternates = tagAttributes(html, 'link')
    .filter((attributes) => attributes.get('rel') === 'alternate')
    .map((attributes) => [attributes.get('hreflang'), attributes.get('href')]);
  const expected = new Map([
    ['hy', `${origin}/`],
    ['ru', `${origin}/ru/`],
    ['en', `${origin}/en/`],
    ['x-default', `${origin}/`]
  ]);
  for (const [language, href] of expected) {
    if (
      !alternates.some(
        ([actualLanguage, actualHref]) => actualLanguage === language && actualHref === href
      )
    ) {
      fail(`${page}: missing hreflang ${language} => ${href}`);
    }
  }

  for (const [property, content] of [
    ['property', 'og:title'],
    ['property', 'og:description'],
    ['property', 'og:image'],
    ['name', 'twitter:card']
  ]) {
    if (!findMeta(html, property, content)) fail(`${page}: missing ${content} metadata`);
  }

  const ogImage = findMeta(html, 'property', 'og:image')?.get('content');
  if (ogImage) await validateAsset(ogImage, page);

  validateJsonLd(html, page);
}

function validateLanguageSwitcher(html, page, currentLocale) {
  const expected = new Map([
    ['hy', '/'],
    ['ru', '/ru/'],
    ['en', '/en/']
  ]);
  const languageLinks = tagAttributes(html, 'a').filter((attributes) =>
    attributes.get('class')?.split(/\s+/u).includes('language-link')
  );

  for (const [locale, href] of expected) {
    if (locale === currentLocale) continue;
    if (
      !languageLinks.some(
        (attributes) => attributes.get('hreflang') === locale && attributes.get('href') === href
      )
    ) {
      fail(`${page}: language switcher is missing ${locale} => ${href}`);
    }
  }
}

function validateSupportNoindex(html, page) {
  const robots = findMeta(html, 'name', 'robots')?.get('content')?.toLowerCase() ?? '';
  if (!robots.includes('noindex')) fail(`${page}: support page must be noindex`);
}

async function validateSitemap() {
  const sitemapPath = resolve(distRoot, 'sitemap.xml');
  if (!(await exists(sitemapPath))) {
    fail('sitemap.xml is missing from dist');
    return;
  }
  const sitemap = await readFile(sitemapPath, 'utf8');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/giu)].map((match) => match[1].trim());
  const expected = [`${origin}/`, `${origin}/ru/`, `${origin}/en/`];
  if (locations.length !== expected.length || expected.some((url) => !locations.includes(url))) {
    fail(`sitemap must include only ${expected.join(', ')}`);
  }

  const expectedAlternates = new Map([
    ['hy', `${origin}/`],
    ['ru', `${origin}/ru/`],
    ['en', `${origin}/en/`],
    ['x-default', `${origin}/`]
  ]);
  const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/giu)];
  for (const entry of entries) {
    const location = entry[1].match(/<loc>([^<]+)<\/loc>/iu)?.[1]?.trim() ?? 'unknown URL';
    const alternates = [...entry[1].matchAll(/<xhtml:link\b[^>]*>/giu)].map((match) =>
      attrs(match[0])
    );
    for (const [language, href] of expectedAlternates) {
      if (
        !alternates.some(
          (attributes) =>
            attributes.get('rel') === 'alternate' &&
            attributes.get('hreflang') === language &&
            attributes.get('href') === href
        )
      ) {
        fail(`sitemap ${location}: missing hreflang ${language} => ${href}`);
      }
    }
  }
}

if (!(await exists(distRoot))) {
  fail('dist/ is missing. Run npm run build before npm run verify:build.');
}

const pages = new Map();
for (const page of expectedPages) {
  const file = resolve(distRoot, page);
  if (!(await exists(file))) {
    fail(`missing built route: ${page}`);
    continue;
  }
  pages.set(page, await readFile(file, 'utf8'));
}

for (const [page, html] of pages) {
  const locale = page.startsWith('ru/') ? 'ru' : page.startsWith('en/') ? 'en' : 'hy';
  validateBaseDocument(html, page, locale);
  await validateAssets(html, page);
  await validateAnchors(html, page, pages);
}

if (pages.has('index.html'))
  await validateHomeSeo(pages.get('index.html'), 'index.html', `${origin}/`);
if (pages.has('ru/index.html'))
  await validateHomeSeo(pages.get('ru/index.html'), 'ru/index.html', `${origin}/ru/`);
if (pages.has('en/index.html'))
  await validateHomeSeo(pages.get('en/index.html'), 'en/index.html', `${origin}/en/`);
if (pages.has('index.html')) validateLanguageSwitcher(pages.get('index.html'), 'index.html', 'hy');
if (pages.has('ru/index.html'))
  validateLanguageSwitcher(pages.get('ru/index.html'), 'ru/index.html', 'ru');
if (pages.has('en/index.html'))
  validateLanguageSwitcher(pages.get('en/index.html'), 'en/index.html', 'en');
for (const page of expectedPages.filter(
  (page) => !['index.html', 'ru/index.html', 'en/index.html'].includes(page)
)) {
  if (pages.has(page)) validateSupportNoindex(pages.get(page), page);
}
await validateSitemap();

if (failures.length > 0) {
  console.error('Build validation failed:\n');
  for (const message of failures) console.error(`- ${message}`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Build validation passed for ${pages.size} routes.\n`);
}
