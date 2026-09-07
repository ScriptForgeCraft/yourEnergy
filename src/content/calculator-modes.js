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
      title: 'Արևային արագ հաշվիչ | YOURENERGY',
      description: 'Տարածաշրջանի և սպառման հիման վրա ստացեք ազնիվ նախնական արևային գնահատում։',
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
      intro:
        'Ընտրեք տարածաշրջանը և գրեք միջին սպառումը։ Մենք PVGIS-ով հաշվարկում ենք տարածաշրջանային արևային ռեսուրսը՝ առանց ձեր տան տանիքը ենթադրելու։',
      region: 'Տարածաշրջան',
      mode: 'Ինչ գիտեք սպառման մասին',
      bill: 'Միջին ամսական հաշիվ',
      usage: 'Միջին ամսական սպառում',
      billLabel: 'Միջին ամսական հաշիվ',
      usageLabel: 'Միջին ամսական սպառում',
      tariffLabel: 'Սակագին AMD/kWh',
      tariffHelp: 'Պարտադիր է, որպեսզի հաշիվը վերածվի kWh-ի։ Պատճենեք այն ձեր հաշիվից։',
      submit: 'Ստանալ նախնական գնահատում',
      pro: 'Բացել պրոֆեսիոնալ հաշվիչը',
      waiting: 'Լրացրեք տարածաշրջանն ու սպառումը։',
      loading: 'PVGIS-ից ստանում ենք տարածաշրջանային արևային տվյալները…',
      unavailable:
        'PVGIS-ի տվյալն այս պահին հասանելի չէ։ Թվեր չենք փոխարինել օրինակով։ Փորձեք կրկին։',
      retry: 'Կրկնել PVGIS հարցումը',
      regional: 'Տարածաշրջանային նախնական արդյունք',
      regionalCopy:
        'PVGIS-ի տվյալը վերաբերում է ընտրված տարածաշրջանի ներկայացուցչական կետին, ոչ թե ձեր տան հասցեին կամ տանիքին։',
      capacity: 'Առաջարկվող հզորություն',
      panels: 'Վահանակներ',
      generation: 'Տարեկան արտադրություն',
      budget: 'Նախնական բյուջե',
      savings: 'Տարեկան խնայողություն',
      payback: 'Հետգնման ժամկետ',
      refine: 'Ճշգրտել իմ տանիքով',
      contact: 'Ստանալ առաջարկ',
      offer: 'Ստուգել այլ առաջարկ',
      disclaimer:
        'Հաշվարկը նախնական է։ Վերջնական պարամետրերն ու արժեքը հաստատվում են օբյեկտի ինժեներական ստուգումից հետո։',
      noTariff:
        'Խնայողության և հետգնման համար ավելացրեք սակագինը կամ օգտագործեք ձեր հաշվի տվյալները։',
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
      title: 'Մանրամասն նախնական հաշվարկ',
      intro: 'Օգտագործեք քարտեզը, տանիքի ուղղությունը, թեքությունը և մանրամասն սպառման տվյալները։',
      quick: 'Վերադառնալ արագ հաշվիչ'
    }
  },
  ru: {
    quickMeta: {
      title: 'Быстрый калькулятор солнечной системы | YOURENERGY',
      description: 'Честная предварительная оценка по региону и потреблению.',
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
      intro:
        'Выберите регион и укажите среднее потребление. Мы используем PVGIS для регионального солнечного потенциала — без предположений о вашей крыше.',
      region: 'Регион',
      mode: 'Что вы знаете о потреблении',
      bill: 'Средний счёт в месяц',
      usage: 'Среднее потребление в месяц',
      billLabel: 'Средний счёт в месяц',
      usageLabel: 'Среднее потребление в месяц',
      tariffLabel: 'Тариф AMD/kWh',
      tariffHelp: 'Обязателен, чтобы перевести счёт в kWh. Скопируйте его из своего счёта.',
      submit: 'Получить предварительную оценку',
      pro: 'Открыть профессиональный калькулятор',
      waiting: 'Выберите регион и введите потребление.',
      loading: 'Получаем региональные солнечные данные из PVGIS…',
      unavailable: 'PVGIS сейчас недоступен. Мы не подставили примерные цифры. Попробуйте снова.',
      retry: 'Повторить запрос PVGIS',
      regional: 'Региональный предварительный результат',
      regionalCopy:
        'PVGIS-данные относятся к представительской точке выбранного региона, а не к вашему адресу или крыше.',
      capacity: 'Рекомендуемая мощность',
      panels: 'Панели',
      generation: 'Годовая генерация',
      budget: 'Предварительный бюджет',
      savings: 'Экономия в год',
      payback: 'Окупаемость',
      refine: 'Уточнить по моей крыше',
      contact: 'Получить предложение',
      offer: 'Проверить другое предложение',
      disclaimer:
        'Расчёт предварительный. Финальные параметры и стоимость подтверждаются после инженерной проверки объекта.',
      noTariff:
        'Добавьте тариф, чтобы увидеть экономию и окупаемость, или используйте данные из счёта.',
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
      title: 'Детальный предварительный расчёт',
      intro:
        'Используйте карту, направление и наклон крыши, а также детальные данные о потреблении.',
      quick: 'Вернуться к быстрому калькулятору'
    }
  },
  en: {
    quickMeta: {
      title: 'Quick solar calculator | YOURENERGY',
      description: 'An honest preliminary estimate from region and consumption.',
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
      intro:
        'Choose a region and enter average consumption. We use PVGIS for regional solar yield without assuming anything about your roof.',
      region: 'Region',
      mode: 'What do you know about consumption?',
      bill: 'Average monthly bill',
      usage: 'Average monthly consumption',
      billLabel: 'Average monthly bill',
      usageLabel: 'Average monthly consumption',
      tariffLabel: 'Tariff AMD/kWh',
      tariffHelp: 'Required to convert a bill to kWh. Copy it from your bill.',
      submit: 'Get preliminary estimate',
      pro: 'Open professional calculator',
      waiting: 'Choose a region and enter consumption.',
      loading: 'Getting regional solar data from PVGIS…',
      unavailable:
        'PVGIS is unavailable right now. We did not substitute example figures. Try again.',
      retry: 'Retry PVGIS request',
      regional: 'Regional preliminary result',
      regionalCopy:
        'The PVGIS data applies to a representative point in the selected region, not to your address or roof.',
      capacity: 'Recommended capacity',
      panels: 'Panels',
      generation: 'Annual generation',
      budget: 'Preliminary budget',
      savings: 'Annual savings',
      payback: 'Payback',
      refine: 'Refine with my roof',
      contact: 'Get a proposal',
      offer: 'Check another proposal',
      disclaimer:
        'The calculation is preliminary. Final parameters and price are confirmed after an engineering site review.',
      noTariff: 'Add your tariff to see savings and payback, or use bill details.',
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
      title: 'Detailed preliminary calculation',
      intro: 'Use the map, roof direction and tilt, plus detailed consumption data.',
      quick: 'Back to quick calculator'
    }
  }
};

export const calculatorModes = Object.freeze(common);
export const regionLabels = Object.freeze(regions);
