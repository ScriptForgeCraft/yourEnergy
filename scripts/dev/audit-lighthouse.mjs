import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createPageRegistry } from '../../src/config/routes.js';

// Sequential runs avoid CPU contention. Defaults retain Lighthouse's standard
// mobile/desktop throttling, audit every indexable localized production page,
// and cover the Professional calculator's public query entry point.
const args = new Map(process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')));
const origin = args.get('origin') || 'http://127.0.0.1:4173';
const directory = resolve('reports/lighthouse', args.get('batch') || 'latest');
const modes = args.get('device') ? [args.get('device')] : ['mobile', 'desktop'];
if (modes.some((mode) => !['mobile', 'desktop'].includes(mode))) throw new Error('Invalid device');
const requestedKinds = args.get('kind')?.split(',') ?? null;
const registry = await createPageRegistry();
const professionalCalculatorPages = registry
  .filter((page) => page.kind === 'calculator')
  .map((page) => ({
    ...page,
    kind: 'calculator-pro-mode',
    path: `${page.path}?mode=pro`,
    indexable: false
  }));
const pages = [...registry, ...professionalCalculatorPages].filter(
  (page) =>
    (page.indexable || page.kind === 'calculator-pro-mode' || args.has('include-noindex')) &&
    (!args.get('locale') || page.locale === args.get('locale')) &&
    (!requestedKinds || requestedKinds.includes(page.kind))
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
const fingerprintBuild = async () => {
  const hash = createHash('sha256');
  const visit = async (folder, prefix = '') => {
    const entries = await readdir(folder, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const path = resolve(folder, entry.name);
      const name = `${prefix}${entry.name}`;
      if (entry.isDirectory()) await visit(path, `${name}/`);
      else if (entry.isFile()) {
        const bytes = await readFile(path);
        hash.update(`${name}\0${bytes.length}\0`).update(bytes);
      }
    }
  };
  await visit(resolve('dist'));
  return hash.digest('hex');
};
const manifest = {
  build: await fingerprintBuild(),
  origin,
  modes,
  paths: pages.map(({ path }) => path),
  lighthouse: JSON.parse(await readFile('node_modules/lighthouse/package.json', 'utf8')).version
};
const manifestPath = resolve(directory, 'manifest.json');
const existingManifest = await readFile(manifestPath, 'utf8').catch((error) => {
  if (error.code !== 'ENOENT') throw error;
  return null;
});
if (existingManifest) {
  if (!args.has('resume')) throw new Error('Batch already exists. Use --resume or a new --batch.');
  if (JSON.stringify(JSON.parse(existingManifest)) !== JSON.stringify(manifest))
    throw new Error('Build, origin or audit settings changed. Start a new batch.');
} else {
  const existingFiles = await readdir(directory);
  if (existingFiles.length) throw new Error('Nonempty legacy batch: choose a new --batch.');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
}
await writeFile(
  resolve(directory, 'routes.json'),
  JSON.stringify(
    pages.map(({ path, kind, locale, indexable }) => ({ path, kind, locale, indexable })),
    null,
    2
  )
);
const results = existingManifest
  ? await readFile(resolve(directory, 'summary.json'), 'utf8')
      .then(JSON.parse)
      .catch((error) => {
        if (error.code !== 'ENOENT') throw error;
        return [];
      })
  : [];
for (const page of pages) {
  for (const device of modes) {
    // Preserve every recorded attempt, including failures. Resume only fills
    // interrupted/missing runs; it never cherry-picks a better score.
    if (results.some((row) => row.path === page.path && row.device === device)) continue;
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
if ((await fingerprintBuild()) !== manifest.build)
  throw new Error('Build changed during measurement. These results are not a single-build audit.');
if (results.some(({ error, exitCode }) => error || exitCode)) process.exitCode = 1;
