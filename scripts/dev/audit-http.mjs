import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createPageRegistry, pagePath } from '../../src/config/routes.js';

const origin = process.argv[2] || 'http://127.0.0.1:8789';
const pages = await createPageRegistry();
const results = [];
const check = async (path, expected, location) => {
  const response = await fetch(new URL(path, origin), { redirect: 'manual' });
  const body = await response.text();
  results.push({
    path,
    expected,
    status: response.status,
    location: response.headers.get('location')
  });
  assert.equal(response.status, expected, `${path}: unexpected status`);
  if (location)
    assert.equal(
      new URL(response.headers.get('location'), origin).pathname +
        new URL(response.headers.get('location'), origin).search,
      location
    );
  return body;
};
try {
  for (const page of pages) {
    const moved = ['calculator-pro', 'calculator-refine'].includes(page.kind);
    const shell = page.kind === 'calculator-shell';
    const missing = page.kind === 'not-found';
    if (moved) {
      const target = `${pagePath(page.locale, 'calculator')}?mode=pro`;
      for (const path of [page.path, page.path.slice(0, -1), `${page.path}index.html`])
        await check(path, 301, target);
    } else if (shell) {
      // Pages canonicalizes HTML extensions; the client follows this redirect.
      const response = await fetch(new URL(page.path, origin));
      assert.equal(response.status, 200);
      assert.match(await response.text(), /data-professional-calculator/u);
      results.push({
        path: page.path,
        expected: 200,
        status: response.status,
        finalUrl: response.url
      });
    } else if (missing) {
      const body = await check(`${pagePath(page.locale)}audit-does-not-exist/`, 404);
      assert.match(body, new RegExp(`<html lang=['"]${page.locale}['"]`));
      assert.match(body, /noindex/u);
    } else {
      const body = await check(page.path, 200);
      assert.match(body, new RegExp(`<html lang=['"]${page.locale}['"]`));
      if (page.indexable) assert.doesNotMatch(body, /name=['"]robots['"][^>]*noindex/u);
    }
  }
  assert.match(await check('/robots.txt', 200), /Sitemap: https:\/\/yourenergy\.am\/sitemap\.xml/u);
  const sitemap = await check('/sitemap.xml', 200);
  assert.equal(
    [...sitemap.matchAll(/<loc>/gu)].length,
    pages.filter(({ indexable }) => indexable).length
  );
  await check('/missing-file.js', 404);
  const headers = await readFile('dist/_headers', 'utf8');
  assert.doesNotMatch(
    headers,
    /\/assets\/\*\n/u,
    'Unversioned equipment files must not be immutable'
  );
  process.stdout.write(`HTTP audit passed: ${results.length} route/status checks.\n`);
} finally {
  await mkdir('reports/http', { recursive: true });
  await writeFile(
    'reports/http/summary.json',
    JSON.stringify({ origin, at: new Date().toISOString(), results }, null, 2)
  );
}
