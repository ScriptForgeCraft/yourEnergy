export const processStoryCopy = {
  en: {
    title: 'Your solar journey',
    progressLabel: 'Your solar project journey',
    previousStepLabel: 'Previous step',
    nextStepLabel: 'Next step',
    scrollLabel: 'Scroll to continue',
    availableAfterAnalysis: 'Calculated from your analysis',
    addInCalculator: 'Enter the data in the calculator',
    verifiedOnSite: 'Verified on site',
    confirmedInDesign: 'Defined in the final design',
    includedInProposal: 'Detailed in the final proposal',
    preliminaryEstimate: 'Preliminary estimate when data allows',
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
        number: '1',
        nav: 'Your Solar Analysis',
        visual: 'analysis',
        visualLabel: 'Solar system analysis visual',
        headline: 'We start with the numbers.',
        copy: 'Your consumption, location and available solar data become a clear starting point for your system.',
        cards: [
          {
            icon: 'map-pin',
            label: 'Location',
            value: 'Choose your region in the calculator',
            data: 'location'
          },
          {
            icon: 'zap',
            label: 'Consumption',
            value: 'Enter your bill or monthly usage',
            data: 'consumption'
          },
          {
            icon: 'sun',
            label: 'Solar resource',
            value: 'Calculated from the site location',
            data: 'solar-resource'
          },
          {
            icon: 'calculator',
            label: 'Recommended system',
            value: 'Based on consumption and solar resource',
            data: 'system-capacity'
          },
          {
            icon: 'cycle',
            label: 'Expected generation',
            value: 'Estimated from system size and location',
            data: 'annual-generation'
          }
        ],
        cta: 'Start my analysis'
      },
      {
        number: '2',
        nav: 'Engineer Site Visit',
        visual: 'inspection',
        visualLabel: 'On-site engineering inspection',
        headline: 'Then we verify the property on site.',
        copy: 'An engineer checks the roof, usable area, orientation, shading and electrical conditions.',
        cards: [
          {
            icon: 'roof-measure',
            label: 'Roof area',
            value: 'Measured on site',
            data: 'roof-area'
          },
          {
            icon: 'compass',
            label: 'Orientation',
            value: 'Confirmed from the actual roof position',
            data: 'orientation'
          },
          {
            icon: 'roof-tilt',
            label: 'Tilt',
            value: 'Measured on the roof',
            data: 'tilt'
          },
          {
            icon: 'sun-cloud',
            label: 'Shading',
            value: 'Potential shading is checked on site',
            data: 'shading'
          },
          {
            icon: 'electrical-panel',
            label: 'Electrical panel',
            value: 'Connection conditions are checked',
            data: 'electrical-panel'
          }
        ]
      },
      {
        number: '3',
        nav: 'Final System Design',
        visual: 'design',
        visualLabel: 'Final solar system design',
        headline: 'Your system takes its final shape.',
        copy: 'We turn verified measurements into the panel layout, inverter configuration and final engineering design.',
        cards: [
          {
            icon: 'satellite',
            label: 'Panel layout',
            value: 'Final roof placement',
            data: 'panel-layout'
          },
          {
            icon: 'zap',
            label: 'System capacity',
            value: 'Refined from analysis and site measurements',
            data: 'system-capacity'
          },
          {
            icon: 'sun',
            label: 'Panel count',
            value: 'Based on capacity and selected panel model',
            data: 'panel-count'
          },
          {
            icon: 'shield-check',
            label: 'Inverter',
            value: 'Power and type matched to the system',
            data: 'inverter'
          },
          {
            icon: 'cycle',
            label: 'Expected generation',
            value: 'Based on the final configuration',
            data: 'annual-generation'
          }
        ]
      },
      {
        number: '4',
        nav: 'Clear Proposal & Agreement',
        visual: 'proposal',
        visualLabel: 'Proposal and agreement',
        headline: 'Everything is clear before installation.',
        copy: 'You receive the final equipment list, price, scope, warranties and project terms before work begins.',
        cards: [
          {
            icon: 'sun',
            label: 'Equipment',
            value: 'Selected types and models',
            data: 'equipment'
          },
          {
            icon: 'zap',
            label: 'System size',
            value: 'Capacity approved in the final design',
            data: 'system-capacity'
          },
          {
            icon: 'file',
            label: 'Scope of work',
            value: 'Defined in the final contract',
            data: 'project-scope'
          },
          {
            icon: 'calculator',
            label: 'Price',
            value: 'Based on equipment and scope',
            data: 'commercial-estimate'
          },
          {
            icon: 'shield-check',
            label: 'Warranty',
            value: 'Equipment and workmanship warranties',
            data: 'warranty'
          },
          { icon: 'file', label: 'Terms', value: 'Schedule, payment and work terms', data: 'terms' }
        ]
      },
      {
        number: '5',
        nav: 'Installation & Commissioning',
        visual: 'installation',
        visualLabel: 'Installation and commissioning',
        headline: 'We build it.\nTest it.\nTurn it on.',
        copy: 'The system is installed according to the approved design, checked and commissioned for operation.',
        timeline: [
          { number: '1', label: 'Site preparation' },
          { number: '2', label: 'Mounting' },
          { number: '3', label: 'Panel installation' },
          { number: '4', label: 'Inverter installation & connection' },
          { number: '5', label: 'Testing' },
          { number: '6', label: 'System commissioning' }
        ]
      },
      {
        number: '6',
        nav: 'Monitoring & Service',
        visual: 'support',
        visualLabel: 'Monitoring and service',
        headline: 'Your system is up and running.\nStay connected every day.',
        copy: 'After commissioning, we help set up monitoring so you can follow system performance and energy production.',
        cards: [
          {
            icon: 'phone',
            label: 'Monitoring',
            value: 'Check your system from your phone.',
            data: 'monitoring-app'
          },
          {
            icon: 'chart-bars',
            label: 'Energy production',
            value: 'See how much energy you generate.',
            data: 'generation'
          },
          {
            icon: 'shield-check',
            label: 'System status',
            value: 'Keep track of system performance.',
            data: 'system-status'
          },
          {
            icon: 'bell',
            label: 'Notifications',
            value: 'Receive important alerts.',
            data: 'notifications'
          },
          {
            icon: 'satellite',
            label: 'Remote checks',
            value: 'Get remote assistance when needed.',
            data: 'remote-diagnostics'
          },
          {
            icon: 'wrench',
            label: 'Technical support',
            value: 'YOURENERGY stays with you.',
            data: 'service'
          }
        ]
      }
    ]
  },
  ru: {
    title: 'Ваш путь к солнечной системе',
    progressLabel: 'Этапы проекта солнечной системы',
    previousStepLabel: 'Предыдущий этап',
    nextStepLabel: 'Следующий этап',
    scrollLabel: 'Листайте дальше',
    availableAfterAnalysis: 'Рассчитывается по результатам анализа',
    addInCalculator: 'Введите данные в калькуляторе',
    verifiedOnSite: 'Уточняется на объекте',
    confirmedInDesign: 'Определяется в финальном проекте',
    includedInProposal: 'Детализируется в итоговом предложении',
    preliminaryEstimate: 'Предварительная оценка при наличии данных',
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
        number: '1',
        nav: 'Анализ вашей системы',
        visual: 'analysis',
        visualLabel: 'Визуализация анализа солнечной системы',
        headline: 'Начинаем с цифр.',
        copy: 'Ваше потребление, местоположение и доступные данные о солнечном ресурсе становятся понятной отправной точкой для вашей системы.',
        cards: [
          {
            icon: 'map-pin',
            label: 'Местоположение',
            value: 'Выберите регион в калькуляторе',
            data: 'location'
          },
          {
            icon: 'zap',
            label: 'Потребление',
            value: 'Укажите счёт или месячное потребление',
            data: 'consumption'
          },
          {
            icon: 'sun',
            label: 'Солнечный ресурс',
            value: 'Рассчитывается по местоположению',
            data: 'solar-resource'
          },
          {
            icon: 'calculator',
            label: 'Рекомендованная система',
            value: 'По потреблению и солнечному ресурсу',
            data: 'system-capacity'
          },
          {
            icon: 'cycle',
            label: 'Ожидаемая выработка',
            value: 'По мощности системы и местоположению',
            data: 'annual-generation'
          }
        ],
        cta: 'Начать мой анализ'
      },
      {
        number: '2',
        nav: 'Выезд инженера',
        visual: 'inspection',
        visualLabel: 'Визуализация инженерного осмотра объекта',
        headline: 'Затем проверяем объект на месте.',
        copy: 'Инженер проверяет крышу, полезную площадь, ориентацию, затенение и состояние электрики.',
        cards: [
          {
            icon: 'roof-measure',
            label: 'Площадь крыши',
            value: 'Измеряется на объекте',
            data: 'roof-area'
          },
          {
            icon: 'compass',
            label: 'Ориентация',
            value: 'Уточняется по фактическому положению крыши',
            data: 'orientation'
          },
          {
            icon: 'roof-tilt',
            label: 'Угол наклона',
            value: 'Измеряется на крыше',
            data: 'tilt'
          },
          {
            icon: 'sun-cloud',
            label: 'Затенение',
            value: 'Проверяются возможные зоны затенения',
            data: 'shading'
          },
          {
            icon: 'electrical-panel',
            label: 'Электрощит',
            value: 'Проверяются условия подключения',
            data: 'electrical-panel'
          }
        ]
      },
      {
        number: '3',
        nav: 'Финальный проект системы',
        visual: 'design',
        visualLabel: 'Визуализация финального проекта солнечной системы',
        headline: 'Ваша система обретает окончательную форму.',
        copy: 'На основе проверенных замеров мы готовим схему размещения панелей, конфигурацию инвертора и финальный инженерный проект.',
        cards: [
          {
            icon: 'satellite',
            label: 'Схема панелей',
            value: 'Финальная раскладка на крыше',
            data: 'panel-layout'
          },
          {
            icon: 'zap',
            label: 'Мощность системы',
            value: 'Уточняется по анализу и замерам',
            data: 'system-capacity'
          },
          {
            icon: 'sun',
            label: 'Количество панелей',
            value: 'По мощности и выбранной модели',
            data: 'panel-count'
          },
          {
            icon: 'shield-check',
            label: 'Инвертор',
            value: 'Мощность и тип под выбранную систему',
            data: 'inverter'
          },
          {
            icon: 'cycle',
            label: 'Ожидаемая выработка',
            value: 'По финальной конфигурации системы',
            data: 'annual-generation'
          }
        ]
      },
      {
        number: '4',
        nav: 'Понятное предложение и договор',
        visual: 'proposal',
        visualLabel: 'Визуализация предложения и договора',
        headline: 'До начала монтажа всё ясно.',
        copy: 'До начала работ вы получаете финальный список оборудования, цену, объём работ, гарантии и условия проекта.',
        cards: [
          {
            icon: 'sun',
            label: 'Оборудование',
            value: 'Выбранные типы и модели',
            data: 'equipment'
          },
          {
            icon: 'zap',
            label: 'Мощность системы',
            value: 'Утверждённая мощность по финальному проекту',
            data: 'system-capacity'
          },
          {
            icon: 'file',
            label: 'Объём работ',
            value: 'Фиксируется в финальном договоре',
            data: 'project-scope'
          },
          {
            icon: 'calculator',
            label: 'Цена',
            value: 'По оборудованию и объёму работ',
            data: 'commercial-estimate'
          },
          {
            icon: 'shield-check',
            label: 'Гарантия',
            value: 'Гарантии на оборудование и работы',
            data: 'warranty'
          },
          {
            icon: 'file',
            label: 'Условия',
            value: 'Сроки, оплата и условия выполнения работ',
            data: 'terms'
          }
        ]
      },
      {
        number: '5',
        nav: 'Монтаж и ввод в эксплуатацию',
        visual: 'installation',
        visualLabel: 'Визуализация монтажа и ввода в эксплуатацию',
        headline: 'Монтируем.\nПроверяем.\nЗапускаем.',
        copy: 'Систему монтируют по утверждённому проекту, затем проверяют и вводят в эксплуатацию.',
        timeline: [
          { number: '1', label: 'Подготовка объекта' },
          { number: '2', label: 'Монтаж конструкций' },
          { number: '3', label: 'Монтаж панелей' },
          { number: '4', label: 'Монтаж и подключение инвертора' },
          { number: '5', label: 'Проверка' },
          { number: '6', label: 'Запуск системы' }
        ]
      },
      {
        number: '6',
        nav: 'Мониторинг и поддержка',
        visual: 'support',
        visualLabel: 'Визуализация мониторинга и обслуживания',
        headline: 'Ваша система уже работает.\nСледите за ней каждый день.',
        copy: 'После запуска мы поможем настроить мониторинг, чтобы вы могли следить за работой системы и выработкой энергии.',
        cards: [
          {
            icon: 'phone',
            label: 'Мониторинг',
            value: 'Следите за системой с телефона.',
            data: 'monitoring-app'
          },
          {
            icon: 'chart-bars',
            label: 'Выработка',
            value: 'Смотрите, сколько энергии произведено.',
            data: 'generation'
          },
          {
            icon: 'shield-check',
            label: 'Состояние системы',
            value: 'Контролируйте работу оборудования.',
            data: 'system-status'
          },
          {
            icon: 'bell',
            label: 'Уведомления',
            value: 'Получайте важные оповещения.',
            data: 'notifications'
          },
          {
            icon: 'satellite',
            label: 'Удалённая проверка',
            value: 'При необходимости поможем удалённо.',
            data: 'remote-diagnostics'
          },
          {
            icon: 'wrench',
            label: 'Техническая поддержка',
            value: 'YOURENERGY остаётся рядом.',
            data: 'service'
          }
        ]
      }
    ]
  },
  hy: {
    title: 'Ձեր արևային համակարգի ճանապարհը',
    progressLabel: 'Արևային համակարգի նախագծի փուլերը',
    previousStepLabel: 'Նախորդ քայլը',
    nextStepLabel: 'Հաջորդ քայլը',
    scrollLabel: 'Թերթի՛ր ավելին տեսնելու համար',
    availableAfterAnalysis: 'Հաշվարկվում է վերլուծության արդյունքներով',
    addInCalculator: 'Մուտքագրեք տվյալները հաշվիչում',
    verifiedOnSite: 'Ճշտվում է տեղում',
    confirmedInDesign: 'Սահմանվում է վերջնական նախագծում',
    includedInProposal: 'Մանրամասնվում է վերջնական առաջարկում',
    preliminaryEstimate: 'Նախնական գնահատական՝ բավարար տվյալների դեպքում',
    form: {
      region: 'Մարզ',
      chooseRegion: 'Ընտրեք մարզը',
      consumption: 'Էլեկտրաէներգիա',
      bill: 'Ամսական հաշիվ',
      usage: 'Ամսական kWh',
      amountBill: 'Միջին ամսական հաշիվ',
      amountUsage: 'Միջին ամսական սպառում',
      billHelp: 'Էլեկտրաէներգիայի սակագինը կհաստատեք հաշվիչում։',
      usageHelp: 'Նշեք Ձեր հաշվում նշված ամսական սպառումը։',
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
        number: '1',
        nav: 'Ձեր արևային վերլուծությունը',
        visual: 'analysis',
        visualLabel: 'Արևային համակարգի վերլուծության տեսապատկեր',
        headline: 'Սկսում ենք թվերից։',
        copy: 'Ձեր սպառումը, տեղադրությունը և արևային ռեսուրսի հասանելի տվյալները դառնում են Ձեր համակարգի հստակ մեկնակետը։',
        cards: [
          {
            icon: 'map-pin',
            label: 'Տեղադրություն',
            value: 'Ընտրեք մարզը հաշվիչում',
            data: 'location'
          },
          {
            icon: 'zap',
            label: 'Սպառում',
            value: 'Նշեք հաշիվը կամ ամսական սպառումը',
            data: 'consumption'
          },
          {
            icon: 'sun',
            label: 'Արևային ռեսուրս',
            value: 'Հաշվարկվում է ըստ տեղադրության',
            data: 'solar-resource'
          },
          {
            icon: 'calculator',
            label: 'Առաջարկվող համակարգ',
            value: 'Ըստ Ձեր սպառման և արևային ռեսուրսի',
            data: 'system-capacity'
          },
          {
            icon: 'cycle',
            label: 'Սպասվող արտադրություն',
            value: 'Ըստ համակարգի հզորության և տեղադրության',
            data: 'annual-generation'
          }
        ],
        cta: 'Սկսել իմ վերլուծությունը'
      },
      {
        number: '2',
        nav: 'Ինժեների այց և տեղազննում',
        visual: 'inspection',
        visualLabel: 'Օբյեկտի ինժեներական տեղազննման տեսապատկեր',
        headline: 'Այնուհետև օբյեկտը ստուգում ենք տեղում։',
        copy: 'Ինժեները ստուգում է տանիքը, օգտագործելի մակերեսը, կողմնորոշումը, ստվերավորումը և էլեկտրական պայմանները։',
        cards: [
          {
            icon: 'roof-measure',
            label: 'Տանիքի մակերես',
            value: 'Չափվում է օբյեկտում',
            data: 'roof-area'
          },
          {
            icon: 'compass',
            label: 'Կողմնորոշում',
            value: 'Որոշվում է տանիքի իրական դիրքով',
            data: 'orientation'
          },
          {
            icon: 'roof-tilt',
            label: 'Թեքություն',
            value: 'Չափվում է տանիքի վրա',
            data: 'tilt'
          },
          {
            icon: 'sun-cloud',
            label: 'Ստվերավորում',
            value: 'Ստուգվում են հնարավոր ստվերները',
            data: 'shading'
          },
          {
            icon: 'electrical-panel',
            label: 'Էլեկտրական վահանակ',
            value: 'Ստուգվում են միացման պայմանները',
            data: 'electrical-panel'
          }
        ]
      },
      {
        number: '3',
        nav: 'Համակարգի վերջնական նախագիծ',
        visual: 'design',
        visualLabel: 'Արևային համակարգի վերջնական նախագծի տեսապատկեր',
        headline: 'Ձեր համակարգը ստանում է վերջնական տեսքը։',
        copy: 'Ստուգված չափումների հիման վրա կազմում ենք վահանակների դասավորությունը, ինվերտորի կազմաձևը և վերջնական ինժեներական նախագիծը։',
        cards: [
          {
            icon: 'satellite',
            label: 'Վահանակների դասավորություն',
            value: 'Վերջնական տեղաբաշխումը՝ տանիքի վրա',
            data: 'panel-layout'
          },
          {
            icon: 'zap',
            label: 'Համակարգի հզորություն',
            value: 'Ճշտվում է վերլուծությամբ և տեղազննմամբ',
            data: 'system-capacity'
          },
          {
            icon: 'sun',
            label: 'Վահանակների քանակ',
            value: 'Ըստ հզորության և ընտրված մոդելի',
            data: 'panel-count'
          },
          {
            icon: 'shield-check',
            label: 'Ինվերտոր',
            value: 'Հզորությունն ու տեսակը՝ ըստ համակարգի',
            data: 'inverter'
          },
          {
            icon: 'cycle',
            label: 'Սպասվող արտադրություն',
            value: 'Վերջնական կազմաձևի հիման վրա',
            data: 'annual-generation'
          }
        ]
      },
      {
        number: '4',
        nav: 'Հստակ առաջարկ և պայմանագիր',
        visual: 'proposal',
        visualLabel: 'Առաջարկի և պայմանագրի տեսապատկեր',
        headline: 'Մինչև տեղադրումն ամեն ինչ հստակ է։',
        copy: 'Աշխատանքները սկսելուց առաջ ստանում եք սարքավորումների վերջնական ցանկը, գինը, աշխատանքի ծավալը, երաշխիքները և նախագծի պայմանները։',
        cards: [
          {
            icon: 'sun',
            label: 'Սարքավորումներ',
            value: 'Ընտրված տեսակներն ու մոդելները',
            data: 'equipment'
          },
          {
            icon: 'zap',
            label: 'Համակարգի հզորություն',
            value: 'Վերջնական նախագծով հաստատված հզորությունը',
            data: 'system-capacity'
          },
          {
            icon: 'file',
            label: 'Աշխատանքի ծավալ',
            value: 'Սահմանվում է վերջնական պայմանագրում',
            data: 'project-scope'
          },
          {
            icon: 'calculator',
            label: 'Գին',
            value: 'Ըստ սարքավորումների և աշխատանքի ծավալի',
            data: 'commercial-estimate'
          },
          {
            icon: 'shield-check',
            label: 'Երաշխիք',
            value: 'Սարքավորումների և աշխատանքների երաշխիքներ',
            data: 'warranty'
          },
          {
            icon: 'file',
            label: 'Պայմաններ',
            value: 'Ժամկետներ, վճարում և կատարման պայմաններ',
            data: 'terms'
          }
        ]
      },
      {
        number: '5',
        nav: 'Տեղադրում և գործարկում',
        visual: 'installation',
        visualLabel: 'Տեղադրման և գործարկման տեսապատկեր',
        headline: 'Տեղադրում ենք։\nՓորձարկում ենք։\nԳործարկում ենք։',
        copy: 'Համակարգը տեղադրվում է հաստատված նախագծի համաձայն, ստուգվում և հանձնվում շահագործման։',
        timeline: [
          { number: '1', label: 'Օբյեկտի նախապատրաստում' },
          { number: '2', label: 'Կրող համակարգի մոնտաժ' },
          { number: '3', label: 'Վահանակների տեղադրում' },
          { number: '4', label: 'Ինվերտորի մոնտաժ և միացում' },
          { number: '5', label: 'Փորձարկում' },
          { number: '6', label: 'Համակարգի գործարկում' }
        ]
      },
      {
        number: '6',
        nav: 'Մոնիթորինգ և աջակցություն',
        visual: 'support',
        visualLabel: 'Մոնիտորինգի և սպասարկման տեսապատկեր',
        headline: 'Ձեր համակարգն արդեն աշխատում է։\nՀետևեք դրան ամեն օր։',
        copy: 'Համակարգի գործարկումից հետո կօգնենք կարգավորել մոնիթորինգը, որպեսզի կարողանաք հետևել դրա աշխատանքին և արտադրությանը։',
        cards: [
          {
            icon: 'phone',
            label: 'Մոնիթորինգ',
            value: 'Հետևեք համակարգին հեռախոսից։',
            data: 'monitoring-app'
          },
          {
            icon: 'chart-bars',
            label: 'Արտադրություն',
            value: 'Տեսեք արտադրված էներգիան։',
            data: 'generation'
          },
          {
            icon: 'shield-check',
            label: 'Համակարգի վիճակ',
            value: 'Հետևեք համակարգի աշխատանքին։',
            data: 'system-status'
          },
          {
            icon: 'bell',
            label: 'Ծանուցումներ',
            value: 'Ստացեք կարևոր տեղեկացումներ։',
            data: 'notifications'
          },
          {
            icon: 'satellite',
            label: 'Հեռավար ստուգում',
            value: 'Անհրաժեշտության դեպքում կօգնենք հեռավար։',
            data: 'remote-diagnostics'
          },
          {
            icon: 'wrench',
            label: 'Տեխնիկական աջակցություն',
            value: 'YOURENERGY-ն մնում է Ձեր կողքին։',
            data: 'service'
          }
        ]
      }
    ]
  }
};
