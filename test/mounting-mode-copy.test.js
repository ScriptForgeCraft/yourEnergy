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
      roofParallelHelp:
        'Панели устанавливаются рядом по существующему скату крыши. Межрядовое расстояние из-за наклона панелей отдельно не требуется.',
      elevated: 'Наклонные ряды на опорах',
      elevatedHelp:
        'Панели устанавливаются отдельными рядами на опорах, обычно на плоской крыше. Между рядами учитывается расстояние для снижения взаимного затенения.'
    },
    en: {
      roofParallel: 'Along the roof plane',
      roofParallelHelp:
        'Panels are installed side by side following the existing roof slope. No separate row-spacing allowance is applied for panel tilt.',
      elevated: 'Tilted rows on supports',
      elevatedHelp:
        'Panels are installed in separate tilted rows, typically on a flat roof. Spacing between rows is considered to reduce inter-row shading.'
    },
    hy: {
      roofParallel: 'Տանիքի հարթությամբ',
      roofParallelHelp:
        'Վահանակները տեղադրվում են կողք կողքի՝ տանիքի առկա լանջի հարթությանը հետևելով։ Վահանակների թեքության պատճառով շարքերի միջև առանձին հեռավորություն չի պահանջվում։',
      elevated: 'Հենարանների վրա թեքված շարքեր',
      elevatedHelp:
        'Վահանակները տեղադրվում են հենարանների վրա՝ առանձին թեքված շարքերով, սովորաբար՝ հարթ տանիքի վրա։ Փոխադարձ ստվերումը նվազեցնելու համար հաշվի է առնվում շարքերի միջև եղած հեռավորությունը։'
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
