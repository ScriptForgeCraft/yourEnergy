const copy = {
  hy: {
    eyebrow: 'Անվճար նախնական հաշվարկ',
    title: 'Պարզ հաշվարկ ձեր տան արևային համակարգի համար',
    intro:
      'Ընտրեք տունը, նշեք սպառումն ու հասանելի տանիքը։ Մնացած տեխնիկական տվյալները հասանելի են ըստ անհրաժեշտության։',
    steps: ['Օբյեկտ', 'Սպառում', 'Տանիք', 'Արդյունք'],
    engineering: 'Ինժեներական պարամետրեր',
    calculationPanelLabel: 'Նախնական չափագրման հիմք',
    calculationPanelHelp:
      'Տանիքի նախնական չափագրումը հիմնվում է կատալոգային մոդուլի չափի և հզորության վրա։ Սարքավորումը կներկայացվի արդյունքում։',
    preliminarySizingBasis: 'Նախնական չափագրման հիմք',
    preliminarySizingBasisCopy:
      'Տանիքի նախնական գնահատումը հիմնվում է կատալոգային մոդուլի չափի և հզորության վրա։',
    roofCapacityTitle: 'Տանիքի նախնական տարողություն',
    roofAreaForSizing: 'Հաշվարկում օգտագործված տանիքի մակերես',
    preliminaryUsableRoofArea: 'Մոդուլների նախնական հասանելի մակերես',
    maximumPanelsForRoof: 'Առավելագույնը՝ ըստ նախնական չափագրման հիմքի',
    roofCapacityPreview: 'Տանիքի նախնական DC հզորություն՝ {capacity} kWp ({count} մոդուլ)',
    roofCapacityAssumption:
      'Նախնական հաշվարկում օգտագործվում է մակերեսի {ratio}%‑ը՝ անցումների և հեռավորությունների համար։',
    energyBalanceTitle: 'Էներգետիկ հաշվեկշիռ',
    annualConsumption: 'Տարեկան սպառում',
    coveredConsumption: 'Ծածկվող սպառում',
    retailOffsetSavings: 'Խնայողություն ծածկվող սպառումից',
    retailOffsetSavingsCopy: '≈ {value} AMD/տարի',
    surplusValueUnavailable: 'Ավելցուկի արժեքը ներառված չէ․ հաստատված փոխհատուցման սակագին չկա։',
    surplusCompensationValue: 'Ավելցուկի փոխհատուցում',
    environmentalFactorSource: 'Պատմական էլեկտրացանցի արտանետման գործակից',
    moduleRecommendationTitle: 'Առաջարկվող արևային մոդուլ',
    moduleRecommendationCopy:
      '{quantity} մոդուլ × {watts} W = {capacity} kWp DC · ֆիզիկական մակերես՝ {area} m²/մոդուլ · ընդհանուր հետք՝ {footprint} m²',
    moduleRecommendationReason:
      'Մոդուլների քանակն ու կատալոգային հզորությունը համապատասխանում են հաշվարկված DC հզորությանը։',
    recommendedSystemTitle: 'Առաջարկվող համակարգ',
    recommendationPreliminary: 'Նախնական առաջարկ',
    viewProduct: 'Դիտել ապրանքը',
    equipmentImageUnavailable: 'Ապրանքի պատկերը հասանելի չէ',
    storageModules: 'մոդուլ',
    inverterTechnologyCopy: 'Տեխնոլոգիա՝ {technology}',
    gridTiedInverter: 'Ցանցային ինվերտեր',
    hybridInverter: 'Հիբրիդային ինվերտեր',
    inverterExactVariantReason:
      'Ընտրված AC տարբերակը ճշգրիտ համապատասխանում է հաշվարկված PV DC հզորությանը։',
    inverterNextVariantReason:
      'Ընտրված է կատալոգի ամենափոքր հասանելի AC տարբերակը, որը հաշվարկված PV DC հզորությունից ցածր չէ։',
    equipmentPreliminaryCopy:
      'Ընտրությունը նախնական է․ լարային նախագիծը, էլեկտրական համատեղելիությունը և տեղային իրականացումը հաստատում է ինժեները։',
    calculationBasisTitle: 'Հաշվարկի հիմքը',
    calculationBasis: {
      coordinates: 'Կոորդինատներ',
      regionalCoordinates: 'Տարածաշրջանային հենակետ',
      solarYield: 'Արևային արտադրողականություն',
      roof: 'Տանիքի տվյալներ',
      usableRoofRatio: 'Տանիքի օգտակար բաժին',
      solarModule: 'Հաշվարկային արևային մոդուլ',
      inverter: 'Առաջարկվող ինվերտեր',
      storage: 'Կուտակիչի տարբերակ',
      mounting: 'Ամրացման տարբերակ',
      tariff: 'Էլեկտրաէներգիայի սակագին',
      surplusCompensation: 'Ավելցուկի փոխհատուցում',
      noTariff: 'Սակագինը ընտրված չէ',
      noSurplusCompensation: 'Փոխհատուցման հաստատված սակագինը կարգավորված չէ',
      systemLoss: 'Համակարգի կորուստ',
      sourceTypes: {
        'user-input': 'օգտատիրոջ մուտքագրում',
        'regional-reference': 'տարածաշրջանային հենակետ',
        'pvgis-result': 'PVGIS արդյունք',
        'catalog-technical-value': 'կատալոգի տեխնիկական արժեք',
        'calculator-assumption': 'հաշվիչի ենթադրություն',
        'registry-value': 'գրանցամատյանի արժեք',
        'preliminary-recommendation': 'նախնական առաջարկ',
        unavailable: 'անհասանելի աղբյուր'
      }
    },
    storageRequestLabel: 'Ներառել կուտակիչի / պահուստի գնահատում',
    storageRequestHelp:
      'Ճշգրիտ ընտրության համար անհրաժեշտ են կրիտիկական բեռի և պահուստի տևողության տվյալներ։',
    inverterRecommendationTitle: 'Առաջարկվող ինվերտեր',
    inverterRecommendationCopy:
      'Ընտրված է հաշվարկված PV DC հզորության համար։ Վերջնական լարային, MPPT և ցանցային համատեղելիությունը հաստատվում է ինժեներական փուլում։',
    mountingHardwareTitle: 'Կատալոգային ամրացման տարբերակ',
    mountingHardwareCopy:
      'PVGIS օպտիմում՝ {optimum}° · հասանելի անկյուններ՝ {available}° · գործնական կատալոգային տարբերակ՝ {practical}°',
    mountingHardwareReason: 'Ընտրված է կատալոգի PVGIS օպտիմումին ամենամոտ աջակցվող թեքությունը։',
    mountingHardwareDimensionsCopy: 'Կոմպլեկտ՝ {kit} mm · ռելս՝ {rail} mm',
    mountingHardwareNoMatchCopy:
      'PVGIS օպտիմումը {optimum}° է, սակայն կատալոգում նորմալացված աջակցվող անկյունով ամրացման տարբերակ չկա։',
    mountingHardwareEngineeringCopy:
      'Կատալոգային անկյունը չի փոխում հաշվարկված տանիքի հարթությունը։ Կոնստրուկցիան և քամու բեռը հաստատվում են ինժեների կողմից։',
    storageRecommendationTitle: 'Էներգիայի կուտակման տարբերակ',
    storageProfileRequiredCopy:
      'Կուտակիչը ընտրովի է։ Ճշգրիտ հզորությունը պահանջում է կրիտիկական բեռի և պահուստի տևողության տվյալներ։',
    storageSizingCopy:
      'Պահանջվող օգտագործելի՝ {required} kWh · {modules} մոդուլ · ընտրված օգտագործելի՝ {selected} kWh',
    storageSizingReason:
      'Մոդուլների ամբողջական քանակը կլորացվել է վեր՝ պահանջվող օգտագործելի հզորությունը ծածկելու համար։',
    storageCapacityExceededCopy:
      'Պահանջվող օգտագործելի հզորությունը գերազանցում է կատալոգային համակարգի առավելագույնը՝ {maximum} kWh։',
    storageEngineeringCopy:
      'Վերջնական համատեղելիությունը, պահուստային հզորությունը և միացման սխեման հաստատվում են ինժեներական փուլում։',
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
    surplusEnergy: 'Ավելցուկային արտադրություն',
    surplusCompensationUnavailableCopy:
      '{surplus} kWh/տարին գերազանցում է տարեկան սպառումը։ Ավելցուկի դրամական արժեքը և հետգնման ժամկետը չեն ցուցադրվում, քանի դեռ չի կարգավորվել հաստատված փոխհատուցման սակագին։',
    surplusCompensationValueCopy:
      'Ավելցուկային արտադրություն՝ {surplus} kWh/տարի · փոխհատուցման արժեք՝ {value} AMD/տարի։',
    tariffNeeded:
      'Խնայողությունն ու հետգնման ժամկետը տեսնելու համար մուտքագրեք ձեր հաշվի սակագինը։',
    addTariff: 'Ավելացնել սակագին',
    openPassport: 'Բացել Solar Passport-ը',
    passportTitle: 'Solar Passport',
    passportCopy: 'Այս աշխատաշրջանի նախնական տվյալները, աղբյուրներն ու սահմանափակումները։',
    pdfReport: {
      download: 'Պահպանել PDF հաշվետվությունը',
      title: 'Արևային հաշվարկի հաշվետվություն',
      subtitle:
        'Այս հաշվետվությունը միավորում է ձեր մուտքագրած տվյալները, հաշվարկի արդյունքները և նախնական առաջարկները։',
      preliminary: 'ՆԱԽՆԱԿԱՆ',
      generated: 'Ստեղծվել է',
      reportId: 'Հաշվետվության ID',
      inputs: 'Ձեր մուտքագրած տվյալները',
      results: 'Հաշվարկի արդյունքները',
      equipment: 'Առաջարկվող սարքավորումներ',
      finance: 'Ֆինանսական գնահատում',
      sourcesTitle: 'Աղբյուրներ և ենթադրություններ',
      monthly: 'Ամսական էլեկտրաէներգիայի արտադրություն',
      cashflow: 'Ֆինանսական հեռանկար',
      limitations: 'Ենթադրություններ և սահմանափակումներ',
      property: 'Օբյեկտ',
      coordinates: 'Կոորդինատներ',
      consumption: 'Տարեկան սպառում',
      monthlyConsumption: 'Ամսական սպառման պրոֆիլ',
      tariff: 'Սակագին',
      storageRequest: 'Կուտակիչի գնահատում',
      yes: 'Այո',
      no: 'Ոչ',
      roof: 'Տանիք',
      mounting: 'Տեղադրման եղանակ',
      capacity: 'Համակարգի հզորություն',
      panels: 'Վահանակներ',
      annualProduction: 'Տարեկան արտադրություն',
      coverage: 'Սպառման ծածկույթ',
      coveredConsumption: 'Ծածկված սպառում',
      surplus: 'Ավելցուկային արտադրություն',
      annualSavings: 'Տարեկան խնայողություն',
      payback: 'Հետգնման ժամկետ',
      budget: 'Նախնական բյուջե',
      module: 'Արևային մոդուլ',
      inverter: 'Ինվերտեր',
      storage: 'Կուտակիչ',
      co2: 'CO₂ կրճատում',
      years: 'տարի',
      twentyFiveYears: '25 տարի',
      unavailable: 'Անհասանելի',
      popupBlocked: 'PDF հաշվետվությունը բացելու համար թույլատրեք պատուհանը դիտարկիչում։',
      footer:
        'Հաշվետվությունը նախնական է և չի փոխարինում տեղազննությանը, ինժեներական նախագծին կամ առևտրային առաջարկին։'
    },
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
    calculationPanelLabel: 'Основа предварительного подбора',
    calculationPanelHelp:
      'Предварительный расчёт крыши использует площадь и мощность модуля из каталога. Оборудование будет показано в результате.',
    preliminarySizingBasis: 'Основа предварительного подбора',
    preliminarySizingBasisCopy:
      'Предварительный расчёт крыши использует площадь и мощность модуля из каталога.',
    roofCapacityTitle: 'Предварительная вместимость крыши',
    roofAreaForSizing: 'Площадь крыши в расчёте',
    preliminaryUsableRoofArea: 'Предварительно доступная площадь для модулей',
    maximumPanelsForRoof: 'Максимум по основе предварительного подбора',
    roofCapacityPreview: 'Предварительная DC-мощность крыши: {capacity} кВтp ({count} модулей)',
    roofCapacityAssumption:
      'Для предварительного расчёта используется {ratio}% площади — на отступы и проходы.',
    energyBalanceTitle: 'Энергетический баланс',
    annualConsumption: 'Годовое потребление',
    coveredConsumption: 'Покрываемое потребление',
    retailOffsetSavings: 'Экономия на покрытом потреблении',
    retailOffsetSavingsCopy: '≈ {value} AMD/год',
    surplusValueUnavailable:
      'Стоимость избытка не включена: подтверждённая ставка компенсации не настроена.',
    surplusCompensationValue: 'Компенсация избытка',
    environmentalFactorSource: 'Исторический коэффициент выбросов электросети',
    moduleRecommendationTitle: 'Рекомендуемый солнечный модуль',
    moduleRecommendationCopy:
      '{quantity} модулей × {watts} W = {capacity} кВтp DC · физическая площадь: {area} м²/модуль · общий контур: {footprint} м²',
    moduleRecommendationReason:
      'Количество модулей и их мощность из каталога дают рассчитанную DC-мощность.',
    recommendedSystemTitle: 'Рекомендуемая система',
    recommendationPreliminary: 'Предварительная рекомендация',
    viewProduct: 'Посмотреть товар',
    equipmentImageUnavailable: 'Изображение товара недоступно',
    storageModules: 'модулей',
    inverterTechnologyCopy: 'Технология: {technology}',
    gridTiedInverter: 'Сетевой инвертор',
    hybridInverter: 'Гибридный инвертор',
    inverterExactVariantReason:
      'Выбранный вариант AC точно соответствует рассчитанной PV DC-мощности.',
    inverterNextVariantReason:
      'Выбран наименьший доступный вариант AC из каталога, не меньший рассчитанной PV DC-мощности.',
    equipmentPreliminaryCopy:
      'Подбор предварительный: схему строк, электрическую совместимость и реализацию на объекте подтверждает инженер.',
    calculationBasisTitle: 'Основание расчёта',
    calculationBasis: {
      coordinates: 'Координаты',
      regionalCoordinates: 'Региональная опорная точка',
      solarYield: 'Солнечная выработка',
      roof: 'Данные крыши',
      usableRoofRatio: 'Полезная доля крыши',
      solarModule: 'Расчётный солнечный модуль',
      inverter: 'Рекомендуемый инвертор',
      storage: 'Вариант накопителя',
      mounting: 'Вариант крепления',
      tariff: 'Тариф электроэнергии',
      surplusCompensation: 'Компенсация избытка',
      noTariff: 'Тариф не выбран',
      noSurplusCompensation: 'Подтверждённая ставка компенсации не настроена',
      systemLoss: 'Системные потери',
      sourceTypes: {
        'user-input': 'ввод пользователя',
        'regional-reference': 'региональная опорная точка',
        'pvgis-result': 'результат PVGIS',
        'catalog-technical-value': 'техническое значение каталога',
        'calculator-assumption': 'допущение калькулятора',
        'registry-value': 'значение реестра',
        'preliminary-recommendation': 'предварительная рекомендация',
        unavailable: 'источник недоступен'
      }
    },
    storageRequestLabel: 'Включить оценку накопителя / резерва',
    storageRequestHelp:
      'Для точного подбора нужны данные о критической нагрузке и времени резерва.',
    inverterRecommendationTitle: 'Рекомендуемый инвертор',
    inverterRecommendationCopy:
      'Выбран для рассчитанной PV DC-мощности. Окончательную совместимость строк, MPPT и сети подтверждает инженер.',
    mountingHardwareTitle: 'Вариант крепления из каталога',
    mountingHardwareCopy:
      'Оптимум PVGIS: {optimum}° · доступные углы: {available}° · практический вариант из каталога: {practical}°',
    mountingHardwareReason: 'Выбран ближайший к оптимуму PVGIS поддерживаемый угол из каталога.',
    mountingHardwareDimensionsCopy: 'Комплект: {kit} мм · рельс: {rail} мм',
    mountingHardwareNoMatchCopy:
      'Оптимум PVGIS — {optimum}°, но в каталоге нет крепления с нормализованным поддерживаемым углом.',
    mountingHardwareEngineeringCopy:
      'Каталожный угол не меняет расчётную плоскость крыши. Конструкцию и ветровую нагрузку подтверждает инженер.',
    storageRecommendationTitle: 'Вариант накопления энергии',
    storageProfileRequiredCopy:
      'Накопитель необязателен. Для точного подбора нужны данные о критической нагрузке и времени резерва.',
    storageSizingCopy:
      'Требуемая полезная ёмкость: {required} кВт·ч · модулей: {modules} · выбранная полезная ёмкость: {selected} кВт·ч',
    storageSizingReason:
      'Целое число модулей округлено вверх, чтобы покрыть требуемую полезную ёмкость.',
    storageCapacityExceededCopy:
      'Требуемая полезная ёмкость превышает максимум системы в каталоге: {maximum} кВт·ч.',
    storageEngineeringCopy:
      'Окончательную совместимость, резервную мощность и схему подключения подтверждает инженер.',
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
    roofIntro:
      'Задайте площадь и параметры крыши, чтобы уточнить предварительную оценку солнечного потенциала.',
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
    surplusEnergy: 'Избыточная выработка',
    surplusCompensationUnavailableCopy:
      '{surplus} кВт·ч/год превышают годовое потребление. Денежная оценка избытка и окупаемость не показаны, пока не будет настроена подтверждённая ставка компенсации.',
    surplusCompensationValueCopy:
      'Избыточная выработка: {surplus} кВт·ч/год · компенсация: {value} AMD/год.',
    tariffNeeded: 'Хотите увидеть экономию и окупаемость? Укажите тариф из вашего счёта.',
    addTariff: 'Добавить тариф',
    openPassport: 'Открыть Solar Passport',
    passportTitle: 'Solar Passport',
    passportCopy: 'Предварительные данные этой сессии, источники и ограничения.',
    pdfReport: {
      download: 'Сохранить PDF-отчёт',
      title: 'Отчёт по солнечному расчёту',
      subtitle:
        'В отчёте собраны введённые данные, результаты расчёта и предварительные рекомендации.',
      preliminary: 'ПРЕДВАРИТЕЛЬНО',
      generated: 'Сформирован',
      reportId: 'ID отчёта',
      inputs: 'Введённые данные',
      results: 'Результаты расчёта',
      equipment: 'Рекомендуемое оборудование',
      finance: 'Финансовая оценка',
      sourcesTitle: 'Источники и допущения',
      monthly: 'Помесячная выработка',
      cashflow: 'Финансовый прогноз',
      limitations: 'Допущения и ограничения',
      property: 'Объект',
      coordinates: 'Координаты',
      consumption: 'Годовое потребление',
      monthlyConsumption: 'Помесячный профиль потребления',
      tariff: 'Тариф',
      storageRequest: 'Оценка накопителя',
      yes: 'Да',
      no: 'Нет',
      roof: 'Крыша',
      mounting: 'Способ установки',
      capacity: 'Мощность системы',
      panels: 'Панели',
      annualProduction: 'Годовая выработка',
      coverage: 'Покрытие потребления',
      coveredConsumption: 'Покрытое потребление',
      surplus: 'Избыточная выработка',
      annualSavings: 'Экономия в год',
      payback: 'Срок окупаемости',
      budget: 'Предварительный бюджет',
      module: 'Солнечный модуль',
      inverter: 'Инвертор',
      storage: 'Накопитель',
      co2: 'Сокращение CO₂',
      years: 'лет',
      twentyFiveYears: 'За 25 лет',
      unavailable: 'Недоступно',
      popupBlocked: 'Разрешите всплывающее окно в браузере, чтобы открыть PDF-отчёт.',
      footer:
        'Отчёт предварительный и не заменяет выезд инженера, инженерный проект или коммерческое предложение.'
    },
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
    calculationPanelLabel: 'Preliminary sizing basis',
    calculationPanelHelp:
      'The preliminary roof fit uses a catalog module footprint and rating. Equipment is shown with the result.',
    preliminarySizingBasis: 'Preliminary sizing basis',
    preliminarySizingBasisCopy:
      'The preliminary roof fit uses a catalog module footprint and rating.',
    roofCapacityTitle: 'Preliminary roof fit',
    roofAreaForSizing: 'Roof area used for sizing',
    preliminaryUsableRoofArea: 'Preliminary usable module area',
    maximumPanelsForRoof: 'Maximum with the preliminary sizing basis',
    roofCapacityPreview: 'Preliminary roof DC capacity: {capacity} kWp ({count} modules)',
    roofCapacityAssumption:
      'The preliminary estimate uses {ratio}% of the area for access paths and setbacks.',
    energyBalanceTitle: 'Energy balance',
    annualConsumption: 'Annual consumption',
    coveredConsumption: 'Covered consumption',
    retailOffsetSavings: 'Savings from covered consumption',
    retailOffsetSavingsCopy: '≈ {value} AMD/year',
    surplusValueUnavailable:
      'The surplus value is not included because no verified compensation rate is configured.',
    surplusCompensationValue: 'Surplus compensation',
    environmentalFactorSource: 'Historical grid-emission factor',
    moduleRecommendationTitle: 'Recommended solar module',
    moduleRecommendationCopy:
      '{quantity} modules × {watts} W = {capacity} kWp DC · physical area: {area} m²/module · total footprint: {footprint} m²',
    moduleRecommendationReason:
      'The catalog module count and rating produce the calculated DC capacity.',
    recommendedSystemTitle: 'Recommended system',
    recommendationPreliminary: 'Preliminary recommendation',
    viewProduct: 'View product',
    equipmentImageUnavailable: 'Product image unavailable',
    storageModules: 'modules',
    inverterTechnologyCopy: 'Technology: {technology}',
    gridTiedInverter: 'Grid-tied inverter',
    hybridInverter: 'Hybrid inverter',
    inverterExactVariantReason:
      'The selected AC variant exactly matches the calculated PV DC capacity.',
    inverterNextVariantReason:
      'The smallest available catalog AC variant not below the calculated PV DC capacity was selected.',
    equipmentPreliminaryCopy:
      'This selection is preliminary; an engineer confirms string design, electrical compatibility and site implementation.',
    calculationBasisTitle: 'Calculation basis',
    calculationBasis: {
      coordinates: 'Coordinates',
      regionalCoordinates: 'Regional reference point',
      solarYield: 'Solar yield',
      roof: 'Roof data',
      usableRoofRatio: 'Usable roof ratio',
      solarModule: 'Calculation solar module',
      inverter: 'Recommended inverter',
      storage: 'Storage option',
      mounting: 'Mounting option',
      tariff: 'Electricity tariff',
      surplusCompensation: 'Surplus compensation',
      noTariff: 'No tariff selected',
      noSurplusCompensation: 'No verified compensation rate is configured',
      systemLoss: 'System loss',
      sourceTypes: {
        'user-input': 'user input',
        'regional-reference': 'regional reference point',
        'pvgis-result': 'PVGIS result',
        'catalog-technical-value': 'catalog technical value',
        'calculator-assumption': 'calculator assumption',
        'registry-value': 'registry value',
        'preliminary-recommendation': 'preliminary recommendation',
        unavailable: 'source unavailable'
      }
    },
    storageRequestLabel: 'Include storage / backup review',
    storageRequestHelp: 'Exact sizing requires critical-load and backup-duration inputs.',
    inverterRecommendationTitle: 'Recommended inverter',
    inverterRecommendationCopy:
      'Selected for the calculated PV DC capacity. Final string, MPPT and grid compatibility is confirmed during engineering.',
    mountingHardwareTitle: 'Catalog mounting option',
    mountingHardwareCopy:
      'PVGIS optimum: {optimum}° · available mounting angles: {available}° · practical catalog option: {practical}°',
    mountingHardwareReason:
      'The catalog-supported inclination nearest the PVGIS optimum was selected.',
    mountingHardwareDimensionsCopy: 'Kit: {kit} mm · rail: {rail} mm',
    mountingHardwareNoMatchCopy:
      'PVGIS optimum is {optimum}°, but no catalog mounting option has a normalized supported angle.',
    mountingHardwareEngineeringCopy:
      'The catalog angle does not change the calculated roof plane. Structure and wind-load design are confirmed during engineering.',
    storageRecommendationTitle: 'Energy-storage option',
    storageProfileRequiredCopy:
      'Storage is optional. Exact battery sizing requires critical-load and backup-duration inputs.',
    storageSizingCopy:
      'Required usable: {required} kWh · modules: {modules} · selected usable: {selected} kWh',
    storageSizingReason:
      'A whole module count was rounded up to cover the required usable capacity.',
    storageCapacityExceededCopy:
      'The required usable capacity exceeds the catalog system maximum of {maximum} kWh.',
    storageEngineeringCopy:
      'Final compatibility, backup output and connection design are confirmed during engineering.',
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
    surplusEnergy: 'Surplus generation',
    surplusCompensationUnavailableCopy:
      '{surplus} kWh/year exceeds annual consumption. Its monetary value and payback are unavailable until a verified surplus-compensation rate is configured.',
    surplusCompensationValueCopy:
      'Surplus generation: {surplus} kWh/year · compensation value: {value} AMD/year.',
    tariffNeeded: 'Want to see savings and payback? Add the tariff from your bill.',
    addTariff: 'Add tariff',
    openPassport: 'Open Solar Passport',
    passportTitle: 'Solar Passport',
    passportCopy: 'This session’s preliminary inputs, sources and limitations.',
    pdfReport: {
      download: 'Save PDF report',
      title: 'Solar calculation report',
      subtitle:
        'This report brings together your inputs, calculation results and preliminary recommendations.',
      preliminary: 'PRELIMINARY',
      generated: 'Generated',
      reportId: 'Report ID',
      inputs: 'Your inputs',
      results: 'Calculation results',
      equipment: 'Recommended equipment',
      finance: 'Financial estimate',
      sourcesTitle: 'Sources and assumptions',
      monthly: 'Monthly generation',
      cashflow: 'Financial outlook',
      limitations: 'Assumptions and limitations',
      property: 'Property',
      coordinates: 'Coordinates',
      consumption: 'Annual consumption',
      monthlyConsumption: 'Monthly consumption profile',
      tariff: 'Tariff',
      storageRequest: 'Storage review',
      yes: 'Yes',
      no: 'No',
      roof: 'Roof',
      mounting: 'Mounting approach',
      capacity: 'System capacity',
      panels: 'Panels',
      annualProduction: 'Annual generation',
      coverage: 'Consumption coverage',
      coveredConsumption: 'Covered consumption',
      surplus: 'Surplus generation',
      annualSavings: 'Annual savings',
      payback: 'Payback period',
      budget: 'Preliminary budget',
      module: 'Solar module',
      inverter: 'Inverter',
      storage: 'Storage',
      co2: 'CO₂ reduction',
      years: 'years',
      twentyFiveYears: 'Over 25 years',
      unavailable: 'Unavailable',
      popupBlocked: 'Allow the browser pop-up to open the PDF report.',
      footer:
        'This report is preliminary and does not replace a site survey, engineering design or commercial offer.'
    },
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
