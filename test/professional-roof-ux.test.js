import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import calculatorWizard from '../src/content/calculator-wizard.js';
import en from '../src/content/en.js';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';
import { getViewportPopoverPosition } from '../src/ui/calculator-wizard.js';

const root = resolve(import.meta.dirname, '..');
const source = (path) => readFile(resolve(root, path), 'utf8');

test('Professional roof UX distinguishes roof tilt from optional PV array controls', async () => {
  const expected = {
    hy: {
      tiltLabel: 'Տանիքի թեքություն',
      tiltHelp:
        'Տանիքի թեքության անկյունը հորիզոնի նկատմամբ։ Հարթ տանիքը մոտ 0° է, իսկ թեք տանիքները հաճախ 20–35°։ Եթե ճշգրիտ անկյունը չգիտեք, նշեք մոտավոր արժեքը։',
      arrayTiltLabel: 'PV զանգվածի թեքություն (ոչ պարտադիր)',
      arrayTiltHelp:
        'Միայն հենարանների վրա թեքված շարքերի համար։ Սա վահանակների անկյունն է, ոչ թե տանիքի։ Եթե դաշտը դատարկ թողնեք, YOURENERGY-ը կընտրի կատալոգով աջակցվող՝ PVGIS-ի հաշվարկային օպտիմումին ամենամոտ անկյունը։',
      arrayAzimuthLabel: 'PV զանգվածի ուղղություն (ոչ պարտադիր)',
      arrayAzimuthHelp:
        'Միայն հենարանների վրա թեքված շարքերի համար։ Սա վահանակների ուղղությունն է ըստ կողմնացույցի։ Եթե դաշտը դատարկ թողնեք, YOURENERGY-ը կօգտագործի PVGIS-ի առաջարկվող ուղղությունը։',
      engineeringParameters: 'Ինժեներական պարամետրեր'
    },
    ru: {
      tiltLabel: 'Наклон крыши',
      tiltHelp:
        'Угол наклона самой крыши относительно горизонта. Плоская крыша — около 0°, наклонные крыши часто имеют 20–35°. Если точный угол неизвестен, укажите приблизительное значение.',
      arrayTiltLabel: 'Наклон PV-массива (необязательно)',
      arrayTiltHelp:
        'Только для наклонных рядов на опорах. Это угол самих солнечных панелей, а не крыши. Если оставить поле пустым, YOURENERGY автоматически выберет ближайший поддерживаемый каталогом угол к расчётному оптимуму PVGIS.',
      arrayAzimuthLabel: 'Направление PV-массива (необязательно)',
      arrayAzimuthHelp:
        'Только для наклонных рядов на опорах. Это направление самих панелей по компасу. Если оставить поле пустым, YOURENERGY использует рекомендуемое PVGIS направление.',
      engineeringParameters: 'Инженерные параметры'
    },
    en: {
      tiltLabel: 'Roof tilt',
      tiltHelp:
        'The angle of the roof itself relative to horizontal. A flat roof is about 0°, while pitched roofs are often around 20–35°. If you do not know the exact angle, enter an approximate value.',
      arrayTiltLabel: 'PV array tilt (optional)',
      arrayTiltHelp:
        'Only for tilted rows on supports. This is the tilt of the solar panels, not the roof. If left blank, YOURENERGY automatically selects the closest catalog-supported angle to the PVGIS calculated optimum.',
      arrayAzimuthLabel: 'PV array direction (optional)',
      arrayAzimuthHelp:
        'Only for tilted rows on supports. This is the compass direction of the panels themselves. If left blank, YOURENERGY uses the PVGIS recommended direction.',
      engineeringParameters: 'Engineering parameters'
    }
  };
  const content = { hy, ru, en };

  for (const [locale, copy] of Object.entries(expected)) {
    const roof = content[locale].product.roof;
    assert.equal(roof.tiltLabel, copy.tiltLabel);
    assert.equal(roof.tiltHelp, copy.tiltHelp);
    assert.equal(roof.arrayTiltLabel, copy.arrayTiltLabel);
    assert.equal(roof.arrayTiltHelp, copy.arrayTiltHelp);
    assert.equal(roof.arrayAzimuthLabel, copy.arrayAzimuthLabel);
    assert.equal(roof.arrayAzimuthHelp, copy.arrayAzimuthHelp);
    assert.ok(roof.tiltInfoLabel);
    assert.ok(roof.arrayTiltInfoLabel);
    assert.ok(roof.arrayAzimuthInfoLabel);
    assert.equal(calculatorWizard[locale].engineeringParameters, copy.engineeringParameters);
  }

  const [template, controller, styles] = await Promise.all([
    source('src/templates/calculator.hbs'),
    source('src/ui/calculator-wizard.js'),
    source('src/styles/calculator/roof-results.css')
  ]);
  assert.equal((template.match(/data-roof-info-toggle/gu) ?? []).length, 3);
  assert.match(template, /data-roof-info-toggle aria-label=/u);
  assert.match(template, /data-roof-info-popover role='dialog'/u);
  assert.ok((template.match(/<use href='\/icons\.svg#info'><\/use>/gu) ?? []).length >= 3);
  assert.equal((template.match(/professional-info-control/gu) ?? []).length, 3);
  assert.match(template, /professional-array-geometry' data-array-geometry hidden/u);
  assert.match(controller, /if \(arrayGeometry\) arrayGeometry\.hidden = !elevated;/u);
  assert.match(controller, /if \(arrayTilt\) arrayTilt\.disabled = !elevated;/u);
  assert.match(controller, /if \(arrayAzimuth\) arrayAzimuth\.disabled = !elevated;/u);
  assert.match(controller, /event\.key !== 'Escape'/u);
  assert.match(styles, /\.professional-field-help \{[\s\S]*?position: fixed;/u);
  assert.match(styles, /\.professional-info-control \{\s*position: relative;/u);
  assert.match(controller, /getViewportPopoverPosition\(/u);
  assert.match(controller, /window\.addEventListener\('resize', positionOpenRoofInfoPopovers\)/u);
  assert.match(styles, /\.professional-roof-form \{[\s\S]*?z-index: 2;/u);
});

test('Professional roof help popovers remain inside narrow and short viewports', () => {
  const narrow = getViewportPopoverPosition({
    triggerRect: { top: 48, bottom: 72, right: 304 },
    popoverRect: { width: 400, height: 190 },
    viewportWidth: 320,
    viewportHeight: 640
  });
  assert.deepEqual(narrow, {
    left: 12,
    top: 72,
    width: 296,
    maximumHeight: 556,
    placement: 'below'
  });

  const short = getViewportPopoverPosition({
    triggerRect: { top: 580, bottom: 604, right: 780 },
    popoverRect: { width: 400, height: 260 },
    viewportWidth: 800,
    viewportHeight: 640
  });
  assert.deepEqual(short, {
    left: 380,
    top: 320,
    width: 400,
    maximumHeight: 568,
    placement: 'above'
  });
});
