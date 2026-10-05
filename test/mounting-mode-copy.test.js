import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import calculatorWizard from '../src/content/calculator-wizard.js';
import en from '../src/content/en.js';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';

const root = resolve(import.meta.dirname, '..');
const source = (path) => readFile(resolve(root, path), 'utf8');

test('Professional mounting-mode copy distinguishes roof-plane panels from tilted rows', async () => {
  const expected = {
    ru: {
      roofParallel: 'По плоскости крыши',
      roofParallelHelp: 'Панели устанавливаются по существующей поверхности крыши.',
      elevated: 'Наклонные ряды на опорах',
      elevatedHelp:
        'Панели устанавливаются отдельными наклонными рядами, обычно на плоской крыше. Между рядами учитывается расстояние для снижения взаимного затенения.'
    },
    en: {
      roofParallel: 'Along the roof plane',
      roofParallelHelp: 'Panels are installed following the existing roof surface.',
      elevated: 'Tilted rows on supports',
      elevatedHelp:
        'Panels are installed in separate tilted rows, typically on a flat roof. Row spacing is considered to reduce inter-row shading.'
    },
    hy: {
      roofParallel: 'Տանիքի հարթությամբ',
      roofParallelHelp: 'Վահանակները տեղադրվում են տանիքի առկա հարթությամբ։',
      elevated: 'Հենարանների վրա թեքված շարքեր',
      elevatedHelp:
        'Վահանակները տեղադրվում են առանձին թեքված շարքերով, սովորաբար հարթ տանիքի վրա։ Հաշվի է առնվում շարքերի միջև հեռավորությունը՝ փոխադարձ ստվերումը նվազեցնելու համար։'
    }
  };
  const content = { ru, en, hy };

  for (const locale of Object.keys(expected)) {
    const mountingModes = content[locale].product.roof.mountingModes;
    assert.deepEqual(mountingModes, expected[locale]);
    assert.equal(calculatorWizard[locale].parallel, mountingModes.roofParallel);
    assert.equal(calculatorWizard[locale].elevated, mountingModes.elevated);
  }

  const [template, controller] = await Promise.all([
    source('src/templates/calculator.hbs'),
    source('src/ui/calculator-wizard.js')
  ]);
  assert.match(template, /data-roof-mounting-mode-help/u);
  assert.match(template, /mountingModes\.roofParallelHelp/u);
  assert.match(
    controller,
    /elevated \? 'elevatedHelp' : 'roofParallelHelp'/u,
    'the displayed description must follow the selected mounting mode'
  );
});
