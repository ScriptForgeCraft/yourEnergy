import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { projectRoot, distRoot } from '../build/paths.mjs';

const reportRoot = resolve(projectRoot, 'reports/architecture');
mkdirSync(reportRoot, { recursive: true });
const git = (...args) => execFileSync('git', args, { cwd: projectRoot, encoding: 'utf8' });
const hashFiles = (files) =>
  Object.fromEntries(
    files
      .sort()
      .map((file) => [
        relative(projectRoot, file).split(sep).join('/'),
        createHash('sha256').update(readFileSync(file)).digest('hex')
      ])
  );
const sourceHashes = () =>
  hashFiles(
    [
      ...new Set(
        git('ls-files', '-c', '-o', '--exclude-standard', '-z').split('\0').filter(Boolean)
      )
    ]
      .map((file) => resolve(projectRoot, file))
      .filter(existsSync)
  );
const walk = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
const run = (script, logName) => {
  if (!process.env.npm_execpath) throw new Error('Run with npm run verify:clean.');
  process.stdout.write(`Running npm run ${script}\n`);
  try {
    const log = execFileSync(process.execPath, [process.env.npm_execpath, 'run', script], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    writeFileSync(resolve(reportRoot, logName), log);
  } catch (error) {
    writeFileSync(resolve(reportRoot, logName), `${error.stdout ?? ''}\n${error.stderr ?? ''}`);
    throw error;
  }
};
const before = sourceHashes();
const status = git('status', '--short');
writeFileSync(resolve(reportRoot, 'status-before-build.txt'), status);
for (const directory of ['.generated', 'dist']) {
  const target = resolve(projectRoot, directory);
  if (relative(projectRoot, target) !== directory)
    throw new Error(`Unsafe cleanup target: ${target}`);
  rmSync(target, { recursive: true, force: true });
}
run('build', 'clean-build.log');
const firstOutput = hashFiles(walk(distRoot));
// Deliberate stale output proves both generators clean removed routes/assets.
for (const directory of ['.generated/site/soon', '.generated/public/images'])
  mkdirSync(resolve(projectRoot, directory), { recursive: true });
writeFileSync(resolve(projectRoot, '.generated/site/soon/index.html'), 'stale route');
writeFileSync(resolve(projectRoot, '.generated/public/images/stale.webp'), 'stale image');
run('build', 'repeat-build.log');
assert.deepEqual(hashFiles(walk(distRoot)), firstOutput, 'build output is not reproducible');
assert.deepEqual(sourceHashes(), before, 'build mutated source files');
assert.equal(git('status', '--short'), status, 'build changed git status');
assert.equal(existsSync(resolve(projectRoot, '.generated/site/soon/index.html')), false);
assert.equal(existsSync(resolve(projectRoot, '.generated/public/images/stale.webp')), false);
run('verify:build', 'clean-verify.log');
writeFileSync(resolve(reportRoot, 'status-after-build.txt'), git('status', '--short'));
writeFileSync(
  resolve(reportRoot, 'reproducibility.json'),
  JSON.stringify(
    {
      sourceFiles: Object.keys(before).length,
      outputFiles: Object.keys(firstOutput).length,
      sourceUnchanged: true,
      gitStatusUnchanged: true,
      outputByteIdentical: true,
      staleOutputsRemoved: true
    },
    null,
    2
  ) + '\n'
);
process.stdout.write(
  'Clean/repeat builds passed: identical output, unchanged source and Git status, stale outputs removed.\n'
);
