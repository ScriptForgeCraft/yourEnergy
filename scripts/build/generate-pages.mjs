import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import Handlebars from 'handlebars';
import { loadEnv } from 'vite';
import { createPageRegistry } from '../../src/config/routes.js';
import { createPageContextBuilder } from './page-contexts.mjs';
import { projectRoot, siteRoot, publicRoot } from './paths.mjs';
import { renderSitemap } from './sitemap.mjs';

const mode = process.argv[2] ?? 'production';
const publicEnv = {
  ...loadEnv(mode, projectRoot, 'VITE_'),
  ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('VITE_')))
};
const pages = await createPageRegistry();
const contextFor = createPageContextBuilder({ publicEnv, pages });
const templates = {
  home: 'home',
  calculator: 'calculator-quick',
  'calculator-shell': 'calculator',
  'calculator-pro': 'calculator-migration',
  'calculator-refine': 'calculator-migration',
  privacy: 'support',
  terms: 'support',
  blog: 'blog-index',
  'blog-article': 'blog-article'
};
const readTemplate = (name) => readFile(resolve(projectRoot, `src/templates/${name}.hbs`), 'utf8');
for (const name of ['site-header', 'site-footer', 'journey-story']) {
  Handlebars.registerPartial(name, await readTemplate(`partials/${name}`));
}
Handlebars.registerHelper('add', (left, right) => Number(left) + Number(right));
const renderers = new Map();
await rm(siteRoot, { recursive: true, force: true });
for (const page of pages) {
  const name = templates[page.kind] ?? page.kind;
  if (!renderers.has(name))
    renderers.set(name, Handlebars.compile(await readTemplate(name), { noEscape: false }));
  const markup = renderers.get(name)(contextFor(page));
  const output = resolve(siteRoot, page.file);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, markup.replace(/[ \t]+\n/g, '\n'), 'utf8');
}
await mkdir(publicRoot, { recursive: true });
await writeFile(resolve(publicRoot, 'sitemap.xml'), renderSitemap(pages), 'utf8');
