export const PROCESS_INSPECTION_COPY = Object.freeze({
  en: Object.freeze({
    fallbackNote: '',
    calculatorNote: 'From calculator',
    verifiedNote: 'Verified on site',
    fallbacks: Object.freeze({
      'roof-area': '48 m²',
      orientation: 'South',
      tilt: '30°',
      shading: 'Minimal',
      'electrical-panel': 'Ready'
    }),
    directions: Object.freeze([
      'North',
      'North-east',
      'East',
      'South-east',
      'South',
      'South-west',
      'West',
      'North-west'
    ]),
    shading: Object.freeze({
      minimal: 'Minimal',
      moderate: 'Moderate',
      high: 'High'
    }),
    electrical: Object.freeze({
      ready: 'Ready',
      upgradeRequired: 'Upgrade required'
    })
  }),
  ru: Object.freeze({
    fallbackNote: '',
    calculatorNote: 'Из расчёта',
    verifiedNote: 'Проверено на объекте',
    fallbacks: Object.freeze({
      'roof-area': '48 м²',
      orientation: 'Юг',
      tilt: '30°',
      shading: 'Минимальное',
      'electrical-panel': 'Готов'
    }),
    directions: Object.freeze([
      'Север',
      'Северо-восток',
      'Восток',
      'Юго-восток',
      'Юг',
      'Юго-запад',
      'Запад',
      'Северо-запад'
    ]),
    shading: Object.freeze({
      minimal: 'Минимальное',
      moderate: 'Среднее',
      high: 'Высокое'
    }),
    electrical: Object.freeze({
      ready: 'Готов',
      upgradeRequired: 'Нужна доработка'
    })
  }),
  hy: Object.freeze({
    fallbackNote: '',
    calculatorNote: 'Հաշվիչից',
    verifiedNote: 'Ստուգված է տեղում',
    fallbacks: Object.freeze({
      'roof-area': '48 մ²',
      orientation: 'Հարավ',
      tilt: '30°',
      shading: 'Նվազագույն',
      'electrical-panel': 'Պատրաստ է'
    }),
    directions: Object.freeze([
      'Հյուսիս',
      'Հյուսիս-արևելք',
      'Արևելք',
      'Հարավ-արևելք',
      'Հարավ',
      'Հարավ-արևմուտք',
      'Արևմուտք',
      'Հյուսիս-արևմուտք'
    ]),
    shading: Object.freeze({
      minimal: 'Նվազագույն',
      moderate: 'Միջին',
      high: 'Բարձր'
    }),
    electrical: Object.freeze({
      ready: 'Պատրաստ է',
      upgradeRequired: 'Պետք է վերազինել'
    })
  })
});
