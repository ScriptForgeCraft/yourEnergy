import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { projectsPageCopy } from '../src/content/projects.js';

test('visible step counters do not use leading zeroes', async () => {
  const [aboutStyles, projectsTemplate] = await Promise.all([
    readFile(new URL('../src/styles/about.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/templates/projects.hbs', import.meta.url), 'utf8')
  ]);

  assert.match(aboutStyles, /content: counter\(about-step\);/u);
  assert.doesNotMatch(aboutStyles, /content: '0' counter\(about-step\);/u);
  assert.match(projectsTemplate, /<b>1<\/b> \/ \{\{projectsPage\.featured\.kicker\}\}/u);
  for (const content of Object.values(projectsPageCopy))
    assert.deepEqual(
      content.process.steps.map(({ number }) => number),
      ['1', '2', '3', '4']
    );
});
