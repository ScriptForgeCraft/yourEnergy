import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const [reportPath, outputPath] = process.argv.slice(2);

if (!reportPath || !outputPath) {
  throw new Error(
    'Usage: node scripts/extract-lighthouse-screenshot.mjs <report.json> <output.jpg>'
  );
}

const report = JSON.parse(await readFile(reportPath, 'utf8'));
const data = report.audits?.['final-screenshot']?.details?.data;

if (!data?.startsWith('data:image/')) {
  throw new Error(`No final screenshot found in ${reportPath}`);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, Buffer.from(data.slice(data.indexOf(',') + 1), 'base64'));
