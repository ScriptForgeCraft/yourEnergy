import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import calculatorWizard from '../src/content/calculator-wizard.js';
import { calculatorModes } from '../src/content/calculator-modes.js';
import en from '../src/content/en.js';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';
import { getViewportPopoverPosition } from '../src/ui/calculator-wizard.js';

const root = resolve(import.meta.dirname, '..');
const source = (path) => readFile(resolve(root, path), 'utf8');

test('Professional roof UX distinguishes roof tilt from optional PV array controls', async () => {
  const expected = {
    hy: {
      copy: 'Ուրվագծեք տանիքի հասանելի հատվածը և նշեք դրա ուղղվածությունն ու թեքությունը՝ նախնական գնահատման համար։',
      areaMethodTitle: 'Ինչպես նշել մակերեսը',
      areaMethodHelp:
        'Քարտեզի ուրվագիծը ցույց է տալիս տանիքի մակերեսը վերևից։ Թեք տանիքի դեպքում իրական մակերեսը կարող է ավելի մեծ լինել։ Եթե գիտեք տանիքի այս հատվածի չափված մակերեսը, օգտագործեք այն։',
      mapProjected: 'Քարտեզի ուրվագիծ — մակերեսը վերևից',
      measuredPlane: 'Տանիքի հատվածի չափված մակերես',
      planeAreaHelp:
        'Մուտքագրեք տանիքի այս հատվածի իրական չափված մակերեսը մ²-ով։ Տվյալը նախնական է մինչև ինժեների տեղազննումը։',
      planeAreaSummary: 'Հաշվարկում օգտագործվող տանիքի մակերես',
      orientationLabel: 'Տանիքի ուղղվածություն',
      orientationHelp: 'Ընտրեք, թե որ կողմ է նայում տանիքի այս հատվածը։',
      tiltLabel: 'Տանիքի թեքություն',
      tiltHelp:
        'Տանիքի թեքության անկյունը հորիզոնի նկատմամբ։ Հարթ տանիքը մոտ 0° է, իսկ թեք տանիքները հաճախ 20–35°։ Եթե ճշգրիտ անկյունը չգիտեք, նշեք մոտավոր արժեքը։',
      arrayTiltLabel: 'Վահանակների թեքություն (ոչ պարտադիր)',
      arrayTiltHelp:
        'Միայն հենարանների վրա թեքված շարքերի համար։ Սա վահանակների անկյունն է, ոչ թե տանիքի։ Եթե դաշտը դատարկ թողնեք, YOURENERGY-ը կընտրի կատալոգով աջակցվող՝ PVGIS-ի հաշվարկային օպտիմումին ամենամոտ անկյունը։',
      arrayAzimuthLabel: 'Վահանակների ուղղություն (ոչ պարտադիր)',
      arrayAzimuthHelp:
        'Միայն հենարանների վրա թեքված շարքերի համար։ Սա վահանակների ուղղությունն է ըստ կողմնացույցի։ Եթե դաշտը դատարկ թողնեք, YOURENERGY-ը կօգտագործի PVGIS-ի առաջարկվող ուղղությունը։',
      resultArrayTilt: 'Վահանակների թեքություն',
      resultArrayAzimuth: 'Վահանակների ուղղություն',
      roofCapacityAssumption:
        'Հենարանների վրա մեկ ուղղությամբ թեքված շարքերի նախնական GCR-ը {ratio}% է։ Տեղային խոչընդոտները, անցումները և եզրային հեռավորությունները չեն չափագրվել։',
      mountingHardwareEngineeringCopy:
        'Կատալոգային անկյունը չի փոխում տանիքի մուտքագրված թեքությունն ու ուղղվածությունը։ Կոնստրուկցիան և քամու բեռը հաստատվում են ինժեների կողմից։',
      parametersRequired: 'Հաշվարկի համար նշեք տանիքի ուղղվածությունն ու թեքությունը։',
      angleGuideTitle: 'Ստուգեք տանիքի ուղղվածությունն ու թեքությունը',
      angleGuideCopy: 'Սլաքը ցույց է տալիս Ձեր նշած տանիքի ուղղվածությունը։',
      angleGuideOrientation: 'Տանիքի ուղղվածություն',
      angleGuideTilt: 'Տանիքի թեքություն',
      benchmarkOrientation: 'Հենարանների վրա շարքերի հղումային ուղղություն',
      benchmarkTilt: 'Հենարանների վրա շարքերի հղումային թեքություն',
      orientationRequired: 'Ընտրեք տանիքի ուղղվածությունը։',
      refineArea: 'Չափված տանիքի մակերես',
      engineeringParameters: 'Ինժեներական պարամետրեր'
    },
    ru: {
      copy: 'Обведите доступный участок крыши и укажите его ориентацию и наклон для предварительной оценки.',
      areaMethodTitle: 'Как указать площадь',
      areaMethodHelp:
        'Контур на карте показывает крышу сверху. На наклонной крыше реальная площадь поверхности может быть больше. Если вы знаете измеренную площадь этого участка крыши, используйте её.',
      mapProjected: 'Контур на карте — площадь сверху',
      measuredPlane: 'Измеренная площадь участка крыши',
      planeAreaHelp:
        'Введите фактически измеренную площадь этого участка крыши в м². Данные остаются предварительными до осмотра инженером.',
      planeAreaSummary: 'Площадь крыши в расчёте',
      orientationLabel: 'Ориентация крыши',
      orientationHelp: 'Выберите, в какую сторону обращён этот участок крыши.',
      tiltLabel: 'Наклон крыши',
      tiltHelp:
        'Угол наклона самой крыши относительно горизонта. Плоская крыша — около 0°, наклонные крыши часто имеют 20–35°. Если точный угол неизвестен, укажите приблизительное значение.',
      arrayTiltLabel: 'Наклон панелей (необязательно)',
      arrayTiltHelp:
        'Только для наклонных рядов на опорах. Это угол самих солнечных панелей, а не крыши. Если оставить поле пустым, YOURENERGY автоматически выберет ближайший поддерживаемый каталогом угол к расчётному оптимуму PVGIS.',
      arrayAzimuthLabel: 'Направление панелей (необязательно)',
      arrayAzimuthHelp:
        'Только для наклонных рядов на опорах. Это направление самих панелей по компасу. Если оставить поле пустым, YOURENERGY использует рекомендуемое PVGIS направление.',
      resultArrayTilt: 'Наклон панелей',
      resultArrayAzimuth: 'Направление панелей',
      roofCapacityAssumption:
        'Предварительный GCR однонаправленных наклонных рядов на опорах — {ratio}%. Локальные препятствия, проходы и отступы не обследованы.',
      mountingHardwareEngineeringCopy:
        'Каталожный угол не изменяет введённые наклон и ориентацию крыши. Конструкцию и ветровую нагрузку подтверждает инженер.',
      parametersRequired: 'Для расчёта укажите ориентацию и наклон крыши.',
      angleGuideTitle: 'Проверьте ориентацию и наклон крыши',
      angleGuideCopy: 'Стрелка показывает указанную вами ориентацию крыши.',
      angleGuideOrientation: 'Ориентация крыши',
      angleGuideTilt: 'Наклон крыши',
      benchmarkOrientation: 'Ориентир направления для рядов на опорах',
      benchmarkTilt: 'Ориентир наклона для рядов на опорах',
      orientationRequired: 'Выберите ориентацию крыши.',
      refineArea: 'Измеренная площадь участка крыши',
      engineeringParameters: 'Инженерные параметры'
    },
    en: {
      copy: 'Outline the usable roof section and enter its orientation and tilt for a preliminary estimate.',
      areaMethodTitle: 'How do you want to enter the area?',
      areaMethodHelp:
        'The map outline shows the roof from above. On a pitched roof, the actual surface area can be larger. If you know the measured area of this roof section, use it.',
      mapProjected: 'Map outline — area from above',
      measuredPlane: 'Measured roof section area',
      planeAreaHelp:
        'Enter the actual measured area of this roof section in m². The value remains preliminary until an engineer survey.',
      planeAreaSummary: 'Roof area used in calculation',
      orientationLabel: 'Roof orientation',
      orientationHelp: 'Choose the direction this roof section faces.',
      tiltLabel: 'Roof tilt',
      tiltHelp:
        'The angle of the roof itself relative to horizontal. A flat roof is about 0°, while pitched roofs are often around 20–35°. If you do not know the exact angle, enter an approximate value.',
      arrayTiltLabel: 'Panel tilt (optional)',
      arrayTiltHelp:
        'Only for tilted rows on supports. This is the tilt of the solar panels, not the roof. If left blank, YOURENERGY automatically selects the closest catalog-supported angle to the PVGIS calculated optimum.',
      arrayAzimuthLabel: 'Panel direction (optional)',
      arrayAzimuthHelp:
        'Only for tilted rows on supports. This is the compass direction of the panels themselves. If left blank, YOURENERGY uses the PVGIS recommended direction.',
      resultArrayTilt: 'Panel tilt',
      resultArrayAzimuth: 'Panel direction',
      roofCapacityAssumption:
        'The preliminary GCR for single-direction tilted rows on supports is {ratio}%. Local obstacles, access paths and setbacks have not been surveyed.',
      mountingHardwareEngineeringCopy:
        'The catalog angle does not change the entered roof tilt or orientation. Structure and wind-load design are confirmed during engineering.',
      parametersRequired: 'Enter the roof orientation and tilt for the calculation.',
      angleGuideTitle: 'Check roof orientation and tilt',
      angleGuideCopy: 'The arrow shows the roof orientation you entered.',
      angleGuideOrientation: 'Roof orientation',
      angleGuideTilt: 'Roof tilt',
      benchmarkOrientation: 'Reference direction for tilted rows on supports',
      benchmarkTilt: 'Reference tilt for tilted rows on supports',
      orientationRequired: 'Select the roof orientation.',
      refineArea: 'Measured roof section area',
      engineeringParameters: 'Engineering parameters'
    }
  };
  const content = { hy, ru, en };

  for (const [locale, copy] of Object.entries(expected)) {
    const roof = content[locale].product.roof;
    assert.equal(roof.copy, copy.copy);
    assert.equal(roof.areaMethodTitle, copy.areaMethodTitle);
    assert.equal(roof.areaMethodHelp, copy.areaMethodHelp);
    assert.equal(roof.areaMethods.mapProjected, copy.mapProjected);
    assert.equal(roof.areaMethods.measuredPlane, copy.measuredPlane);
    assert.equal(roof.planeAreaLabel, copy.measuredPlane);
    assert.equal(roof.planeAreaHelp, copy.planeAreaHelp);
    assert.equal(roof.planeAreaSummary, copy.planeAreaSummary);
    assert.equal(roof.orientationLabel, copy.orientationLabel);
    assert.equal(roof.orientationHelp, copy.orientationHelp);
    assert.equal(roof.tiltLabel, copy.tiltLabel);
    assert.equal(roof.tiltHelp, copy.tiltHelp);
    assert.equal(roof.arrayTiltLabel, copy.arrayTiltLabel);
    assert.equal(roof.arrayTiltHelp, copy.arrayTiltHelp);
    assert.equal(roof.arrayAzimuthLabel, copy.arrayAzimuthLabel);
    assert.equal(roof.arrayAzimuthHelp, copy.arrayAzimuthHelp);
    assert.equal(calculatorWizard[locale].arrayTilt, copy.resultArrayTilt);
    assert.equal(calculatorWizard[locale].arrayAzimuth, copy.resultArrayAzimuth);
    assert.equal(calculatorWizard[locale].roofCapacityAssumption, copy.roofCapacityAssumption);
    assert.equal(
      calculatorWizard[locale].mountingHardwareEngineeringCopy,
      copy.mountingHardwareEngineeringCopy
    );
    assert.equal(roof.parametersRequired, copy.parametersRequired);
    assert.equal(roof.angleGuideTitle, copy.angleGuideTitle);
    assert.equal(roof.angleGuideCopy, copy.angleGuideCopy);
    assert.equal(roof.angleGuideOrientation, copy.angleGuideOrientation);
    assert.equal(roof.angleGuideTilt, copy.angleGuideTilt);
    assert.equal(roof.benchmarkOrientation, copy.benchmarkOrientation);
    assert.equal(roof.benchmarkTilt, copy.benchmarkTilt);
    assert.ok(roof.tiltInfoLabel);
    assert.ok(roof.arrayTiltInfoLabel);
    assert.ok(roof.arrayAzimuthInfoLabel);
    assert.equal(calculatorWizard[locale].engineeringParameters, copy.engineeringParameters);
    assert.equal(calculatorWizard[locale].ui.roof.orientationRequired, copy.orientationRequired);
    assert.equal(calculatorModes[locale].refine.area, copy.refineArea);
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
