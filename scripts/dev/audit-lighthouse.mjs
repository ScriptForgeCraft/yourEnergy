import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createPageRegistry } from '../../src/config/routes.js';

// Sequential runs avoid CPU contention. Defaults retain Lighthouse's standard
// mobile/desktop throttling and audit every indexable localized production page.
const args = new Map(process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')));
const origin = args.get('origin') || 'http://127.0.0.1:4173';
const directory = resolve('reports/lighthouse', args.get('batch') || 'latest');
const modes = args.get('device') ? [args.get('device')] : ['mobile', 'desktop'];
if (modes.some((mode) => !['mobile', 'desktop'].includes(mode))) throw new Error('Invalid device');
const pages = (await createPageRegistry()).filter(
  (page) =>
    (page.indexable || args.has('include-noindex')) &&
    (!args.get('locale') || page.locale === args.get('locale')) &&
    (!args.get('kind') || args.get('kind').split(',').includes(page.kind))
);
if (!pages.length)
  throw new Error(
    'No routes matched the audit filters. Quote comma-separated arguments in PowerShell.'
  );
const nodeExecutable = process.env.LIGHTHOUSE_NODE || process.execPath;
const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
if (!process.env.LIGHTHOUSE_NODE && (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 19))) {
  throw new Error(
    'Lighthouse 13 requires Node >=22.19. Run this script with a supported Node version or set LIGHTHOUSE_NODE to its executable.'
  );
}
await mkdir(directory, { recursive: true });
await writeFile(
  resolve(directory, 'routes.json'),
  JSON.stringify(
    pages.map(({ path, kind, locale, indexable }) => ({ path, kind, locale, indexable })),
    null,
    2
  )
);
const results = [];
for (const page of pages) {
  for (const device of modes) {
    const name = `${device}-${page.path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'}`;
    const output = resolve(directory, `${name}.json`);
    const command = [
      resolve('node_modules/lighthouse/cli/index.js'),
      new URL(page.path, origin).href,
      '--chrome-flags=--headless',
      '--quiet',
      '--output=json',
      `--output-path=${output}`,
      '--only-categories=performance,accessibility,best-practices,seo',
      ...(device === 'desktop' ? ['--preset=desktop'] : [])
    ];
    const exitCode = await new Promise((accept, reject) => {
      const child = spawn(nodeExecutable, command, { stdio: 'inherit', windowsHide: true });
      child.on('error', reject);
      child.on('close', accept);
    });
    const report = await readFile(output, 'utf8')
      .then(JSON.parse)
      .catch(() => null);
    const scores = Object.fromEntries(
      Object.entries(report?.categories || {}).map(([key, value]) => [
        key,
        value.score === null ? null : Math.round(value.score * 100)
      ])
    );
    const row = {
      path: page.path,
      locale: page.locale,
      kind: page.kind,
      indexable: page.indexable,
      device,
      scores,
      time: report?.fetchTime,
      lighthouse: report?.lighthouseVersion,
      exitCode,
      error: report?.runtimeError || null,
      warnings: report?.runWarnings || [],
      metrics: Object.fromEntries(
        [
          'first-contentful-paint',
          'largest-contentful-paint',
          'total-blocking-time',
          'cumulative-layout-shift',
          'speed-index'
        ].map((id) => [id, report?.audits[id]?.numericValue])
      ),
      failures: Object.values(report?.audits || {})
        .filter((audit) => audit.score !== null && audit.score < 1)
        .map(({ id, title, score, displayValue }) => ({ id, title, score, displayValue })),
      report: `${name}.json`
    };
    results.push(row);
    await writeFile(resolve(directory, 'summary.json'), JSON.stringify(results, null, 2));
    process.stdout.write(
      `${results.length}/${pages.length * modes.length} ${device} ${page.path} ${JSON.stringify(scores)}${row.error ? ` ERROR ${row.error.message}` : ''}\n`
    );
  }
}
if (results.some(({ error, exitCode }) => error || exitCode)) process.exitCode = 1;
