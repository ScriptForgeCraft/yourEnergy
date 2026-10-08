import assert from 'node:assert/strict';
import test from 'node:test';

import { legalDocuments } from '../src/content/legal.js';

const documentText = (document) =>
  document.sections
    .flatMap(({ title, blocks }) => [
      title,
      ...blocks.flatMap(({ heading, text, items, lines }) => [
        heading,
        text,
        ...(items ?? []),
        ...(lines ?? [])
      ])
    ])
    .filter(Boolean)
    .join(' ');

test('Privacy Policy explicitly identifies precise property and roof-outline data', () => {
  const expectedTerms = {
    hy: [/ճշգրիտ կոորդինատ/u, /տանիքի ուրվագիծ/u, /մասնագիտական հաշվիչ/u],
    ru: [/точные координаты/u, /контур крыши/u, /профессиональном калькуляторе/u],
    en: [/precise coordinates/u, /roof outline/u, /Professional Calculator/u]
  };

  for (const [locale, terms] of Object.entries(expectedTerms)) {
    const text = documentText(legalDocuments.privacy[locale]);
    for (const term of terms) assert.match(text, term, `${locale}: ${term}`);
  }
});
