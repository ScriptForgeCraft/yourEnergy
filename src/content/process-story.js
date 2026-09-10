export const processStoryCopy = {
  en: {
    title: 'Your solar journey',
    progressLabel: 'Your solar project journey',
    stepLabel: 'Step {current} of {total}',
    previousStepLabel: 'Previous step',
    nextStepLabel: 'Next step',
    scrollLabel: 'Scroll to continue',
    availableAfterAnalysis: 'Available after your analysis',
    addInCalculator: 'Add this in the calculator',
    verifiedOnSite: 'Verified during the site visit',
    confirmedInDesign: 'Confirmed in the final design',
    includedInProposal: 'Included in the final proposal',
    preliminaryEstimate: 'Preliminary estimate, if available',
    form: {
      region: 'Region',
      chooseRegion: 'Choose your region',
      consumption: 'Electricity use',
      bill: 'Monthly bill',
      usage: 'Monthly kWh',
      amountBill: 'Average monthly bill',
      amountUsage: 'Average monthly usage',
      billHelp: 'You’ll confirm your electricity tariff in the calculator.',
      usageHelp: 'Use the monthly consumption shown on your bill.',
      continue: 'Continue',
      submit: 'Start my analysis',
      full: 'Open full calculator'
    },
    data: {
      source: 'Source',
      preliminary: 'Preliminary',
      upTo: 'up to',
      passportReady: 'Created for this session',
      country: 'Armenia',
      billUnit: 'AMD/month',
      usageUnit: 'kWh/month'
    },
    steps: [
      {
        number: '01',
        nav: 'Your Solar Analysis',
        visual: 'analysis',
        visualLabel: 'Solar analysis visual placeholder',
        headline: 'We start with the numbers.',
        copy: 'Your consumption, location and available solar data become a clear starting point for your system.',
        cards: [
          {
            icon: 'map-pin',
            label: 'Location',
            value: 'Add this in the calculator',
            data: 'location'
          },
          {
            icon: 'zap',
            label: 'Consumption',
            value: 'Add this in the calculator',
            data: 'consumption'
          },
          {
            icon: 'sun',
            label: 'Solar resource',
            value: 'Available after your analysis',
            data: 'solar-resource'
          },
          {
            icon: 'calculator',
            label: 'Recommended system',
            value: 'Available after your analysis',
            data: 'system-capacity'
          },
          {
            icon: 'cycle',
            label: 'Expected generation',
            value: 'Available after your analysis',
            data: 'annual-generation'
          }
        ],
        cta: 'Start my analysis'
      },
      {
        number: '02',
        nav: 'Engineer Site Visit',
        visual: 'inspection',
        visualLabel: 'On-site engineering inspection placeholder',
        headline: 'Then we verify the real home.',
        copy: 'An engineer checks the roof, usable area, orientation, shading and electrical conditions.',
        cards: [
          {
            icon: 'satellite',
            label: 'Roof area',
            value: 'Verified during the site visit',
            data: 'roof-area'
          },
          {
            icon: 'sun',
            label: 'Orientation',
            value: 'Verified during the site visit',
            data: 'orientation'
          },
          {
            icon: 'arrow-right',
            label: 'Tilt',
            value: 'Verified during the site visit',
            data: 'tilt'
          },
          {
            icon: 'sun',
            label: 'Shading',
            value: 'Verified during the site visit',
            data: 'shading'
          },
          {
            icon: 'zap',
            label: 'Electrical panel',
            value: 'Verified during the site visit',
            data: 'electrical-panel'
          }
        ]
      },
      {
        number: '03',
        nav: 'Final System Design',
        visual: 'design',
        visualLabel: 'Final solar system design placeholder',
        headline: 'Your system takes its final shape.',
        copy: 'We turn verified measurements into the panel layout, inverter configuration and final engineering design.',
        cards: [
          {
            icon: 'satellite',
            label: 'Panel layout',
            value: 'Confirmed in the final design',
            data: 'panel-layout'
          },
          {
            icon: 'zap',
            label: 'System capacity',
            value: 'Available after your analysis',
            data: 'system-capacity'
          },
          {
            icon: 'sun',
            label: 'Panel count',
            value: 'Available after your analysis',
            data: 'panel-count'
          },
          {
            icon: 'shield-check',
            label: 'Inverter',
            value: 'Confirmed in the final design',
            data: 'inverter'
          },
          {
            icon: 'cycle',
            label: 'Expected generation',
            value: 'Available after your analysis',
            data: 'annual-generation'
          }
        ]
      },
      {
        number: '04',
        nav: 'Clear Proposal & Agreement',
        visual: 'proposal',
        visualLabel: 'Proposal and agreement placeholder',
        headline: 'Everything is clear before installation.',
        copy: 'You receive the final equipment list, price, scope, warranties and project terms before work begins.',
        cards: [
          {
            icon: 'sun',
            label: 'Equipment',
            value: 'Included in the final proposal',
            data: 'equipment'
          },
          {
            icon: 'zap',
            label: 'System size',
            value: 'Confirmed in the final design',
            data: 'system-capacity'
          },
          {
            icon: 'file',
            label: 'Project scope',
            value: 'Included in the final proposal',
            data: 'project-scope'
          },
          {
            icon: 'calculator',
            label: 'Price',
            value: 'Preliminary estimate, if available',
            data: 'commercial-estimate'
          },
          {
            icon: 'shield-check',
            label: 'Warranty',
            value: 'Included in the final proposal',
            data: 'warranty'
          },
          { icon: 'file', label: 'Terms', value: 'Included in the final proposal', data: 'terms' }
        ]
      },
      {
        number: '05',
        nav: 'Installation & Commissioning',
        visual: 'installation',
        visualLabel: 'Installation and commissioning placeholder',
        headline: 'We build it.\nTest it.\nTurn it on.',
        copy: 'The system is installed according to the approved design, checked and commissioned for operation.',
        timeline: [
          { number: '01', label: 'Site preparation' },
          { number: '02', label: 'Mounting' },
          { number: '03', label: 'Panels' },
          { number: '04', label: 'Inverter & electrical' },
          { number: '05', label: 'Testing' },
          { number: '06', label: 'System online' }
        ]
      },
      {
        number: '06',
        nav: 'Solar Passport & Support',
        visual: 'support',
        visualLabel: 'Solar Passport and support placeholder',
        headline: 'Installation is only the beginning.',
        copy: 'Your system information, documents, warranties and support stay together after launch.',
        cards: [
          {
            icon: 'file',
            label: 'Solar Passport',
            value: 'Your system record',
            data: 'solar-passport'
          },
          {
            icon: 'shield-check',
            label: 'System information',
            value: 'Kept with the project record',
            data: 'system-information'
          },
          {
            icon: 'file',
            label: 'Documents',
            value: 'Kept with the project record',
            data: 'documents'
          },
          {
            icon: 'shield',
            label: 'Warranties',
            value: 'Kept with the project record',
            data: 'warranties'
          },
          {
            icon: 'cycle',
            label: 'Production context',
            value: 'Based on available analysis data',
            data: 'production-context'
          },
          {
            icon: 'support',
            label: 'Support',
            value: 'Contact and service information',
            data: 'support'
          }
        ],
        cta: 'Start my solar analysis'
      }
    ]
  },
  ru: {
    title: 'Ваш путь к солнечной системе',
    progressLabel: 'Этапы проекта солнечной системы',
    stepLabel: 'Этап {current} из {total}',
    previousStepLabel: 'Предыдущий этап',
    nextStepLabel: 'Следующий этап',
    scrollLabel: 'Листайте дальше',
    availableAfterAnalysis: 'Доступно после вашего анализа',
    addInCalculator: 'Добавьте данные в калькуляторе',
    verifiedOnSite: 'Проверяется при осмотре объекта',
    confirmedInDesign: 'Подтверждается в финальном проекте',
    includedInProposal: 'Указывается в финальном предложении',
    preliminaryEstimate: 'Предварительная оценка, если она доступна',
    form: {
      region: 'Регион',
      chooseRegion: 'Выберите регион',
      consumption: 'Электроэнергия',
      bill: 'Счёт за месяц',
      usage: 'kWh за месяц',
      amountBill: 'Средний счёт за месяц',
      amountUsage: 'Среднее потребление за месяц',
      billHelp: 'Тариф на электричество вы подтвердите в калькуляторе.',
      usageHelp: 'Укажите месячное потребление из вашего счёта.',
      continue: 'Продолжить',
      submit: 'Начать мой анализ',
      full: 'Открыть полный калькулятор'
    },
    data: {
      source: 'Источник',
      preliminary: 'Предварительно',
      upTo: 'до',
      passportReady: 'Создан для этой сессии',
      country: 'Армения',
      billUnit: 'AMD/месяц',
      usageUnit: 'kWh/месяц'
    },
    steps: [
      {
        number: '01',
        nav: 'Анализ вашей системы',
        visual: 'analysis',
        visualLabel: 'Визуализация анализа солнечной системы',
        headline: 'Начинаем с цифр.',
        copy: 'Ваше потребление, местоположение и доступные данные о солнечном ресурсе становятся понятной отправной точкой для вашей системы.',
        cards: [
          {
            icon: 'map-pin',
            label: 'Местоположение',
            value: 'Добавьте данные в калькуляторе',
            data: 'location'
          },
          {
            icon: 'zap',
            label: 'Потребление',
            value: 'Добавьте данные в калькуляторе',
            data: 'consumption'
          },
          {
            icon: 'sun',
            label: 'Солнечный ресурс',
            value: 'Доступно после вашего анализа',
            data: 'solar-resource'
          },
          {
            icon: 'calculator',
            label: 'Рекомендованная система',
            value: 'Доступно после вашего анализа',
            data: 'system-capacity'
          },
          {
            icon: 'cycle',
            label: 'Ожидаемая генерация',
            value: 'Доступно после вашего анализа',
            data: 'annual-generation'
          }
        ],
        cta: 'Начать мой анализ'
      },
      {
        number: '02',
        nav: 'Выезд инженера',
        visual: 'inspection',
        visualLabel: 'Визуализация инженерного осмотра объекта',
        headline: 'Затем проверяем ваш дом на месте.',
        copy: 'Инженер проверяет крышу, полезную площадь, ориентацию, затенение и состояние электрики.',
        cards: [
          {
            icon: 'satellite',
            label: 'Площадь крыши',
            value: 'Проверяется при осмотре объекта',
            data: 'roof-area'
          },
          {
            icon: 'sun',
            label: 'Ориентация',
            value: 'Проверяется при осмотре объекта',
            data: 'orientation'
          },
          {
            icon: 'arrow-right',
            label: 'Угол наклона',
            value: 'Проверяется при осмотре объекта',
            data: 'tilt'
          },
          {
            icon: 'sun',
            label: 'Затенение',
            value: 'Проверяется при осмотре объекта',
            data: 'shading'
          },
          {
            icon: 'zap',
            label: 'Электрощит',
            value: 'Проверяется при осмотре объекта',
            data: 'electrical-panel'
          }
        ]
      },
      {
        number: '03',
        nav: 'Финальный проект системы',
        visual: 'design',
        visualLabel: 'Визуализация финального проекта солнечной системы',
        headline: 'Ваша система обретает окончательную форму.',
        copy: 'На основе проверенных замеров мы готовим схему размещения панелей, конфигурацию инвертора и финальный инженерный проект.',
        cards: [
          {
            icon: 'satellite',
            label: 'Схема панелей',
            value: 'Подтверждается в финальном проекте',
            data: 'panel-layout'
          },
          {
            icon: 'zap',
            label: 'Мощность системы',
            value: 'Доступно после вашего анализа',
            data: 'system-capacity'
          },
          {
            icon: 'sun',
            label: 'Количество панелей',
            value: 'Доступно после вашего анализа',
            data: 'panel-count'
          },
          {
            icon: 'shield-check',
            label: 'Инвертор',
            value: 'Подтверждается в финальном проекте',
            data: 'inverter'
          },
          {
            icon: 'cycle',
            label: 'Ожидаемая генерация',
            value: 'Доступно после вашего анализа',
            data: 'annual-generation'
          }
        ]
      },
      {
        number: '04',
        nav: 'Понятное предложение и договор',
        visual: 'proposal',
        visualLabel: 'Визуализация предложения и договора',
        headline: 'До начала монтажа всё ясно.',
        copy: 'До начала работ вы получаете финальный список оборудования, цену, объём работ, гарантии и условия проекта.',
        cards: [
          {
            icon: 'sun',
            label: 'Оборудование',
            value: 'Указывается в финальном предложении',
            data: 'equipment'
          },
          {
            icon: 'zap',
            label: 'Мощность системы',
            value: 'Подтверждается в финальном проекте',
            data: 'system-capacity'
          },
          {
            icon: 'file',
            label: 'Объём работ',
            value: 'Указывается в финальном предложении',
            data: 'project-scope'
          },
          {
            icon: 'calculator',
            label: 'Цена',
            value: 'Предварительная оценка, если она доступна',
            data: 'commercial-estimate'
          },
          {
            icon: 'shield-check',
            label: 'Гарантия',
            value: 'Указывается в финальном предложении',
            data: 'warranty'
          },
          {
            icon: 'file',
            label: 'Условия',
            value: 'Указываются в финальном предложении',
            data: 'terms'
          }
        ]
      },
      {
        number: '05',
        nav: 'Монтаж и ввод в эксплуатацию',
        visual: 'installation',
        visualLabel: 'Визуализация монтажа и ввода в эксплуатацию',
        headline: 'Монтируем.\nПроверяем.\nЗапускаем.',
        copy: 'Систему монтируют по утверждённому проекту, затем проверяют и вводят в эксплуатацию.',
        timeline: [
          { number: '01', label: 'Подготовка объекта' },
          { number: '02', label: 'Монтаж конструкций' },
          { number: '03', label: 'Панели' },
          { number: '04', label: 'Инвертор и электрика' },
          { number: '05', label: 'Проверка' },
          { number: '06', label: 'Система запущена' }
        ]
      },
      {
        number: '06',
        nav: 'Solar Passport и поддержка',
        visual: 'support',
        visualLabel: 'Визуализация Solar Passport и поддержки',
        headline: 'Установка — это только начало.',
        copy: 'После запуска сведения о системе, документы, гарантии и информация о поддержке остаются в одном месте.',
        cards: [
          {
            icon: 'file',
            label: 'Solar Passport',
            value: 'Паспорт вашей системы',
            data: 'solar-passport'
          },
          {
            icon: 'shield-check',
            label: 'Сведения о системе',
            value: 'Хранятся с материалами проекта',
            data: 'system-information'
          },
          {
            icon: 'file',
            label: 'Документы',
            value: 'Хранятся с материалами проекта',
            data: 'documents'
          },
          {
            icon: 'shield',
            label: 'Гарантии',
            value: 'Хранятся с материалами проекта',
            data: 'warranties'
          },
          {
            icon: 'cycle',
            label: 'Контекст генерации',
            value: 'На основе доступных данных анализа',
            data: 'production-context'
          },
          {
            icon: 'support',
            label: 'Поддержка',
            value: 'Контакты и сервисная информация',
            data: 'support'
          }
        ],
        cta: 'Начать анализ солнечной системы'
      }
    ]
  },
  hy: {
    title: 'Ձեր արևային համակարգի ճանապարհը',
    progressLabel: 'Արևային համակարգի նախագծի փուլերը',
    stepLabel: 'Քայլ {current} / {total}',
    previousStepLabel: 'Նախորդ քայլը',
    nextStepLabel: 'Հաջորդ քայլը',
    scrollLabel: 'Ոլորեք՝ շարունակելու համար',
    availableAfterAnalysis: 'Հասանելի կլինի ձեր վերլուծությունից հետո',
    addInCalculator: 'Ավելացրեք տվյալները հաշվիչում',
    verifiedOnSite: 'Ստուգվում է տեղազննման ընթացքում',
    confirmedInDesign: 'Հաստատվում է վերջնական նախագծում',
    includedInProposal: 'Նշվում է վերջնական առաջարկում',
    preliminaryEstimate: 'Նախնական գնահատական՝ առկայության դեպքում',
    form: {
      region: 'Մարզ',
      chooseRegion: 'Ընտրեք մարզը',
      consumption: 'Էլեկտրաէներգիա',
      bill: 'Ամսական հաշիվ',
      usage: 'Ամսական kWh',
      amountBill: 'Միջին ամսական հաշիվ',
      amountUsage: 'Միջին ամսական սպառում',
      billHelp: 'Էլեկտրաէներգիայի սակագինը կհաստատեք հաշվիչում։',
      usageHelp: 'Նշեք ձեր հաշվում նշված ամսական սպառումը։',
      continue: 'Շարունակել',
      submit: 'Սկսել իմ վերլուծությունը',
      full: 'Բացել ամբողջական հաշվիչը'
    },
    data: {
      source: 'Աղբյուր',
      preliminary: 'Նախնական',
      upTo: 'մինչև',
      passportReady: 'Ստեղծված է այս աշխատաշրջանի համար',
      country: 'Հայաստան',
      billUnit: 'AMD/ամիս',
      usageUnit: 'kWh/ամիս'
    },
    steps: [
      {
        number: '01',
        nav: 'Ձեր արևային վերլուծությունը',
        visual: 'analysis',
        visualLabel: 'Արևային համակարգի վերլուծության տեսապատկեր',
        headline: 'Սկսում ենք թվերից։',
        copy: 'Ձեր սպառումը, տեղադրությունը և արևային ռեսուրսի հասանելի տվյալները դառնում են ձեր համակարգի հստակ մեկնակետը։',
        cards: [
          {
            icon: 'map-pin',
            label: 'Տեղադրություն',
            value: 'Ավելացրեք տվյալները հաշվիչում',
            data: 'location'
          },
          {
            icon: 'zap',
            label: 'Սպառում',
            value: 'Ավելացրեք տվյալները հաշվիչում',
            data: 'consumption'
          },
          {
            icon: 'sun',
            label: 'Արևային ռեսուրս',
            value: 'Հասանելի կլինի ձեր վերլուծությունից հետո',
            data: 'solar-resource'
          },
          {
            icon: 'calculator',
            label: 'Առաջարկվող համակարգ',
            value: 'Հասանելի կլինի ձեր վերլուծությունից հետո',
            data: 'system-capacity'
          },
          {
            icon: 'cycle',
            label: 'Սպասվող արտադրություն',
            value: 'Հասանելի կլինի ձեր վերլուծությունից հետո',
            data: 'annual-generation'
          }
        ],
        cta: 'Սկսել իմ վերլուծությունը'
      },
      {
        number: '02',
        nav: 'Ինժեների այց և տեղազննում',
        visual: 'inspection',
        visualLabel: 'Օբյեկտի ինժեներական տեղազննման տեսապատկեր',
        headline: 'Այնուհետև տունը ստուգում ենք տեղում։',
        copy: 'Ինժեները ստուգում է տանիքը, օգտագործելի մակերեսը, կողմնորոշումը, ստվերավորումը և էլեկտրական պայմանները։',
        cards: [
          {
            icon: 'satellite',
            label: 'Տանիքի մակերես',
            value: 'Ստուգվում է տեղազննման ընթացքում',
            data: 'roof-area'
          },
          {
            icon: 'sun',
            label: 'Կողմնորոշում',
            value: 'Ստուգվում է տեղազննման ընթացքում',
            data: 'orientation'
          },
          {
            icon: 'arrow-right',
            label: 'Թեքություն',
            value: 'Ստուգվում է տեղազննման ընթացքում',
            data: 'tilt'
          },
          {
            icon: 'sun',
            label: 'Ստվերավորում',
            value: 'Ստուգվում է տեղազննման ընթացքում',
            data: 'shading'
          },
          {
            icon: 'zap',
            label: 'Էլեկտրական վահանակ',
            value: 'Ստուգվում է տեղազննման ընթացքում',
            data: 'electrical-panel'
          }
        ]
      },
      {
        number: '03',
        nav: 'Համակարգի վերջնական նախագիծ',
        visual: 'design',
        visualLabel: 'Արևային համակարգի վերջնական նախագծի տեսապատկեր',
        headline: 'Ձեր համակարգը ստանում է վերջնական տեսքը։',
        copy: 'Ստուգված չափումների հիման վրա կազմում ենք վահանակների դասավորությունը, ինվերտորի կազմաձևը և վերջնական ինժեներական նախագիծը։',
        cards: [
          {
            icon: 'satellite',
            label: 'Վահանակների դասավորություն',
            value: 'Հաստատվում է վերջնական նախագծում',
            data: 'panel-layout'
          },
          {
            icon: 'zap',
            label: 'Համակարգի հզորություն',
            value: 'Հասանելի կլինի ձեր վերլուծությունից հետո',
            data: 'system-capacity'
          },
          {
            icon: 'sun',
            label: 'Վահանակների քանակ',
            value: 'Հասանելի կլինի ձեր վերլուծությունից հետո',
            data: 'panel-count'
          },
          {
            icon: 'shield-check',
            label: 'Ինվերտոր',
            value: 'Հաստատվում է վերջնական նախագծում',
            data: 'inverter'
          },
          {
            icon: 'cycle',
            label: 'Սպասվող արտադրություն',
            value: 'Հասանելի կլինի ձեր վերլուծությունից հետո',
            data: 'annual-generation'
          }
        ]
      },
      {
        number: '04',
        nav: 'Հստակ առաջարկ և պայմանագիր',
        visual: 'proposal',
        visualLabel: 'Առաջարկի և պայմանագրի տեսապատկեր',
        headline: 'Մինչև տեղադրումն ամեն ինչ հստակ է։',
        copy: 'Աշխատանքները սկսելուց առաջ ստանում եք սարքավորումների վերջնական ցանկը, գինը, աշխատանքի ծավալը, երաշխիքները և նախագծի պայմանները։',
        cards: [
          {
            icon: 'sun',
            label: 'Սարքավորումներ',
            value: 'Նշվում է վերջնական առաջարկում',
            data: 'equipment'
          },
          {
            icon: 'zap',
            label: 'Համակարգի հզորություն',
            value: 'Հաստատվում է վերջնական նախագծում',
            data: 'system-capacity'
          },
          {
            icon: 'file',
            label: 'Աշխատանքի ծավալ',
            value: 'Նշվում է վերջնական առաջարկում',
            data: 'project-scope'
          },
          {
            icon: 'calculator',
            label: 'Գին',
            value: 'Նախնական գնահատական՝ առկայության դեպքում',
            data: 'commercial-estimate'
          },
          {
            icon: 'shield-check',
            label: 'Երաշխիք',
            value: 'Նշվում է վերջնական առաջարկում',
            data: 'warranty'
          },
          {
            icon: 'file',
            label: 'Պայմաններ',
            value: 'Նշվում են վերջնական առաջարկում',
            data: 'terms'
          }
        ]
      },
      {
        number: '05',
        nav: 'Տեղադրում և գործարկում',
        visual: 'installation',
        visualLabel: 'Տեղադրման և գործարկման տեսապատկեր',
        headline: 'Տեղադրում ենք։\nՓորձարկում ենք։\nԳործարկում ենք։',
        copy: 'Համակարգը տեղադրվում է հաստատված նախագծի համաձայն, ստուգվում և հանձնվում շահագործման։',
        timeline: [
          { number: '01', label: 'Օբյեկտի նախապատրաստում' },
          { number: '02', label: 'Կրող համակարգի մոնտաժ' },
          { number: '03', label: 'Վահանակներ' },
          { number: '04', label: 'Ինվերտոր և էլեկտրական աշխատանքներ' },
          { number: '05', label: 'Փորձարկում' },
          { number: '06', label: 'Համակարգը գործարկված է' }
        ]
      },
      {
        number: '06',
        nav: 'Solar Passport և աջակցություն',
        visual: 'support',
        visualLabel: 'Solar Passport-ի և աջակցության տեսապատկեր',
        headline: 'Տեղադրումը միայն սկիզբն է։',
        copy: 'Գործարկումից հետո ձեր համակարգի տվյալները, փաստաթղթերը, երաշխիքները և աջակցության տեղեկությունները մնում են մեկ տեղում։',
        cards: [
          {
            icon: 'file',
            label: 'Solar Passport',
            value: 'Ձեր համակարգի անձնագիրը',
            data: 'solar-passport'
          },
          {
            icon: 'shield-check',
            label: 'Համակարգի տեղեկություններ',
            value: 'Պահվում են նախագծի նյութերի հետ',
            data: 'system-information'
          },
          {
            icon: 'file',
            label: 'Փաստաթղթեր',
            value: 'Պահվում են նախագծի նյութերի հետ',
            data: 'documents'
          },
          {
            icon: 'shield',
            label: 'Երաշխիքներ',
            value: 'Պահվում են նախագծի նյութերի հետ',
            data: 'warranties'
          },
          {
            icon: 'cycle',
            label: 'Արտադրության համատեքստ',
            value: 'Վերլուծության հասանելի տվյալների հիման վրա',
            data: 'production-context'
          },
          {
            icon: 'support',
            label: 'Աջակցություն',
            value: 'Կապի և սպասարկման տեղեկություններ',
            data: 'support'
          }
        ],
        cta: 'Սկսել իմ արևային վերլուծությունը'
      }
    ]
  }
};
