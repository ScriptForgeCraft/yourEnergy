const regions = {
  hy: {
    yerevan: 'Երևան',
    aragatsotn: 'Արագածոտն',
    ararat: 'Արարատ',
    armavir: 'Արմավիր',
    gegharkunik: 'Գեղարքունիք',
    kotayk: 'Կոտայք',
    lori: 'Լոռի',
    shirak: 'Շիրակ',
    syunik: 'Սյունիք',
    tavush: 'Տավուշ',
    'vayots-dzor': 'Վայոց ձոր'
  },
  ru: {
    yerevan: 'Ереван',
    aragatsotn: 'Арагацотн',
    ararat: 'Арарат',
    armavir: 'Армавир',
    gegharkunik: 'Гегаркуник',
    kotayk: 'Котайк',
    lori: 'Лори',
    shirak: 'Ширак',
    syunik: 'Сюник',
    tavush: 'Тавуш',
    'vayots-dzor': 'Вайоц-Дзор'
  },
  en: {
    yerevan: 'Yerevan',
    aragatsotn: 'Aragatsotn',
    ararat: 'Ararat',
    armavir: 'Armavir',
    gegharkunik: 'Gegharkunik',
    kotayk: 'Kotayk',
    lori: 'Lori',
    shirak: 'Shirak',
    syunik: 'Syunik',
    tavush: 'Tavush',
    'vayots-dzor': 'Vayots Dzor'
  }
};

