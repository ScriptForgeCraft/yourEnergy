import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const distRoot = resolve(projectRoot, 'dist');
const origin = 'https://yourenergy.am';
const toolPages = [
  { page: 'calculator/index.html', locale: 'hy', type: 'calculator' },
  { page: 'ru/calculator/index.html', locale: 'ru', type: 'calculator' },
  { page: 'en/calculator/index.html', locale: 'en', type: 'calculator' },
  { page: 'offer-checker/index.html', locale: 'hy', type: 'offer-checker' },
  { page: 'ru/offer-checker/index.html', locale: 'ru', type: 'offer-checker' },
  { page: 'en/offer-checker/index.html', locale: 'en', type: 'offer-checker' }
];
const privateCalculatorPages = [
  { page: 'calculator/refine/index.html', locale: 'hy', type: 'calculator/refine' },
  { page: 'ru/calculator/refine/index.html', locale: 'ru', type: 'calculator/refine' },
  { page: 'en/calculator/refine/index.html', locale: 'en', type: 'calculator/refine' },
  { page: 'calculator/pro/index.html', locale: 'hy', type: 'calculator/pro' },
  { page: 'ru/calculator/pro/index.html', locale: 'ru', type: 'calculator/pro' },
  { page: 'en/calculator/pro/index.html', locale: 'en', type: 'calculator/pro' }
];
const expectedPages = [
  'index.html',
  'ru/index.html',
  'privacy/index.html',
  'terms/index.html',
  'ru/privacy/index.html',
  'ru/terms/index.html',
  'en/index.html',
  'en/privacy/index.html',
  'en/terms/index.html',
  ...toolPages.map(({ page }) => page),
  ...privateCalculatorPages.map(({ page }) => page)
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
    if (extname(url.pathname)) {
      await validateAsset(href, page);
      continue;
    }
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
  if (/aria-(?:label|labelledby|describedby)\s*=\s*(["'])\1/iu.test(html)) {
    fail(`${page}: empty accessible name/reference found`);
  }
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

async function validateToolSeo(html, page, canonical, type) {
  const canonicalLink = tagAttributes(html, 'link').find(
    (attributes) => attributes.get('rel') === 'canonical'
  );
  if (canonicalLink?.get('href') !== canonical) fail(`${page}: canonical must be ${canonical}`);

  const alternates = tagAttributes(html, 'link')
    .filter((attributes) => attributes.get('rel') === 'alternate')
    .map((attributes) => [attributes.get('hreflang'), attributes.get('href')]);
  const expected = new Map([
    ['hy', `${origin}/${type}/`],
    ['ru', `${origin}/ru/${type}/`],
    ['en', `${origin}/en/${type}/`],
    ['x-default', `${origin}/${type}/`]
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

  const robots = findMeta(html, 'name', 'robots')?.get('content')?.toLowerCase() ?? '';
  if (robots.includes('noindex')) fail(`${page}: published tool route must remain indexable`);
  if (/"@type"\s*:\s*"(?:Product|Offer)"/u.test(html)) {
    fail(`${page}: temporary price must not produce Product or Offer JSON-LD`);
  }
}

function validateOfferCheckerPriceBookFallback(html, page) {
  const reference = html.match(
    /<strong\b[^>]*\bdata-pricebook-reference(?:\s|=|>)[^>]*>([\s\S]*?)<\/strong>/iu
  );
  if (!reference) {
    fail(`${page}: Offer Checker is missing the runtime PriceBook reference`);
    return;
  }
  if (!html.includes('data-pricebook-version')) {
    fail(`${page}: Offer Checker is missing the runtime PriceBook version label`);
  }
  if (/\b(?:232|247|264)\b/u.test(reference[1])) {
    fail(`${page}: Offer Checker must not show an unchecked static price range`);
  }
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

function validateToolLanguageSwitcher(html, page, currentLocale, type) {
  const expected = new Map([
    ['hy', `/${type}/`],
    ['ru', `/ru/${type}/`],
    ['en', `/en/${type}/`]
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

function validateNoindexLocalizedPage(html, page, locale, type) {
  const robots = findMeta(html, 'name', 'robots')?.get('content')?.toLowerCase() ?? '';
  if (!robots.includes('noindex')) fail(`${page}: noindex route must declare noindex`);
  const canonical = locale === 'hy' ? `${origin}/${type}/` : `${origin}/${locale}/${type}/`;
  const canonicalLink = tagAttributes(html, 'link').find(
    (attributes) => attributes.get('rel') === 'canonical'
  );
  if (canonicalLink?.get('href') !== canonical) fail(`${page}: canonical must be ${canonical}`);
  const alternates = tagAttributes(html, 'link')
    .filter((attributes) => attributes.get('rel') === 'alternate')
    .map((attributes) => [attributes.get('hreflang'), attributes.get('href')]);
  for (const [language, href] of new Map([
    ['hy', `${origin}/${type}/`],
    ['ru', `${origin}/ru/${type}/`],
    ['en', `${origin}/en/${type}/`],
    ['x-default', `${origin}/${type}/`]
  ])) {
    if (
      !alternates.some(
        ([actualLanguage, actualHref]) => actualLanguage === language && actualHref === href
      )
    ) {
      fail(`${page}: missing hreflang ${language} => ${href}`);
    }
  }
  validateToolLanguageSwitcher(html, page, locale, type);
}

async function validateSitemap() {
  const sitemapPath = resolve(distRoot, 'sitemap.xml');
  if (!(await exists(sitemapPath))) {
    fail('sitemap.xml is missing from dist');
    return;
  }
  const sitemap = await readFile(sitemapPath, 'utf8');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/giu)].map((match) => match[1].trim());
  const homeRoutes = [`${origin}/`, `${origin}/ru/`, `${origin}/en/`];
  const toolRoutes = toolPages.map(({ locale, type }) =>
    locale === 'hy' ? `${origin}/${type}/` : `${origin}/${locale}/${type}/`
  );
  const expected = [...homeRoutes, ...toolRoutes];
  if (locations.length !== expected.length || expected.some((url) => !locations.includes(url))) {
    fail(`sitemap must include ${expected.join(', ')}`);
  }
  const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/giu)];
  for (const entry of entries) {
    const location = entry[1].match(/<loc>([^<]+)<\/loc>/iu)?.[1]?.trim() ?? 'unknown URL';
    const matchedTool = toolPages.find(({ locale, type }) => {
      const url = locale === 'hy' ? `${origin}/${type}/` : `${origin}/${locale}/${type}/`;
      return location === url;
    });
    const expectedAlternates = matchedTool
      ? new Map([
          ['hy', `${origin}/${matchedTool.type}/`],
          ['ru', `${origin}/ru/${matchedTool.type}/`],
          ['en', `${origin}/en/${matchedTool.type}/`],
          ['x-default', `${origin}/${matchedTool.type}/`]
        ])
      : new Map([
          ['hy', `${origin}/`],
          ['ru', `${origin}/ru/`],
          ['en', `${origin}/en/`],
          ['x-default', `${origin}/`]
        ]);
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

async function validateHeaders() {
  const headersPath = resolve(distRoot, '_headers');
  if (!(await exists(headersPath))) {
    fail('Cloudflare _headers is missing from dist');
    return;
  }
  const headers = await readFile(headersPath, 'utf8');
  const csp = headers.match(/Content-Security-Policy:\s*([^\r\n]+)/iu)?.[1] ?? '';
  if (!csp.includes("default-src 'self'")) fail('_headers must set default-src self');
  if (!csp.includes("script-src 'self' https://static.cloudflareinsights.com")) {
    fail('_headers must allow the Cloudflare Web Analytics beacon script');
  }
  if (!csp.includes("connect-src 'self'")) fail('_headers must keep API connections same-origin');
  if (/\*\s*;|\*$/u.test(csp)) fail('_headers CSP must not use a wildcard source');
}

function validateQuickCalculatorMarkup(html, page) {
  const visibleHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, '');
  for (const marker of ['data-quick-calculator', 'data-quick-region', 'data-quick-submit']) {
    if (!html.includes(marker)) fail(`${page}: missing quick calculator marker ${marker}`);
  }
  for (const forbidden of [
    'data-property-map',
    'data-roof-map-host',
    'data-calculator-wizard',
    'data-consumption-month',
    'data-roof-tilt',
    'data-roof-orientation',
    'data-roof-mounting-mode',
    'P25',
    'P50',
    'P75'
  ]) {
    if (visibleHtml.includes(forbidden)) {
      fail(`${page}: quick calculator must not include ${forbidden}`);
    }
  }
}

function validatePrivateCalculatorMarkup(html, page, type) {
  const robots = findMeta(html, 'name', 'robots')?.get('content')?.toLowerCase() ?? '';
  if (!robots.includes('noindex')) fail(`${page}: private calculator route must be noindex`);
  if (type === 'calculator/pro' && !html.includes('data-professional-calculator')) {
    fail(`${page}: professional calculator marker is missing`);
  }
  if (type === 'calculator/refine' && !html.includes('data-roof-refinement')) {
    fail(`${page}: roof refinement marker is missing`);
  }
}

async function validateNoLegacyCalculatorStyles() {
  const stylesheet = await readFile(resolve(projectRoot, 'src/styles/tools.css'), 'utf8');
  for (const selector of ['.calculator-workspace-menu', '.calculator-start', '.calculator-offer']) {
    if (stylesheet.includes(selector)) fail(`tools.css: unreachable legacy selector ${selector}`);
  }
}

async function validateRemovedFeatures(pages) {
  const forbiddenOutput = [
    '/soon/',
    'data-testimonials',
    'testimonials-track',
    'testimonial-card',
    'myenergy',
    'data-myenergy',
    'calculator-workspace-menu',
    'calculator-offer',
    'project-before-after'
  ];
  for (const [page, html] of pages) {
    for (const token of forbiddenOutput) {
      if (html.toLowerCase().includes(token.toLowerCase())) {
        fail(`${page}: removed feature token ${token} is present`);
      }
    }
  }

  for (const route of ['soon/index.html', 'ru/soon/index.html', 'en/soon/index.html']) {
    if (await exists(resolve(distRoot, route))) fail(`${route}: deleted /soon/ route was emitted`);
  }
}

function validateOfferCheckerMarkup(html, page) {
  for (const marker of ['data-offer-checker', 'data-offer-result', 'data-pricebook-reference']) {
    if (!html.includes(marker)) fail(`${page}: missing Offer Checker marker ${marker}`);
  }
  validateOfferCheckerPriceBookFallback(html, page);
}

function validateHomeCalculatorSeparation(html, page, calculatorHref) {
  for (const marker of [
    'data-address-form',
    'data-consumption-inputs',
    'data-location-stage',
    'data-property-map',
    'data-roof-stage',
    'data-analysis-ledger',
    'data-lead-form',
    "id='page-config'"
  ]) {
    if (html.includes(marker)) {
      fail(`${page}: full calculator marker ${marker} must live on the calculator route`);
    }
  }

  if (!html.includes(`href='${calculatorHref}'`)) {
    fail(`${page}: homepage needs a direct link to ${calculatorHref}`);
  }
  if (html.includes('/offer-checker/')) {
    fail(`${page}: homepage must not link to a separate Offer Checker route`);
  }
}

function validateCinematicHomeHero(html, page, calculatorHref) {
  const hero = html.match(/<section\b[^>]*\bdata-home-hero\b[^>]*>([\s\S]*?)<\/section>/iu)?.[1];
  if (!hero) {
    fail(`${page}: cinematic homepage hero is missing`);
    return;
  }
  for (const marker of [
    'data-hero-time-backdrop',
    'hero-time-20-640.avif',
    'hero-time-20-1024.avif',
    'hero-time-20-1600.avif',
    'data-hero-time-image',
    'data-hero-time-sun',
    'data-hero-dashboard',
    'data-hero-analysis-generation',
    'data-hero-analysis-coverage',
    'data-hero-analysis-savings',
    'data-hero-analysis-co2',
    'data-hero-example-co2',
    'data-hero-example-trees',
    'data-hero-analysis-bars',
    'hero-dashboard__facts',
    'hero-dashboard__note',
    'hero-dashboard__status',
    'hero-signature',
    'hero-scroll-cue',
    'hero-sun-note',
    'hero-outlook-note'
  ]) {
    if (!hero.includes(marker)) fail(`${page}: cinematic hero is missing ${marker}`);
  }
  if ((hero.match(new RegExp(`href='${escapeRegExp(calculatorHref)}'`, 'gu')) ?? []).length !== 1) {
    fail(`${page}: hero must have exactly one calculator CTA`);
  }
  if (/<(?:video|canvas)\b|three(?:\.js)?|webgl/iu.test(hero)) {
    fail(`${page}: hero must not ship video, canvas, WebGL or Three.js`);
  }
  if (hero.includes('hero-energy-arc')) {
    fail(
      `${page}: supplied time artwork already contains the energy path; no duplicate SVG arc is allowed`
    );
  }
  if (!/data-dashboard-mode='example'|data-dashboard-mode="example"/u.test(hero)) {
    fail(`${page}: Hero's fixed values must be visibly marked as an example`);
  }
  if (!/8[ ,]420/u.test(hero) || !/3[,.]5/u.test(hero) || !/59/u.test(hero)) {
    fail(`${page}: Hero is missing the approved static example metrics`);
  }
  if (/equivalent to\s*~?\s*\d+\s*homes|эквивалент\s*~?\s*\d+\s*дом|տան\s*համարժեք/iu.test(hero)) {
    fail(`${page}: Hero must not claim a homes-equivalent benchmark`);
  }
  if (!html.includes('data-passport-bridge')) {
    fail(`${page}: homepage is missing the Solar Passport bridge`);
  }
}

async function validateHeroTimeAssets() {
  for (const hour of [8, 12, 14, 16, 18, 20]) {
    for (const width of [640, 1024, 1600]) {
      for (const extension of ['avif', 'webp', 'jpg']) {
        const asset = resolve(distRoot, 'images', `hero-time-${hour}-${width}.${extension}`);
        if (!(await exists(asset)))
          fail(`missing local-time Hero asset: ${relative(distRoot, asset)}`);
      }
    }
  }
}

function validateCompanyRecord(html, page) {
  for (const marker of [
    "id='company-record'",
    'RBE4-88FA-4C78-8ECF',
    '999.110.1603227',
    '02338724',
    "href='https://verify.e-gov.am'"
  ]) {
    if (!html.includes(marker)) fail(`${page}: missing verified company-record marker ${marker}`);
  }
  if (/\/documents\/(?:charter_template|RBE4-88FA-4C78-8ECF)\.pdf/iu.test(html)) {
    fail(`${page}: must not publish the supplied legal source PDF with personal data`);
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
for (const [page, calculatorHref] of [
  ['index.html', '/calculator/'],
  ['ru/index.html', '/ru/calculator/'],
  ['en/index.html', '/en/calculator/']
]) {
  if (pages.has(page)) {
    validateHomeCalculatorSeparation(pages.get(page), page, calculatorHref);
    validateCinematicHomeHero(pages.get(page), page, calculatorHref);
    validateCompanyRecord(pages.get(page), page);
  }
}
for (const { page, locale, type } of toolPages) {
  if (!pages.has(page)) continue;
  const canonical = locale === 'hy' ? `${origin}/${type}/` : `${origin}/${locale}/${type}/`;
  await validateToolSeo(pages.get(page), page, canonical, type);
  validateToolLanguageSwitcher(pages.get(page), page, locale, type);
}
for (const { page, type } of toolPages) {
  if (!pages.has(page)) continue;
  if (type === 'calculator') validateQuickCalculatorMarkup(pages.get(page), page);
  if (type === 'offer-checker') validateOfferCheckerMarkup(pages.get(page), page);
}
for (const { page, locale, type } of privateCalculatorPages) {
  if (!pages.has(page)) continue;
  validatePrivateCalculatorMarkup(pages.get(page), page, type);
  validateNoindexLocalizedPage(pages.get(page), page, locale, type);
}
const publishedPages = new Set([
  'index.html',
  'ru/index.html',
  'en/index.html',
  ...toolPages.map(({ page }) => page)
]);
const supportPageSet = new Set([
  'privacy/index.html',
  'terms/index.html',
  'ru/privacy/index.html',
  'ru/terms/index.html',
  'en/privacy/index.html',
  'en/terms/index.html'
]);
for (const page of expectedPages.filter(
  (page) => !publishedPages.has(page) && supportPageSet.has(page)
)) {
  if (!pages.has(page)) continue;
  const locale = page.startsWith('ru/') ? 'ru' : page.startsWith('en/') ? 'en' : 'hy';
  const type = page.includes('/privacy/') || page === 'privacy/index.html' ? 'privacy' : 'terms';
  validateNoindexLocalizedPage(pages.get(page), page, locale, type);
}
await validateSitemap();
await validateHeaders();
await validateNoLegacyCalculatorStyles();
await validateRemovedFeatures(pages);
await validateHeroTimeAssets();

if (failures.length > 0) {
  console.error('Build validation failed:\n');
  for (const message of failures) console.error(`- ${message}`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Build validation passed for ${pages.size} routes.\n`);
}
