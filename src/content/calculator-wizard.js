const copy = {
  hy: {
    eyebrow: 'Անվճար նախնական հաշվարկ',
    title: 'Պարզ հաշվարկ ձեր տան արևային համակարգի համար',
    intro:
      'Ընտրեք տունը, նշեք սպառումն ու հասանելի տանիքը։ Մնացած տեխնիկական տվյալները հասանելի են ըստ անհրաժեշտության։',
    steps: ['Օբյեկտ', 'Սպառում', 'Տանիք', 'Արդյունք'],
    engineering: 'Ինժեներական պարամետրեր',
    addressLabel: 'Նշում ինժեների համար',
    addressHelp:
      'Հասցեն չի օգտագործվում հաշվարկի համար։ Ընտրեք ճշգրիտ կետ քարտեզի վրա կամ մուտքագրեք կոորդինատներ։',
    mapOpen: 'Ընտրել տունը քարտեզի վրա',
    selectedPoint: 'Ընտրված կետ',
    confirmPoint: 'Հաստատել այս կետը',
    coordinateAlternative: 'Գիտեմ կոորդինատները / քարտեզը հասանելի չէ',
    potentialReady:
      'PVGIS-ը ֆոնային ռեժիմում գնահատում է ընտրված կետի արևային ռեսուրսը։ Այն տանիքը ավտոմատ չի չափում։',
    potentialSkip: 'Շարունակել առանց PVGIS-ի',
    roofIntro: 'Նշեք տանիքի մակերեսն ու պարամետրերը՝ նախնական գնահատումը ճշգրտելու համար։',
    parallel: 'Տանիքին զուգահեռ',
    elevated: 'Բարձրացված կառուցվածք',
    drawRoof:
      'Նշեք նույն տանիքի առնվազն 3 անկյունը քարտեզի վրա։ Մարկերը կարող եք քաշել՝ դիրքը շտկելու համար։ Հաշվարկ պահանջելիս ուրվագիծը կավարտվի ինքնաբար։',
    continueConsumption: 'Շարունակել դեպի արդյունք',
    calculate: 'Ստանալ նախնական հաշվարկ',
    back: 'Վերադառնալ',
    next: 'Շարունակել',
    production: 'Համակարգի ամսական արտադրություն',
    metrics: {
      panels: 'Վահանակներ',
      annualGeneration: 'Տարեկան արտադրություն',
      coverage: 'Ծածկույթ',
      annualSavings: 'Տարեկան խնայողություն',
      payback: 'Հետգնման ժամկետ',
      pvgis: 'PVGIS',
      system: 'Համակարգ',
      tariff: 'Սակագին'
    },
    budget: 'YOURENERGY-ի նախնական բյուջե',
    roofLimit: 'Հզորությունը սահմանափակված է հասանելի տանիքի մակերեսով',
    tariffNeeded:
      'Խնայողությունն ու հետգնման ժամկետը տեսնելու համար մուտքագրեք ձեր հաշվի սակագինը։',
    addTariff: 'Ավելացնել սակագին',
    openPassport: 'Բացել Solar Passport-ը',
    passportTitle: 'Solar Passport',
    passportCopy: 'Այս աշխատաշրջանի նախնական տվյալները, աղբյուրներն ու սահմանափակումները։',
    stepMobile: 'Քայլ {step} 4-ից · {title}',
    mapApproximate:
      'Քարտեզի ուրվագիծը մոտավոր է։ Տեղային ստվերը և կոնստրուկցիան հաստատում է ինժեները։',
    ui: {
      location: {
        map: 'Քարտեզ',
        satellite: 'Արբանյակ',
        dataTitle: 'Տեղադրության տվյալներ',
        irradiation: 'Տարեկան ճառագայթում',
        dailyAverage: 'Օրական միջին',
        vsEu: 'ԵՄ միջինի համեմատ',
        higherPotential: 'Ավելի բարձր արևային ներուժ',
        place: 'Երևան, Հայաստան',
        latitude: 'Լայն.',
        longitude: 'Երկ.',
        annualIrradiation: 'Տարեկան արևային ճառագայթում'
      },
      uploadBill: 'Վերբեռնել հաշիվը',
      advancedOptions: 'Լրացուցիչ կարգավորումներ',
      estimateTitle: 'Գնահատվող տարեկան սպառում',
      estimateBadge: 'Սա գնահատական է։',
      consumption: {
        monthlyTitle: 'Ամսական սպառում',
        optional: 'ընտրովի',
        monthlyCopy: 'Ավելի բարձր ճշգրտության համար մուտքագրեք փաստացի ամսական սպառումը։',
        kwh: 'kWh',
        amd: 'AMD',
        fillAverage: 'Լրացնել միջին արժեքներով',
        tipsTitle: 'Արագ խորհուրդներ',
        tipBillTitle: 'Ստուգեք էլեկտրաէներգիայի հաշիվը',
        tipBillCopy: 'Միջին ամսական գումարը կարող եք գտնել կոմունալ վճարման հաշվում։',
        tipMonthlyTitle: 'Օգտագործեք ամսական տվյալներ, եթե կան',
        tipMonthlyCopy: 'Ավելի մանրամասն պրոֆիլը բարձրացնում է արդյունքի ճշգրտությունը։',
        tipTariffTitle: 'Սակագինը կարևոր է',
        tipTariffCopy: 'Սակագները փոխում են ֆինանսական գնահատումն ու հետգնման ժամկետը։',
        advancedCopy: 'Ամսական պրոֆիլն ու ձեր նշած սակագինը պահպանվում են հաշվարկում։',
        profileAction: 'Մուտքագրել ամսական պրոֆիլ'
      },
      roof: {
        map: 'Քարտեզ',
        satellite: 'Արբանյակ',
        analysis: 'Տանիքի վերլուծություն',
        area: 'Տանիքի մակերես',
        potential: 'Արևային ներուժ (PVGIS)',
        orientation: 'Կողմնորոշում',
        tilt: 'Թեքության անկյուն',
        tipsTitle: 'Լավագույն արդյունքի խորհուրդներ',
        tipsCopy: 'Ուրվագծեք միայն մեկ տանիքի մակերես · մոտեցրեք քարտեզը բարձր ճշգրտության համար',
        advancedCopy: 'Տեղադրման եղանակը և թեքության պարամետրերը կիրառվում են հաջորդ հաշվարկի մեջ։',
        outlineRequired:
          'Քարտեզի վրա նշեք նույն տանիքի առնվազն 3 անկյունը։ Հաշվարկ պահանջելիս ուրվագիծը կավարտվի ինքնաբար։',
        areaRequired: 'Մուտքագրեք օգտագործելի տանիքի մակերեսը մ²-ով։',
        orientationRequired: 'Ընտրեք տանիքի լանջի ուղղությունը։',
        tiltRequired: 'Մուտքագրեք տանիքի թեքության անկյունը 0°-ից 90°։',
        analysisFailed:
          'Հաշվարկն այժմ չհաջողվեց։ Ձեր տվյալները պահպանված են․ ստուգեք կապը և կրկին փորձեք։'
      }
    }
  },
  ru: {
    eyebrow: 'Бесплатный предварительный расчёт',
    title: 'Простой расчёт солнечной системы для вашего дома',
    intro:
      'Выберите дом, укажите потребление и доступную крышу. Технические параметры откроются только при необходимости.',
    steps: ['Объект', 'Потребление', 'Крыша', 'Результат'],
    engineering: 'Инженерные параметры',
    addressLabel: 'Заметка для инженера',
    addressHelp:
      'Адрес не используется для солнечного расчёта. Выберите точную точку на карте или введите координаты.',
    mapOpen: 'Выбрать дом на карте',
    selectedPoint: 'Выбранная точка',
    confirmPoint: 'Подтвердить эту точку',
    coordinateAlternative: 'Я знаю координаты / карта недоступна',
    potentialReady:
      'PVGIS в фоне проверяет солнечный ресурс выбранной точки. Он не измеряет крышу автоматически.',
    potentialSkip: 'Продолжить без PVGIS',
    roofIntro: 'Задайте площадь и параметры крыши, чтобы уточнить предварительную оценку солнечного потенциала.',
    parallel: 'Параллельно крыше',
    elevated: 'Приподнятая конструкция',
    drawRoof:
      'Отметьте на карте минимум 3 угла одной поверхности крыши. Маркеры можно перетаскивать для уточнения позиции. При запуске расчёта контур завершится автоматически.',
    continueConsumption: 'Перейти к результату',
    calculate: 'Получить предварительный расчёт',
    back: 'Назад',
    next: 'Продолжить',
    production: 'Помесячная выработка системы',
    metrics: {
      panels: 'Панели',
      annualGeneration: 'Годовая выработка',
      coverage: 'Покрытие',
      annualSavings: 'Экономия в год',
      payback: 'Окупаемость',
      pvgis: 'PVGIS',
      system: 'Система',
      tariff: 'Тариф'
    },
    budget: 'Предварительный бюджет YOURENERGY',
    roofLimit: 'Мощность ограничена доступной площадью крыши',
    tariffNeeded: 'Хотите увидеть экономию и окупаемость? Укажите тариф из вашего счёта.',
    addTariff: 'Добавить тариф',
    openPassport: 'Открыть Solar Passport',
    passportTitle: 'Solar Passport',
    passportCopy: 'Предварительные данные этой сессии, источники и ограничения.',
    stepMobile: 'Шаг {step} из 4 · {title}',
    mapApproximate:
      'Контур на карте приблизительный. Локальное затенение и конструкцию подтвердит инженер.',
    ui: {
      location: {
        map: 'Карта',
        satellite: 'Спутник',
        dataTitle: 'Данные местоположения',
        irradiation: 'Годовая инсоляция',
        dailyAverage: 'Среднее в день',
        vsEu: 'к среднему по ЕС',
        higherPotential: 'Более высокий солнечный потенциал',
        place: 'Ереван, Армения',
        latitude: 'Шир.',
        longitude: 'Долг.',
        annualIrradiation: 'Годовая солнечная инсоляция'
      },
      uploadBill: 'Загрузить счёт',
      advancedOptions: 'Дополнительные параметры',
      estimateTitle: 'Расчётное годовое потребление',
      estimateBadge: 'Это предварительная оценка.',
      consumption: {
        monthlyTitle: 'Потребление по месяцам',
        optional: 'необязательно',
        monthlyCopy: 'Введите фактическое потребление по месяцам для более точного расчёта.',
        kwh: 'кВт·ч',
        amd: 'AMD',
        fillAverage: 'Заполнить средними значениями',
        tipsTitle: 'Полезные советы',
        tipBillTitle: 'Проверьте счёт за электроэнергию',
        tipBillCopy: 'Среднюю сумму за месяц можно найти в коммунальном счёте.',
        tipMonthlyTitle: 'Используйте помесячные данные, если они есть',
        tipMonthlyCopy: 'Более подробный профиль повышает точность результата.',
        tipTariffTitle: 'Тариф имеет значение',
        tipTariffCopy: 'Разные тарифы влияют на финансовую оценку и срок окупаемости.',
        advancedCopy: 'Помесячный профиль и введённый тариф сохраняются для следующего расчёта.',
        profileAction: 'Перейти к помесячному профилю'
      },
      roof: {
        map: 'Карта',
        satellite: 'Спутник',
        analysis: 'Анализ крыши',
        area: 'Площадь крыши',
        potential: 'Солнечный потенциал (PVGIS)',
        orientation: 'Ориентация',
        tilt: 'Угол наклона',
        tipsTitle: 'Советы для лучшего результата',
        tipsCopy:
          'Обведите только одну поверхность крыши · увеличьте масштаб для более высокой точности',
        advancedCopy: 'Способ установки и параметры наклона применяются в следующем расчёте.',
        outlineRequired:
          'Отметьте на карте минимум 3 угла одной поверхности крыши. При запуске расчёта контур завершится автоматически.',
        areaRequired: 'Введите полезную площадь крыши в м².',
        orientationRequired: 'Выберите направление ската крыши.',
        tiltRequired: 'Введите угол наклона крыши от 0° до 90°.',
        analysisFailed:
          'Сейчас не удалось выполнить расчёт. Ваши данные сохранены — проверьте соединение и повторите попытку.'
      }
    }
  },
  en: {
    eyebrow: 'Free preliminary estimate',
    title: 'A simple solar estimate for your home',
    intro:
      'Choose the home, enter consumption and outline the usable roof. Technical inputs appear only when you need them.',
    steps: ['Property', 'Consumption', 'Roof', 'Result'],
    engineering: 'Engineering parameters',
    addressLabel: 'Note for the engineer',
    addressHelp:
      'The address is not used for the solar calculation. Choose the exact point on the map or enter coordinates.',
    mapOpen: 'Choose home on the map',
    selectedPoint: 'Selected point',
    confirmPoint: 'Confirm this point',
    coordinateAlternative: 'I know the coordinates / the map is unavailable',
    potentialReady:
      'PVGIS checks the selected point’s solar resource in the background. It does not measure a roof automatically.',
    potentialSkip: 'Continue without PVGIS',
    roofIntro: 'Define your roof area and parameters to refine the preliminary estimate.',
    parallel: 'Parallel to roof',
    elevated: 'Elevated structure',
    drawRoof:
      'Mark at least 3 corners of one roof surface on the map. Drag markers to refine their positions. The outline finishes automatically when you request a calculation.',
    continueConsumption: 'Continue to result',
    calculate: 'Get preliminary estimate',
    back: 'Back',
    next: 'Continue',
    production: 'Monthly system generation',
    metrics: {
      panels: 'Panels',
      annualGeneration: 'Annual generation',
      coverage: 'Coverage',
      annualSavings: 'Annual savings',
      payback: 'Payback',
      pvgis: 'PVGIS',
      system: 'System',
      tariff: 'Tariff'
    },
    budget: 'YOURENERGY preliminary budget',
    roofLimit: 'Capacity is limited by the available roof area',
    tariffNeeded: 'Want to see savings and payback? Add the tariff from your bill.',
    addTariff: 'Add tariff',
    openPassport: 'Open Solar Passport',
    passportTitle: 'Solar Passport',
    passportCopy: 'This session’s preliminary inputs, sources and limitations.',
    stepMobile: 'Step {step} of 4 · {title}',
    mapApproximate:
      'The map outline is approximate. An engineer confirms local shading and structure.',
    ui: {
      location: {
        map: 'Map',
        satellite: 'Satellite',
        dataTitle: 'Location data',
        irradiation: 'Annual irradiation',
        dailyAverage: 'Daily average',
        vsEu: 'vs. EU average',
        higherPotential: 'Higher solar potential',
        place: 'Yerevan, Armenia',
        latitude: 'Lat:',
        longitude: 'Lon:',
        annualIrradiation: 'Annual solar irradiation'
      },
      uploadBill: 'Upload bill',
      advancedOptions: 'Advanced options',
      estimateTitle: 'Estimated annual consumption',
      estimateBadge: 'This is an estimate.',
      consumption: {
        monthlyTitle: 'Monthly consumption',
        optional: 'optional',
        monthlyCopy: 'Enter your actual monthly consumption for higher accuracy.',
        kwh: 'kWh',
        amd: 'AMD',
        fillAverage: 'Fill with average values',
        tipsTitle: 'Quick tips',
        tipBillTitle: 'Check your electricity bill',
        tipBillCopy: 'You can find the average monthly amount on your utility bill.',
        tipMonthlyTitle: 'Use monthly data if available',
        tipMonthlyCopy: 'A more detailed profile improves the accuracy of the results.',
        tipTariffTitle: 'Tariff matters',
        tipTariffCopy: 'Different tariffs affect the financial analysis and payback period.',
        advancedCopy:
          'The monthly profile and entered tariff are retained for the next calculation.',
        profileAction: 'Enter monthly profile'
      },
      roof: {
        map: 'Map',
        satellite: 'Satellite',
        analysis: 'Roof analysis',
        area: 'Roof area',
        potential: 'Solar potential (PVGIS)',
        orientation: 'Orientation',
        tilt: 'Tilt angle',
        tipsTitle: 'Tips for best results',
        tipsCopy: 'Draw only one roof surface · Zoom in for higher accuracy',
        advancedCopy:
          'The mounting approach and tilt parameters are applied to the next calculation.',
        outlineRequired:
          'Mark at least 3 corners of one roof surface on the map. The outline finishes automatically when you request a calculation.',
        areaRequired: 'Enter the usable roof area in m².',
        orientationRequired: 'Select the roof-face direction.',
        tiltRequired: 'Enter a roof tilt from 0° to 90°.',
        analysisFailed:
          "We couldn't calculate the result right now. Your entries are saved — check the connection and try again."
      }
    }
  }
};

export default copy;