const common = {
  hy: {
    quickMeta: {
      title: 'Արևային նախնական հաշվիչ՝ տարածաշրջան և սպառում | YOURENERGY',
      description:
        'Ընտրեք տարածաշրջանն ու մուտքագրեք սպառումը՝ նախնական գնահատման համար, ապա ցանկության դեպքում ճշգրտեք այն տանիքով։',
      ogTitle: 'Արագ արևային հաշվիչ | YOURENERGY',
      ogDescription: 'Սկսեք երկու հասկանալի դաշտից։'
    },
    refineMeta: {
      title: 'Տանիքի պարզեցում | YOURENERGY',
      description: 'Հաստատեք կետն ու մատչելի տանիքի տարածքը՝ նախնական հաշվարկը ճշգրտելու համար։',
      ogTitle: 'Ճշգրտել տանիքի գնահատումը | YOURENERGY',
      ogDescription: 'Քարտեզի ուրվագիծ կամ չափված տարածք։'
    },
    proMeta: {
      title: 'Պրոֆեսիոնալ արևային հաշվիչ | YOURENERGY',
      description: 'PVGIS, տանիքի պարամետրեր և աղբյուրների թափանցիկ հաշվարկ։',
      ogTitle: 'Պրոֆեսիոնալ հաշվիչ | YOURENERGY',
      ogDescription: 'Մանրամասն նախնական վերլուծություն։'
    },
    quick: {
      eyebrow: 'Արագ նախնական գնահատում',
      title: 'Պարզեք՝ ինչ արևային համակարգ կարող է համապատասխանել ձեր տանը',
      heroTitle: 'Արևային հաշվիչ',
      heroCopy:
        'Ընտրեք ռեժիմը, նշեք տարածաշրջանն ու միջին սպառումը և ստացեք PVGIS-ի հիման վրա նախնական գնահատում։',
      locationTitle: 'Տարածաշրջան',
      locationCopy: 'Ընտրեք տարածաշրջանը՝ արևային ճշգրիտ տվյալների համար',
      consumptionTitle: 'Էլեկտրաէներգիայի սպառում',
      consumptionCopy: 'Մուտքագրեք միջին ամսական հաշիվը կամ սպառումը',
      region: 'Տարածաշրջան',
      mode: 'Ինչ գիտեք սպառման մասին',
      bill: 'Միջին ամսական հաշիվ',
      usage: 'Միջին ամսական սպառում',
      billLabel: 'Միջին ամսական հաշիվ',
      usageLabel: 'Միջին ամսական սպառում',
      tariffLabel: 'Ընտրեք էլեկտրաէներգիայի սակագինը',
      tariffHelpBill:
        'Հաշիվը kWh-ի փոխարկելու համար ընտրեք ձեր կիրառվող պաշտոնական սակագինը կամ մուտքագրեք այն ձեր հաշվից։',
      tariffHelpUsage:
        'Սակագինը ընտրովի է․ այն պետք է միայն խնայողությունն ու հետգնման ժամկետը ցուցադրելու համար։',
      tariffChoose: 'Ընտրեք սակագինը',
      tariffSuggested: 'Սպառման համար առաջարկվող սովորական միջակայք',
      tariffOfficial: 'Պաշտոնական սակագին',
      tariffCustom: 'Մուտքագրել սակագինը իմ հաշվից',
      customTariffLabel: 'Սակագին իմ հաշվից AMD/kWh',
      tariffDay: 'Ցերեկային',
      tariffNight: 'Գիշերային',
      tariffCategories: {
        'social-vulnerable': 'Սոցիալապես անապահով ընտանիք',
        'standard-up-to-200': 'Սովորական՝ մինչև 200 kWh/ամիս',
        'standard-201-to-400': 'Սովորական՝ 201–400 kWh/ամիս',
        'standard-over-400': 'Սովորական՝ 400 kWh-ից ավելի/ամիս'
      },
      submit: 'Ստանալ նախնական գնահատում',
      pro: 'Բացել պրոֆեսիոնալ հաշվիչը',
      proTitle: 'Ցանկանո՞ւմ եք ավելի մանրամասն վերլուծություն',
      proCopy: 'Բացեք պրոֆեսիոնալ ռեժիմը տանիքի քարտեզագրման և խորացված վերլուծության համար։',
      proAction: 'Անցնել պրոֆեսիոնալ ռեժիմ',
      waiting: 'Լրացրեք տարածաշրջանն ու սպառումը։',
      loading: 'PVGIS-ից ստանում ենք տարածաշրջանային արևային տվյալները…',
      unavailable:
        'PVGIS-ի տվյալն այս պահին հասանելի չէ։ Թվեր չենք փոխարինել օրինակով։ Փորձեք կրկին։',
      cacheNotConfigured:
        'Արևային հաշվարկը դեռ միացված չէ, քանի որ պաշտպանված ծառայության քեշը կարգավորված չէ։ Կապվեք ինժեների հետ։',
      providerNotConfigured:
        'Արևային հաշվարկի ծառայությունը դեռ կարգավորված չէ։ Կապվեք ինժեների հետ։',
      retry: 'Կրկնել PVGIS հարցումը',
      regional: 'Տարածաշրջանային նախնական արդյունք',
      regionalCopy:
        'PVGIS-ի տվյալը վերաբերում է ընտրված տարածաշրջանի ներկայացուցչական կետին, ոչ թե ձեր տան հասցեին կամ տանիքին։',
      resultsTitle: 'Ձեր նախնական արդյունքը',
      resultsCopy: 'Ընտրված տարածաշրջանի արևային տվյալների և ձեր սպառման հիման վրա',
      capacity: 'Առաջարկվող հզորություն',
      panels: 'Վահանակներ',
      generation: 'Տարեկան արտադրություն',
      monthlyProduction: 'Կանխատեսվող ամսական արտադրություն',
      co2: 'CO₂ կրճատում',
      trees: 'Ծառերի համարժեք',
      budget: 'Նախնական բյուջե',
      savings: 'Տարեկան խնայողություն',
      payback: 'Հետգնման ժամկետ',
      refine: 'Ճշգրտել իմ տանիքով',
      contact: 'Ստանալ առաջարկ',
      phone: 'Զանգել ինժեներին',
      lead: {
        eyebrow: 'Ձեր նախնական արդյունքը',
        title: 'Ստացեք առաջարկ',
        copy: 'Թողեք կոնտակտը, և ինժեները կստանա այս նախնական հաշվարկի ամփոփումը։',
        name: 'Անուն',
        phone: 'Հեռախոս',
        comment: 'Մեկնաբանություն',
        submit: 'Ուղարկել հարցումը',
        loading: 'Ուղարկում ենք հարցումը…',
        success: 'Հարցումն ընդունվել է։ Ինժեները կկապվի ձեզ հետ։',
        unavailable: 'Հարցումը հիմա չի ուղարկվում։ Զանգահարեք ինժեներին՝ ստանալու համար առաջարկ։',
        invalid: 'Մուտքագրեք անուն և ճիշտ հեռախոսահամար։',
        close: 'Փակել'
      },
      disclaimer:
        'Հաշվարկը նախնական է։ Վերջնական պարամետրերն ու արժեքը հաստատվում են օբյեկտի ինժեներական ստուգումից հետո։',
      noTariff:
        'Խնայողության և հետգնման համար ավելացրեք սակագինը կամ օգտագործեք ձեր հաշվի տվյալները։',
      priceUnavailable:
        'Նախնական գների միջակայքն այժմ հասանելի չէ։ Հարցրեք ինժեներական զննում՝ ընթացիկ արժեքը հաստատելու համար։',
      benefitsLabel: 'Արևային էներգիայի առավելությունները',
      benefits: [
        { icon: 'leaf', title: 'Ավելի ցածր հաշիվներ', copy: 'Օգտագործեք մաքուր արևային էներգիա' },
        {
          icon: 'faq-settings',
          title: 'CO₂ արտանետումների կրճատում',
          copy: 'Ավելի մաքուր միջավայր ապագա սերունդների համար'
        },
        {
          icon: 'shield-check',
          title: 'Էներգետիկ անկախություն',
          copy: 'Ավելի քիչ կախվածություն ցանցից'
        },
        {
          icon: 'support',
          title: 'Մասնագիտական աջակցություն',
          copy: 'Ձեզ հետ ենք ամբողջ ճանապարհին'
        }
      ],
      signature: 'Մաքուր էներգիա։ Ավելի պայծառ վաղվա համար։',
      noJs: 'JavaScript-ի բացակայության դեպքում զանգահարեք ինժեներին՝ նախնական խորհրդատվության համար։'
    },
    refine: {
      eyebrow: 'Տանիքի պարզեցում',
      title: 'Ճշգրտեք գնահատումը ձեր տան կետով և տանիքով',
      intro: 'Ընտրեք ձեր տունը, ապա կամ ուրվագծեք մատչելի տանիքը, կամ մուտքագրեք չափված մակերեսը։',
      openMap: 'Ընտրել տունը քարտեզի վրա',
      confirm: 'Հաստատել այս կետը',
      selected: 'Ընտրված կետ',
      coordinates: 'Գիտեմ կոորդինատները',
      latitude: 'Լայնություն',
      longitude: 'Երկայնություն',
      setCoordinates: 'Օգտագործել կոորդինատները',
      roof: 'Տանիքի մատչելի տարածք',
      outline: 'Ուրվագծել քարտեզի վրա',
      measured: 'Գիտեմ չափված մակերեսը',
      area: 'Չափված տանիքի մակերես',
      preliminary: 'Ուրվագծով նախնական մակերես',
      add: 'Ավելացնել կետ',
      undo: 'Վերջին կետը հեռացնել',
      reset: 'Մաքրել',
      finish: 'Ավարտել ուրվագիծը',
      calculate: 'Թարմացնել հաշվարկը',
      mapNotice: 'Քարտեզի ուրվագիծը մոտավոր է։ Այն չի չափում տեղային ստվերը կամ կոնստրուկցիան։',
      engineering: 'Ինժեներական պարամետրեր',
      azimuth: 'Ազիմուտ',
      tilt: 'Թեքություն',
      resultTitle: 'Ճշգրտված նախնական արդյունք',
      quickCapacity: 'Առաջին հաշվարկ',
      refinedCapacity: 'Տանիքի ճշգրտումից հետո',
      back: 'Վերադառնալ արագ հաշվիչ',
      contact: 'Կապվել մասնագետի հետ',
      pro: 'Ավելի մանրամասն կարգավորումներ',
      invalid: 'Հաստատեք կետը և նշեք վավեր տանիքի տարածք։',
      unavailable:
        'Ճշգրտված հաշվարկն այժմ անհասանելի է։ Ներմուծված տվյալները պահպանվել են այս session-ում։'
    },
    pro: {
      eyebrow: 'Պրոֆեսիոնալ ռեժիմ',
      title: 'Արևային պրոֆեսիոնալ հաշվիչ',
      intro: 'Ճշգրիտ վերլուծություն բոլոր պարամետրերով։ Պլանավորեք ձեր համակարգը քայլ առ քայլ։',
      steps: ['Տեղադրություն', 'Սպառում', 'Տանիք', 'Արդյունքներ'],
      locationTitle: 'Տեղադրություն',
      locationCopy:
        'Փնտրեք հասցեն, ընտրեք օբյեկտը քարտեզի վրա կամ օգտագործեք ընթացիկ տեղադրությունը։',
      searchAddress: 'Փնտրել հասցե',
      useCurrentLocation: 'Օգտագործել ընթացիկ տեղադրությունը',
      addressSearchHint: 'Մուտքագրեք հասցեի առնվազն 3 նիշ։',
      addressSearching: 'Փնտրում ենք հասցեն…',
      addressResults: 'Ընտրեք համապատասխան հասցեն',
      addressNoResults: 'Հասցեն չի գտնվել։ Ընտրեք կետ քարտեզի վրա։',
      addressSearchUnavailable: 'Հասցեների որոնումը հիմա հասանելի չէ։ Ընտրեք կետ քարտեզի վրա։',
      currentLocationLoading: 'Որոշում ենք ընթացիկ տեղադրությունը…',
      currentLocationUnavailable:
        'Ընթացիկ տեղադրությունը հասանելի չէ։ Թույլատրեք տեղադրության հասանելիությունը կամ ընտրեք կետ քարտեզի վրա։',
      region: 'Տարածաշրջան',
      city: 'Քաղաք / համայնք',
      district: 'Շրջան (ընտրովի)',
      coordinates: 'Կոորդինատներ',
      showOnMap: 'Ցուցադրել քարտեզի վրա',
      environmental: {
        co2: 'CO₂-ի կանխված արտանետումներ',
        trees: 'Ծառերի CO₂ կլանման համարժեք',
        historical: 'Վերջին միացված ստուգված պատմական գործոն'
      },
      results: {
        title: 'Ձեր արևային արդյունքները',
        intro: 'Ահա՝ ինչ կարող է ապահովել արևային էներգիան ձեր տանիքի համար։',
        restart: 'Սկսել նորից',
        potential: 'Ձեր արևային ներուժը',
        heroLines: ['Ավելի մաքուր,', 'ավելի պայծառ ապագան', 'սկսվում է այստեղ'],
        heroCopy: 'Փոխեք ձեր տանիքը մաքուր էներգիայի և սկսեք խնայել հենց այսօր։',
        monthlyProduction: 'Ամսական արտադրություն',
        impactTitle: 'Ձեր բնապահպանական ազդեցությունը',
        calculationTitle: 'Ինչպե՞ս ենք հաշվարկել սա',
        calculationCopy:
          'Մենք օգտագործել ենք PVGIS-ի իրական արևային տվյալները, ձեր տեղադրությունը, էլեկտրաէներգիայի սպառումը և տանիքի բնութագրերը՝ արևային ներուժը գնահատելու համար։',
        nextTitle: 'Ի՞նչ է հաջորդը',
        nextSteps: [
          {
            title: 'Ստացեք մանրամասն առաջարկ',
            copy: 'Ստացեք անհատական առաջարկ՝ սարքավորումներով, գնով և հետգնման հաշվարկով։'
          },
          {
            title: 'Խոսեք մեր մասնագետի հետ',
            copy: 'Կվերանայենք արդյունքները և կպատասխանենք ձեր բոլոր հարցերին։'
          },
          { title: 'Սկսեք խնայել', copy: 'Փոխեք արևի լույսը իրական խնայողության։' }
        ],
        offer: 'Ստանալ մանրամասն առաջարկ',
        metrics: {
          annualProduction: 'Տարեկան արտադրություն',
          selfConsumption: 'Սեփական սպառում',
          annualSavings: 'Տարեկան խնայողություն',
          co2Reduction: 'CO₂ կրճատում տարեկան'
        },
        impact: { co2: 'CO₂ կրճատում տարեկան', trees: 'Ծառերի համարժեք' },
        benefitsLabel: 'Արևային հաշվիչի առավելությունները',
        benefits: [
          {
            icon: 'shield-check',
            title: 'Հուսալի տվյալներ',
            copy: 'Հիմնված է PVGIS-ի իրական տվյալների վրա'
          },
          {
            icon: 'chart-bars',
            title: 'Ճշգրիտ արդյունքներ',
            copy: 'Հարմարեցված է ձեր տեղադրությանն ու տանիքին'
          },
          {
            icon: 'leaf',
            title: 'Անձնական տվյալներ չենք պահում',
            copy: 'Ձեր գաղտնիությունը մեզ համար կարևոր է'
          },
          {
            icon: 'support',
            title: 'Մասնագիտական աջակցություն',
            copy: 'Ձեզ հետ ենք յուրաքանչյուր քայլում'
          }
        ]
      },
      quick: 'Վերադառնալ արագ հաշվիչ'
    }
  },
  ru: {
    quickMeta: {
      title: 'Предварительный калькулятор: регион и потребление | YOURENERGY',
      description:
        'Выберите регион и укажите потребление для предварительной оценки, затем при необходимости уточните её по крыше.',
      ogTitle: 'Быстрый солнечный калькулятор | YOURENERGY',
      ogDescription: 'Начните с двух понятных полей.'
    },
    refineMeta: {
      title: 'Уточнение крыши | YOURENERGY',
      description:
        'Подтвердите точку и доступную площадь крыши, чтобы уточнить предварительную оценку.',
      ogTitle: 'Уточнить оценку крыши | YOURENERGY',
      ogDescription: 'Контур на карте или измеренная площадь.'
    },
    proMeta: {
      title: 'Профессиональный солнечный калькулятор | YOURENERGY',
      description: 'Прозрачный расчёт с PVGIS, параметрами крыши и источниками.',
      ogTitle: 'Профессиональный калькулятор | YOURENERGY',
      ogDescription: 'Детальный предварительный анализ.'
    },
    quick: {
      eyebrow: 'Быстрая предварительная оценка',
      title: 'Узнайте, какая солнечная система может подойти вашему дому',
      heroTitle: 'Солнечный калькулятор',
      heroCopy:
        'Выберите режим, регион и среднее потребление, чтобы получить предварительную оценку на основе PVGIS.',
      locationTitle: 'Местоположение',
      locationCopy: 'Выберите регион для точных солнечных данных',
      consumptionTitle: 'Потребление электроэнергии',
      consumptionCopy: 'Введите средний счёт за месяц или потребление',
      region: 'Регион',
      mode: 'Что вы знаете о потреблении',
      bill: 'Средний счёт в месяц',
      usage: 'Среднее потребление в месяц',
      billLabel: 'Средний счёт в месяц',
      usageLabel: 'Среднее потребление в месяц',
      tariffLabel: 'Выберите тариф на электроэнергию',
      tariffHelpBill:
        'Чтобы перевести счёт в kWh, выберите действующий официальный тариф или укажите ставку из своего счёта.',
      tariffHelpUsage:
        'Тариф необязателен: он нужен только для отображения экономии и окупаемости.',
      tariffChoose: 'Выберите тариф',
      tariffSuggested: 'Рекомендуемый стандартный диапазон для этого потребления',
      tariffOfficial: 'Официальный тариф',
      tariffCustom: 'Ввести тариф из своего счёта',
      customTariffLabel: 'Тариф из моего счёта, AMD/kWh',
      tariffDay: 'Дневной',
      tariffNight: 'Ночной',
      tariffCategories: {
        'social-vulnerable': 'Социально уязвимая семья',
        'standard-up-to-200': 'Стандартный: до 200 kWh/мес.',
        'standard-201-to-400': 'Стандартный: 201–400 kWh/мес.',
        'standard-over-400': 'Стандартный: свыше 400 kWh/мес.'
      },
      submit: 'Получить предварительную оценку',
      pro: 'Открыть профессиональный калькулятор',
      proTitle: 'Нужен более подробный анализ?',
      proCopy:
        'Откройте профессиональный режим для карты крыши и расширенного финансового анализа.',
      proAction: 'Перейти в Professional',
      waiting: 'Выберите регион и введите потребление.',
      loading: 'Получаем региональные солнечные данные из PVGIS…',
      unavailable: 'PVGIS сейчас недоступен. Мы не подставили примерные цифры. Попробуйте снова.',
      cacheNotConfigured:
        'Солнечный расчёт ещё не включён: защищённый кэш сервиса не настроен. Свяжитесь с инженером.',
      providerNotConfigured: 'Сервис солнечного расчёта ещё не настроен. Свяжитесь с инженером.',
      retry: 'Повторить запрос PVGIS',
      regional: 'Региональный предварительный результат',
      regionalCopy:
        'PVGIS-данные относятся к представительской точке выбранного региона, а не к вашему адресу или крыше.',
      resultsTitle: 'Ваши предварительные результаты',
      resultsCopy: 'На основе солнечных данных выбранного региона и вашего потребления',
      capacity: 'Рекомендуемая мощность',
      panels: 'Панели',
      generation: 'Годовая генерация',
      monthlyProduction: 'Расчётная генерация по месяцам',
      co2: 'Сокращение CO₂',
      trees: 'Эквивалент деревьев',
      budget: 'Предварительный бюджет',
      savings: 'Экономия в год',
      payback: 'Окупаемость',
      refine: 'Уточнить по моей крыше',
      contact: 'Получить предложение',
      phone: 'Позвонить инженеру',
      lead: {
        eyebrow: 'Ваш предварительный результат',
        title: 'Получить предложение',
        copy: 'Оставьте контакт — инженер получит краткое резюме этого предварительного расчёта.',
        name: 'Имя',
        phone: 'Телефон',
        comment: 'Комментарий',
        submit: 'Отправить запрос',
        loading: 'Отправляем запрос…',
        success: 'Запрос принят. Инженер свяжется с вами.',
        unavailable:
          'Сейчас запрос не отправляется. Позвоните инженеру, чтобы получить предложение.',
        invalid: 'Введите имя и корректный номер телефона.',
        close: 'Закрыть'
      },
      disclaimer:
        'Расчёт предварительный. Финальные параметры и стоимость подтверждаются после инженерной проверки объекта.',
      noTariff:
        'Добавьте тариф, чтобы увидеть экономию и окупаемость, или используйте данные из счёта.',
      priceUnavailable:
        'Предварительный ценовой диапазон сейчас недоступен. Запросите инженерное обследование для актуальной стоимости.',
      benefitsLabel: 'Преимущества солнечной энергии',
      benefits: [
        {
          icon: 'leaf',
          title: 'Ниже счета за электричество',
          copy: 'Используйте чистую солнечную энергию'
        },
        {
          icon: 'faq-settings',
          title: 'Меньше выбросов CO₂',
          copy: 'Более чистая среда для будущих поколений'
        },
        {
          icon: 'shield-check',
          title: 'Энергетическая независимость',
          copy: 'Меньше зависимости от сети'
        },
        { icon: 'support', title: 'Поддержка экспертов', copy: 'Мы рядом на каждом этапе' }
      ],
      signature: 'Чистая энергия. Более светлое завтра.',
      noJs: 'Если JavaScript отключён, позвоните инженеру для предварительной консультации.'
    },
    refine: {
      eyebrow: 'Уточнение крыши',
      title: 'Уточните оценку по точке дома и крыше',
      intro:
        'Выберите дом, затем обведите доступную крышу или введите известную измеренную площадь.',
      openMap: 'Выбрать дом на карте',
      confirm: 'Подтвердить эту точку',
      selected: 'Выбранная точка',
      coordinates: 'Я знаю координаты',
      latitude: 'Широта',
      longitude: 'Долгота',
      setCoordinates: 'Использовать координаты',
      roof: 'Доступная площадь крыши',
      outline: 'Обвести на карте',
      measured: 'Я знаю измеренную площадь',
      area: 'Измеренная площадь ската',
      preliminary: 'Предварительная площадь по контуру',
      add: 'Добавить точку',
      undo: 'Удалить последнюю точку',
      reset: 'Очистить',
      finish: 'Завершить контур',
      calculate: 'Обновить расчёт',
      mapNotice:
        'Контур на карте приблизительный. Он не измеряет локальное затенение или конструкцию.',
      engineering: 'Инженерные параметры',
      azimuth: 'Азимут',
      tilt: 'Наклон',
      resultTitle: 'Уточнённый предварительный результат',
      quickCapacity: 'Первый расчёт',
      refinedCapacity: 'После уточнения крыши',
      back: 'Вернуться к быстрому калькулятору',
      contact: 'Связаться со специалистом',
      pro: 'Больше инженерных настроек',
      invalid: 'Подтвердите точку и укажите корректную площадь крыши.',
      unavailable: 'Уточнённый расчёт сейчас недоступен. Введённые данные сохранены в этой сессии.'
    },
    pro: {
      eyebrow: 'Профессиональный режим',
      title: 'Профессиональный солнечный калькулятор',
      intro: 'Точный анализ всех параметров. Планируйте систему шаг за шагом.',
      steps: ['Локация', 'Потребление', 'Крыша', 'Результаты'],
      locationTitle: 'Локация',
      locationCopy: 'Найдите адрес, выберите объект на карте или используйте текущую локацию.',
      searchAddress: 'Найти адрес',
      useCurrentLocation: 'Использовать текущую локацию',
      addressSearchHint: 'Введите не менее 3 символов адреса.',
      addressSearching: 'Ищем адрес…',
      addressResults: 'Выберите подходящий адрес',
      addressNoResults: 'Адрес не найден. Выберите точку на карте.',
      addressSearchUnavailable: 'Поиск адреса сейчас недоступен. Выберите точку на карте.',
      currentLocationLoading: 'Определяем текущую локацию…',
      currentLocationUnavailable:
        'Не удалось получить текущую локацию. Разрешите доступ к геопозиции или выберите точку на карте.',
      region: 'Регион',
      city: 'Город / община',
      district: 'Район (необязательно)',
      coordinates: 'Координаты',
      showOnMap: 'Показать на карте',
      environmental: {
        co2: 'Предотвращённые выбросы CO₂',
        trees: 'Эквивалент поглощения CO₂ деревьями',
        historical: 'Последний подключённый подтверждённый исторический коэффициент'
      },
      results: {
        title: 'Ваши результаты по солнечной энергии',
        intro: 'Вот чего вы можете достичь с солнечной системой на своей крыше.',
        restart: 'Начать заново',
        potential: 'Ваш солнечный потенциал',
        heroLines: ['Более чистое,', 'более светлое будущее', 'начинается здесь'],
        heroCopy: 'Превратите крышу в источник чистой энергии и начните экономить уже сегодня.',
        monthlyProduction: 'Выработка по месяцам',
        impactTitle: 'Ваш вклад в окружающую среду',
        calculationTitle: 'Как мы это рассчитали?',
        calculationCopy:
          'Мы использовали реальные солнечные данные PVGIS, вашу локацию, потребление электроэнергии и характеристики крыши, чтобы оценить солнечный потенциал.',
        nextTitle: 'Что дальше?',
        nextSteps: [
          {
            title: 'Получите подробное предложение',
            copy: 'Получите персональное предложение с оборудованием, стоимостью и сроком окупаемости.'
          },
          {
            title: 'Поговорите со специалистом',
            copy: 'Мы проверим результаты и ответим на все ваши вопросы.'
          },
          { title: 'Начните экономить', copy: 'Превратите солнечный свет в реальную экономию!' }
        ],
        offer: 'Получить подробное предложение',
        metrics: {
          annualProduction: 'Годовая выработка',
          selfConsumption: 'Самопотребление',
          annualSavings: 'Расчётная экономия в год',
          co2Reduction: 'Снижение CO₂ в год'
        },
        impact: { co2: 'Снижение CO₂ в год', trees: 'Эквивалент деревьев' },
        benefitsLabel: 'Преимущества калькулятора',
        benefits: [
          {
            icon: 'shield-check',
            title: 'Надёжные данные',
            copy: 'На основе реальных данных PVGIS'
          },
          {
            icon: 'chart-bars',
            title: 'Точные результаты',
            copy: 'С учётом вашей локации и крыши'
          },
          {
            icon: 'leaf',
            title: 'Личные данные не хранятся',
            copy: 'Ваша конфиденциальность важна для нас'
          },
          { icon: 'support', title: 'Поддержка экспертов', copy: 'Мы рядом на каждом этапе' }
        ]
      },
      quick: 'Вернуться к быстрому калькулятору'
    }
  },
  en: {
    quickMeta: {
      title: 'Preliminary solar calculator: region and consumption | YOURENERGY',
      description:
        'Choose a region and enter consumption for a preliminary estimate, then refine it with your roof when needed.',
      ogTitle: 'Quick solar calculator | YOURENERGY',
      ogDescription: 'Start with two understandable fields.'
    },
    refineMeta: {
      title: 'Roof refinement | YOURENERGY',
      description: 'Confirm a point and usable roof area to refine the preliminary estimate.',
      ogTitle: 'Refine your roof estimate | YOURENERGY',
      ogDescription: 'Map outline or measured area.'
    },
    proMeta: {
      title: 'Professional solar calculator | YOURENERGY',
      description: 'A transparent PVGIS calculation with roof parameters and sources.',
      ogTitle: 'Professional calculator | YOURENERGY',
      ogDescription: 'Detailed preliminary analysis.'
    },
    quick: {
      eyebrow: 'Quick preliminary estimate',
      title: 'See what solar system may suit your home',
      heroTitle: 'Solar Calculator',
      heroCopy:
        'Choose a mode, region and average consumption to get a preliminary PVGIS-based estimate.',
      locationTitle: 'Location',
      locationCopy: 'Select a region for accurate solar data',
      consumptionTitle: 'Electricity consumption',
      consumptionCopy: 'Enter your average monthly bill or consumption',
      region: 'Region',
      mode: 'What do you know about consumption?',
      bill: 'Average monthly bill',
      usage: 'Average monthly consumption',
      billLabel: 'Average monthly bill',
      usageLabel: 'Average monthly consumption',
      tariffLabel: 'Choose your electricity tariff',
      tariffHelpBill:
        'To convert your bill into kWh, choose the official rate that applies to you or enter the rate from your bill.',
      tariffHelpUsage: 'A tariff is optional. It is needed only to show savings and payback.',
      tariffChoose: 'Choose a tariff',
      tariffSuggested: 'Suggested standard bracket for this consumption',
      tariffOfficial: 'Official tariff',
      tariffCustom: 'Enter the rate from my bill',
      customTariffLabel: 'Rate from my bill, AMD/kWh',
      tariffDay: 'Daytime',
      tariffNight: 'Nighttime',
      tariffCategories: {
        'social-vulnerable': 'Socially vulnerable household',
        'standard-up-to-200': 'Standard: up to 200 kWh/month',
        'standard-201-to-400': 'Standard: 201–400 kWh/month',
        'standard-over-400': 'Standard: over 400 kWh/month'
      },
      submit: 'Get preliminary estimate',
      pro: 'Open professional calculator',
      proTitle: 'Want a more detailed analysis?',
      proCopy: 'Open Professional mode for roof mapping and advanced financial analysis.',
      proAction: 'Switch to Professional',
      waiting: 'Choose a region and enter consumption.',
      loading: 'Getting regional solar data from PVGIS…',
      unavailable:
        'PVGIS is unavailable right now. We did not substitute example figures. Try again.',
      cacheNotConfigured:
        'Solar calculation is not enabled yet because the protected service cache is not configured. Contact an engineer.',
      providerNotConfigured:
        'The solar calculation service is not configured yet. Contact an engineer.',
      retry: 'Retry PVGIS request',
      regional: 'Regional preliminary result',
      regionalCopy:
        'The PVGIS data applies to a representative point in the selected region, not to your address or roof.',
      resultsTitle: 'Your estimated results',
      resultsCopy: 'Based on solar data for the selected region and your consumption',
      capacity: 'Recommended capacity',
      panels: 'Panels',
      generation: 'Annual generation',
      monthlyProduction: 'Estimated monthly production',
      co2: 'CO₂ reduction',
      trees: 'Tree equivalent',
      budget: 'Preliminary budget',
      savings: 'Annual savings',
      payback: 'Payback',
      refine: 'Refine with my roof',
      contact: 'Get a proposal',
      phone: 'Call an engineer',
      lead: {
        eyebrow: 'Your preliminary result',
        title: 'Get a proposal',
        copy: 'Leave your contact details and an engineer will receive a short summary of this preliminary calculation.',
        name: 'Name',
        phone: 'Phone',
        comment: 'Comment',
        submit: 'Send request',
        loading: 'Sending your request…',
        success: 'Your request was accepted. An engineer will contact you.',
        unavailable: 'Your request cannot be sent right now. Call an engineer to get a proposal.',
        invalid: 'Enter your name and a valid phone number.',
        close: 'Close'
      },
      disclaimer:
        'The calculation is preliminary. Final parameters and price are confirmed after an engineering site review.',
      noTariff: 'Add your tariff to see savings and payback, or use bill details.',
      priceUnavailable:
        'The preliminary price range is temporarily unavailable. Request an engineering survey for current pricing.',
      benefitsLabel: 'Solar energy benefits',
      benefits: [
        { icon: 'leaf', title: 'Lower electricity bills', copy: 'Use clean solar energy' },
        {
          icon: 'faq-settings',
          title: 'Reduce CO₂ emissions',
          copy: 'A cleaner environment for future generations'
        },
        { icon: 'shield-check', title: 'Energy independence', copy: 'Less reliance on the grid' },
        { icon: 'support', title: 'Expert support', copy: 'We are here at every step' }
      ],
      signature: 'Clean energy. A brighter tomorrow.',
      noJs: 'With JavaScript disabled, call an engineer for a preliminary consultation.'
    },
    refine: {
      eyebrow: 'Roof refinement',
      title: 'Refine the estimate with your home point and roof',
      intro: 'Select your home, then outline the usable roof or enter a known measured area.',
      openMap: 'Choose home on map',
      confirm: 'Confirm this point',
      selected: 'Selected point',
      coordinates: 'I know the coordinates',
      latitude: 'Latitude',
      longitude: 'Longitude',
      setCoordinates: 'Use coordinates',
      roof: 'Usable roof area',
      outline: 'Outline on map',
      measured: 'I know the measured area',
      area: 'Measured roof-plane area',
      preliminary: 'Preliminary area from outline',
      add: 'Add point',
      undo: 'Undo last point',
      reset: 'Clear',
      finish: 'Finish outline',
      calculate: 'Update estimate',
      mapNotice: 'The map outline is approximate. It does not measure local shading or structure.',
      engineering: 'Engineering parameters',
      azimuth: 'Azimuth',
      tilt: 'Tilt',
      resultTitle: 'Refined preliminary result',
      quickCapacity: 'First estimate',
      refinedCapacity: 'After roof refinement',
      back: 'Back to quick calculator',
      contact: 'Contact a specialist',
      pro: 'More engineering settings',
      invalid: 'Confirm a point and enter a valid roof area.',
      unavailable:
        'The refined calculation is unavailable right now. Your entered data remains in this session.'
    },
    pro: {
      eyebrow: 'Professional mode',
      title: 'Professional Solar Calculator',
      intro: 'Accurate analysis with all parameters. Plan your system step by step.',
      steps: ['Location', 'Consumption', 'Roof', 'Results'],
      locationTitle: 'Location',
      locationCopy:
        'Search for an address, choose the property on the map, or use your current location.',
      searchAddress: 'Search address',
      useCurrentLocation: 'Use current location',
      addressSearchHint: 'Enter at least 3 characters of the address.',
      addressSearching: 'Searching for the address…',
      addressResults: 'Choose a matching address',
      addressNoResults: 'Address not found. Choose a point on the map.',
      addressSearchUnavailable:
        'Address search is unavailable right now. Choose a point on the map.',
      currentLocationLoading: 'Getting your current location…',
      currentLocationUnavailable:
        'Current location is unavailable. Allow location access or choose a point on the map.',
      region: 'Region',
      city: 'City / Community',
      district: 'District (optional)',
      coordinates: 'Coordinates',
      showOnMap: 'Show on map',
      environmental: {
        co2: 'Avoided CO₂ emissions',
        trees: 'Tree CO₂ absorption equivalent',
        historical: 'Latest connected verified historical factor'
      },
      results: {
        title: 'Your Solar Results',
        intro: 'Here is what you can achieve with solar on your roof.',
        restart: 'Start over',
        potential: 'Your solar potential',
        heroLines: ['A cleaner,', 'brighter future', 'starts here'],
        heroCopy: 'Turn your roof into clean energy and start saving from day one.',
        monthlyProduction: 'Monthly production',
        impactTitle: 'Your environmental impact',
        calculationTitle: 'How we calculated this?',
        calculationCopy:
          'We used real solar data (PVGIS), your location, electricity consumption and roof characteristics to estimate your solar potential.',
        nextTitle: 'What’s next?',
        nextSteps: [
          {
            title: 'Get a detailed offer',
            copy: 'Receive a personalized proposal with equipment, pricing and payback period.'
          },
          {
            title: 'Talk to our specialist',
            copy: 'We’ll review the results and answer all your questions.'
          },
          { title: 'Start saving', copy: 'Turn sunlight into real savings!' }
        ],
        offer: 'Get a detailed offer',
        metrics: {
          annualProduction: 'Annual production',
          selfConsumption: 'Self-consumption',
          annualSavings: 'Estimated annual savings',
          co2Reduction: 'CO₂ reduction per year'
        },
        impact: { co2: 'CO₂ reduction per year', trees: 'Trees equivalent' },
        benefitsLabel: 'Calculator benefits',
        benefits: [
          {
            icon: 'shield-check',
            title: 'Reliable data',
            copy: 'Based on real solar data (PVGIS)'
          },
          {
            icon: 'chart-bars',
            title: 'Accurate results',
            copy: 'Tailored to your location and roof'
          },
          {
            icon: 'leaf',
            title: 'No personal data stored',
            copy: 'Your privacy is important to us'
          },
          { icon: 'support', title: 'Expert support', copy: 'We’re here to help at every step' }
        ]
      },
      quick: 'Back to quick calculator'
    }
  }
};

export const calculatorModes = Object.freeze(common);
export const regionLabels = Object.freeze(regions);
