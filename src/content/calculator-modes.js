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
      intro:
        'Ընտրեք տարածաշրջանը և գրեք միջին սպառումը։ Մենք PVGIS-ով հաշվարկում ենք տարածաշրջանային արևային ռեսուրսը՝ առանց ձեր տան տանիքը ենթադրելու։',
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
      capacity: 'Առաջարկվող հզորություն',
      panels: 'Վահանակներ',
      generation: 'Տարեկան արտադրություն',
      budget: 'Նախնական բյուջե',
      savings: 'Տարեկան խնայողություն',
      payback: 'Հետգնման ժամկետ',
      refine: 'Ճշգրտել իմ տանիքով',
      contact: 'Ստանալ առաջարկ',
      phone: 'Զանգել ինժեներին',
      offer: 'Ստուգել այլ առաջարկ',
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
      environmental: {
        co2: 'CO₂-ի կանխված արտանետումներ',
        trees: 'Ծառերի CO₂ կլանման համարժեք',
        historical: 'Վերջին միացված ստուգված պատմական գործոն'
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
      intro:
        'Выберите регион и укажите среднее потребление. Мы используем PVGIS для регионального солнечного потенциала — без предположений о вашей крыше.',
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
      capacity: 'Рекомендуемая мощность',
      panels: 'Панели',
      generation: 'Годовая генерация',
      budget: 'Предварительный бюджет',
      savings: 'Экономия в год',
      payback: 'Окупаемость',
      refine: 'Уточнить по моей крыше',
      contact: 'Получить предложение',
      phone: 'Позвонить инженеру',
      offer: 'Проверить другое предложение',
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
      environmental: {
        co2: 'Предотвращённые выбросы CO₂',
        trees: 'Эквивалент поглощения CO₂ деревьями',
        historical: 'Последний подключённый подтверждённый исторический коэффициент'
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
      intro:
        'Choose a region and enter average consumption. We use PVGIS for regional solar yield without assuming anything about your roof.',
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
      capacity: 'Recommended capacity',
      panels: 'Panels',
      generation: 'Annual generation',
      budget: 'Preliminary budget',
      savings: 'Annual savings',
      payback: 'Payback',
      refine: 'Refine with my roof',
      contact: 'Get a proposal',
      phone: 'Call an engineer',
      offer: 'Check another proposal',
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
      environmental: {
        co2: 'Avoided CO₂ emissions',
        trees: 'Tree CO₂ absorption equivalent',
        historical: 'Latest connected verified historical factor'
      },
      quick: 'Back to quick calculator'
    }
  }
};

export const calculatorModes = Object.freeze(common);
export const regionLabels = Object.freeze(regions);
