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
      title: 'Արևային համակարգի հաշվիչ Հայաստանում | YOURENERGY',
      description:
        'Ընտրեք տարածաշրջանն ու մուտքագրեք սպառումը՝ նախնական գնահատման համար, ապա ցանկության դեպքում ճշգրտեք այն տանիքով։',
      ogTitle: 'Արագ արևային հաշվիչ | YOURENERGY',
      ogDescription: 'Սկսեք երկու հասկանալի դաշտից։'
    },
    refineMeta: {
      title: 'Տանիքի ճշգրտում | YOURENERGY',
      description: 'Հաստատեք կետն ու մատչելի տանիքի տարածքը՝ նախնական հաշվարկը ճշգրտելու համար։',
      ogTitle: 'Ճշգրտել տանիքի գնահատումը | YOURENERGY',
      ogDescription: 'Քարտեզի ուրվագիծ կամ չափված տարածք։'
    },
    proMeta: {
      title: 'Պրոֆեսիոնալ արևային հաշվիչ | YOURENERGY',
      description: 'Արևային ռեսուրսի տվյալներ, տանիքի պարամետրեր և աղբյուրների թափանցիկ հաշվարկ։',
      ogTitle: 'Պրոֆեսիոնալ հաշվիչ | YOURENERGY',
      ogDescription: 'Մանրամասն նախնական վերլուծություն։'
    },
    quick: {
      eyebrow: 'Արագ նախնական գնահատում',
      title: 'Պարզեք՝ ինչ արևային համակարգ կարող է համապատասխանել Ձեր տանը',
      heroTitle: 'Արևային հաշվիչ',
      heroCopy:
        'Ընտրեք ռեժիմը, նշեք տարածաշրջանն ու միջին սպառումը և ստացեք արևային ռեսուրսի տվյալների հիման վրա նախնական գնահատում։',
      locationTitle: 'Տարածաշրջան',
      locationCopy: 'Ընտրեք տարածաշրջանը՝ նախնական արևային տվյալների համար',
      consumptionTitle: 'Էլեկտրաէներգիայի սպառում',
      consumptionCopy: 'Մուտքագրեք միջին ամսական հաշիվը կամ սպառումը',
      region: 'Տարածաշրջան',
      mode: 'Ինչ գիտեք սպառման մասին',
      bill: 'Միջին ամսական հաշիվ',
      usage: 'Միջին ամսական սպառում',
      billLabel: 'Միջին ամսական հաշիվ',
      usageLabel: 'Միջին ամսական սպառում',
      tariffLabel: 'Սակագինը հաշվարկի համար',
      tariffHelp:
        'Լռելյայն օգտագործվում է պաշտոնական ցերեկային սակագինը։ Եթե Ձեր փաստացի սակագինը տարբերվում է, փոխեք արժեքը։',
      refineTariff: 'Ճշտել սակագինը',
      officialTariff: 'Պաշտոնական սակագին',
      customTariff: 'Իմ սակագինը',
      userProvidedTariff: 'Օգտատիրոջ նշած սակագին',
      customerType: 'Սպառողի տեսակ',
      standardCustomer: 'Սովորական սպառող',
      socialVulnerable: 'Սոցիալապես անապահով սպառող',
      period: 'Ժամանակահատված',
      tariffDay: 'Ցերեկային',
      tariffNight: 'Գիշերային',
      chooseBracket: 'Ընտրեք սպառման միջակայքը',
      tariffSuggested: 'Որոշվել է Ձեր սպառման հիման վրա՝ {bracket}',
      customTariffHelp: 'Մուտքագրեք Ձեր փաստացի միջին սակագինը հաշվից։',
      mixedTariffHelp:
        'Եթե սպառման մի մասը հաշվարկվում է ցերեկային, իսկ մյուսը՝ գիշերային սակագնով, «Իմ սակագինը» ռեժիմում մուտքագրեք հաշվից փաստացի միջին սակագինը։',
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
      loading: 'Ստանում ենք տարածաշրջանային արևային տվյալները…',
      unavailable:
        'Արևային տվյալներն այս պահին հասանելի չեն։ Թվեր չենք փոխարինել օրինակով։ Փորձեք կրկին։',
      cacheNotConfigured:
        'Արևային հաշվարկը դեռ միացված չէ, քանի որ պաշտպանված ծառայության քեշը կարգավորված չէ։ Կապվեք ինժեների հետ։',
      providerNotConfigured:
        'Արևային հաշվարկի ծառայությունը դեռ կարգավորված չէ։ Կապվեք ինժեների հետ։',
      retry: 'Կրկնել արևային տվյալների հարցումը',
      regional: 'Տարածաշրջանային գնահատում',
      regionalCopy:
        'Արևային տվյալները վերաբերում են ընտրված տարածաշրջանի ներկայացուցչական կետին, ոչ թե Ձեր տան հասցեին կամ տանիքին։',
      resultsTitle: 'Ձեր նախնական արդյունքը',
      resultsCopy: 'Ընտրված տարածաշրջանի և Ձեր էլեկտրաէներգիայի սպառման հիման վրա։',
      capacity: 'Առաջարկվող հզորություն',
      panels: 'Վահանակների քանակ',
      generation: 'Սպասվող տարեկան արտադրություն',
      coverage: 'Սպառման ծածկույթ',
      approximately: '≈',
      kwhPerYear: 'kWh/տարի',
      amdPerYear: 'AMD/տարի',
      monthlyProduction: 'Կանխատեսվող ամսական արտադրություն',
      savings: 'Մոտավոր տարեկան խնայողություն',
      systemCost: 'Մոտավոր արժեք',
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
        success: {
          title: 'Շնորհակալություն։ Ձեր հայտը ուղարկված է։',
          text: 'Ինժեները շուտով կապ կհաստատի Ձեզ հետ։',
          close: 'Փակել'
        },
        unavailable: 'Հարցումը հիմա չի ուղարկվում։ Զանգահարեք ինժեներին՝ ստանալու համար առաջարկ։',
        invalid: 'Մուտքագրեք անուն և ճիշտ հեռախոսահամար։',
        close: 'Փակել'
      },
      disclaimer:
        'Տարածաշրջանային նախնական գնահատում։ Տանիքի տվյալները կարող եք ճշգրտել Պրոֆեսիոնալ ռեժիմում։',
      noTariff: 'Ավելացրեք սակագին՝ մոտավոր տարեկան խնայողությունը տեսնելու համար։',
      savingsUnavailable: 'Մոտավոր տարեկան խնայողությունը հասանելի չէ ընտրված սակագնի համար։',
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
      signature: 'Յուրովի տնօրինիր Քո արևը',
      noJs: 'JavaScript-ի բացակայության դեպքում զանգահարեք ինժեներին՝ նախնական խորհրդատվության համար։'
    },
    refine: {
      eyebrow: 'Տանիքի ճշգրտում',
      title: 'Ճշգրտեք գնահատումը Ձեր տան կետով և տանիքով',
      intro: 'Ընտրեք Ձեր տունը, ապա կամ ուրվագծեք մատչելի տանիքը, կամ մուտքագրեք չափված մակերեսը։',
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
        'Ճշգրտված հաշվարկն այժմ անհասանելի է։ Մուտքագրված տվյալները պահպանվում են այս աշխատաշրջանում։'
    },
    pro: {
      eyebrow: 'Պրոֆեսիոնալ ռեժիմ',
      title: 'Արևային պրոֆեսիոնալ հաշվիչ',
      intro:
        'Մանրամասն նախնական վերլուծություն՝ հասանելի պարամետրերով։ Պլանավորեք համակարգը քայլ առ քայլ։',
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
        intro: 'Ահա Ձեր տանիքի նախնական արևային ներուժը՝ ըստ մուտքագրված տվյալների։',
        restart: 'Սկսել նորից',
        potential: 'Առաջարկվող արևային համակարգ',
        heroLines: ['Ձեր արևային համակարգը', 'հասկանալի թվերով'],
        heroCopy:
          'Սկզբում՝ հիմնական ցուցանիշները, ապա՝ արտադրությունը, սարքավորումը և հաշվարկի մանրամասները։',
        monthlyProduction: 'Ամսական արևային արտադրություն',
        monthlyComparison: 'Ամսական սպառում՝ արևային արտադրության համեմատ',
        impactTitle: 'Ձեր բնապահպանական ազդեցությունը',
        overviewEyebrow: 'Առաջարկվող արևային համակարգ',
        overviewTitle: 'Ձեր տան համար առաջարկվում է արևային համակարգ',
        overviewCopy: 'Հաշվարկը հիմնված է Ձեր տեղադրության, տանիքի և սպառման տվյալների վրա։',
        editData: 'Փոխել տվյալները',
        roofStatus: 'Տանիքը հարմար է ընտրված համակարգի համար',
        equipmentTitle: 'Առաջարկվող սարքավորումներ',
        equipmentCopy: 'Նախնական ընտրություն․ վերջնական համատեղելիությունը կհաստատի ինժեները։',
        roofTitle: 'Տանիքի համապատասխանություն',
        roofCopy: 'Օգտակար մակերեսը բավարար է առաջարկվող համակարգի համար։',
        roofRecommended: 'Առաջարկվում է',
        roofMaximum: 'Տանիքի ֆիզիկական առավելագույնը',
        roofArea: 'Տանիքի մակերես',
        usableArea: 'Օգտակար մակերես',
        panelsUnit: 'պանել',
        upTo: 'մինչև',
        roofWhy: 'Ինչո՞ւ է առաջարկվող համակարգն ավելի փոքր։',
        totalAnnualProduction: 'Տարեկան ընդհանուր',
        financialDisclaimer: 'Սա նախնական գնահատում է, ոչ թե առևտրային առաջարկ։',
        financialTitle: 'Ֆինանսական արդյունք',
        financialCopy: 'Նախնական արժեքը, տարեկան խնայողությունը և հետգնման ժամկետը։',
        financial: {
          budget: 'Նախնական արժեքի միջակայք',
          central: 'Կենտրոնական գնահատական',
          payback: 'Հետգնման ժամկետ',
          twentyFiveYears: 'Ընդհանուր խնայողություն 25 տարում'
        },
        energy: {
          title: 'Էներգետիկ հաշվեկշիռ',
          solar: 'Արևից',
          grid: 'Մնացորդը ցանցից'
        },
        outcomesTitle: 'Ինչ է սա տալիս Ձեր տանը',
        potentialUnit: 'kWh/kWp տարեկան',
        annualGenerationUnit: 'kWh/տարի',
        calculationTitle: 'Ինչպես է հաշվարկվել այս գնահատումը',
        calculationCopy:
          'Մենք օգտագործել ենք արևային ռեսուրսի տվյալները, Ձեր տեղադրությունը, էլեկտրաէներգիայի սպառումը և տանիքի բնութագրերը՝ արևային ներուժը գնահատելու համար։',
        nextTitle: 'Հաջորդ քայլերը',
        nextCopy: 'Ձեր նախագիծն իրականացնելու համար՝',
        nextSteps: [
          {
            icon: 'faq-settings',
            title: 'Ինժեների ստուգում',
            copy: 'Տեղազննում, տանիքի և էլեկտրական պայմանների ստուգում։'
          },
          {
            icon: 'file-text',
            title: 'Սարքավորումների հաստատում',
            copy: 'Ճշգրիտ մոդելներ, համալրում և վերջնական գին։'
          },
          {
            icon: 'wrench',
            title: 'Վերջնական առաջարկ',
            copy: 'Մանրամասն հաշվարկ, պայմանագիր և հաջորդ քայլեր։'
          }
        ],
        offer: 'Ստանալ ճշգրիտ առաջարկ',
        downloadReport: 'Բացել տպման / PDF պատուհանը',
        editCalculation: 'Փոխել հաշվարկի տվյալները',
        metrics: {
          roofSpecificYield: 'Ձեր տանիքի գնահատված տեսակարար արտադրություն',
          recommendedPower: 'Առաջարկվող հզորություն',
          panelCount: 'Պանելների քանակ',
          annualProduction: 'Տարեկան արտադրություն',
          annualCoverage: 'Տարեկան սպառման ծածկույթ',
          annualSavings: 'Տարեկան խնայողություն',
          co2Reduction: 'CO₂ կրճատում տարեկան'
        },
        impact: { co2: 'CO₂ կրճատում տարեկան', trees: 'Ծառերի համարժեք' },
        benefitsLabel: 'Մեր հաշվարկի հիմքը',
        technologyTitle: 'Տեխնոլոգիաները, որոնք մենք օգտագործում ենք',
        technologyCopy:
          'Աղբյուրները և գործիքները միասին տալիս են ավելի թափանցիկ նախնական գնահատում։',
        privacyNote: 'Ձեր անձնական տվյալները չեն պահվում․ գաղտնիությունը կարևոր է մեզ համար։',
        benefits: [
          {
            icon: 'shield-check',
            title: 'Արևային ռեսուրսի տվյալներ',
            copy: 'Արևային ռեսուրսի տարեկան և ամսական գնահատում'
          },
          {
            icon: 'chart-bars',
            title: 'Համակարգի հաշվարկ',
            copy: 'Սպառումը, հզորությունը և պանելների քանակը դիտարկվում են միասին'
          },
          {
            icon: 'leaf',
            title: 'Սարքավորումների կատալոգ',
            copy: 'Նախնական առաջարկը հիմնված է իրական մոդելների վրա'
          },
          {
            icon: 'support',
            title: 'Ինժեներական ստուգում',
            copy: 'Մասնագետը հաստատում է վերջնական սխեման տեղազննությունից հետո'
          }
        ]
      },
      quick: 'Վերադառնալ արագ հաշվիչ'
    }
  },
  ru: {
    quickMeta: {
      title: 'Калькулятор солнечной системы в Армении | YOURENERGY',
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
      description:
        'Прозрачный расчёт с данными о солнечном ресурсе, параметрами крыши и источниками.',
      ogTitle: 'Профессиональный калькулятор | YOURENERGY',
      ogDescription: 'Детальный предварительный анализ.'
    },
    quick: {
      eyebrow: 'Быстрая предварительная оценка',
      title: 'Узнайте, какая солнечная система может подойти вашему дому',
      heroTitle: 'Солнечный калькулятор',
      heroCopy:
        'Выберите режим, регион и среднее потребление, чтобы получить предварительную оценку на основе данных о солнечном ресурсе.',
      locationTitle: 'Местоположение',
      locationCopy: 'Выберите регион для предварительных солнечных данных',
      consumptionTitle: 'Потребление электроэнергии',
      consumptionCopy: 'Введите средний счёт за месяц или потребление',
      region: 'Регион',
      mode: 'Что вы знаете о потреблении',
      bill: 'Средний счёт в месяц',
      usage: 'Среднее потребление в месяц',
      billLabel: 'Средний счёт в месяц',
      usageLabel: 'Среднее потребление в месяц',
      tariffLabel: 'Тариф для расчёта',
      tariffHelp:
        'По умолчанию используется официальный дневной тариф. Если ваш фактический тариф отличается, измените значение.',
      refineTariff: 'Уточнить тариф',
      officialTariff: 'Официальный тариф',
      customTariff: 'Свой тариф',
      userProvidedTariff: 'Тариф, указанный пользователем',
      customerType: 'Тип потребителя',
      standardCustomer: 'Обычный потребитель',
      socialVulnerable: 'Социально уязвимый потребитель',
      period: 'Период',
      tariffDay: 'Дневной',
      tariffNight: 'Ночной',
      chooseBracket: 'Выберите диапазон потребления',
      tariffSuggested: 'Определено по вашему потреблению: {bracket}',
      customTariffHelp: 'Введите фактический средний тариф из счёта.',
      mixedTariffHelp:
        'Если часть потребления идёт по дневному, а часть по ночному тарифу, в режиме «Свой тариф» укажите фактический средний тариф из счёта.',
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
      proAction: 'Перейти в профессиональный режим',
      waiting: 'Выберите регион и введите потребление.',
      loading: 'Получаем региональные солнечные данные…',
      unavailable:
        'Солнечные данные сейчас недоступны. Мы не подставили примерные цифры. Попробуйте снова.',
      cacheNotConfigured:
        'Солнечный расчёт ещё не включён: защищённый кэш сервиса не настроен. Свяжитесь с инженером.',
      providerNotConfigured: 'Сервис солнечного расчёта ещё не настроен. Свяжитесь с инженером.',
      retry: 'Повторить запрос солнечных данных',
      regional: 'Региональная оценка',
      regionalCopy:
        'Солнечные данные относятся к представительской точке выбранного региона, а не к вашему адресу или крыше.',
      resultsTitle: 'Ваш предварительный результат',
      resultsCopy: 'На основе выбранного региона и вашего потребления электроэнергии.',
      capacity: 'Рекомендуемая мощность',
      panels: 'Количество панелей',
      generation: 'Ожидаемая выработка',
      coverage: 'Покрытие потребления',
      approximately: '≈',
      kwhPerYear: 'kWh/год',
      amdPerYear: 'AMD/год',
      monthlyProduction: 'Расчётная выработка по месяцам',
      savings: 'Ориентировочная экономия',
      systemCost: 'Ориентировочная стоимость',
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
        success: {
          title: 'Спасибо! Ваша заявка отправлена.',
          text: 'Инженер скоро свяжется с вами.',
          close: 'Закрыть'
        },
        unavailable:
          'Сейчас запрос не отправляется. Позвоните инженеру, чтобы получить предложение.',
        invalid: 'Введите имя и корректный номер телефона.',
        close: 'Закрыть'
      },
      disclaimer:
        'Предварительная региональная оценка. Параметры крыши можно уточнить в Профессиональном режиме.',
      noTariff: 'Добавьте тариф, чтобы увидеть ориентировочную годовую экономию.',
      savingsUnavailable: 'Ориентировочная годовая экономия недоступна для выбранного тарифа.',
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
      intro:
        'Подробный предварительный анализ по доступным параметрам. Планируйте систему шаг за шагом.',
      steps: ['Местоположение', 'Потребление', 'Крыша', 'Результаты'],
      locationTitle: 'Местоположение',
      locationCopy:
        'Найдите адрес, выберите объект на карте или используйте текущее местоположение.',
      searchAddress: 'Найти адрес',
      useCurrentLocation: 'Использовать текущее местоположение',
      addressSearchHint: 'Введите не менее 3 символов адреса.',
      addressSearching: 'Ищем адрес…',
      addressResults: 'Выберите подходящий адрес',
      addressNoResults: 'Адрес не найден. Выберите точку на карте.',
      addressSearchUnavailable: 'Поиск адреса сейчас недоступен. Выберите точку на карте.',
      currentLocationLoading: 'Определяем текущее местоположение…',
      currentLocationUnavailable:
        'Не удалось определить текущее местоположение. Разрешите доступ к геопозиции или выберите точку на карте.',
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
        intro: 'Вот предварительная оценка солнечного потенциала вашей крыши по введённым данным.',
        restart: 'Начать заново',
        potential: 'Рекомендуемая солнечная система',
        heroLines: ['Ваша солнечная система', 'в понятных цифрах'],
        heroCopy: 'Сначала — главные показатели, затем выработка, оборудование и детали расчёта.',
        monthlyProduction: 'Солнечная выработка по месяцам',
        monthlyComparison: 'Помесячное потребление и солнечная выработка',
        impactTitle: 'Ваш вклад в окружающую среду',
        overviewEyebrow: 'Рекомендуемая солнечная система',
        overviewTitle: 'Для вашего дома рекомендуется солнечная система',
        overviewCopy: 'Расчёт основан на данных о местоположении, крыше и потреблении.',
        editData: 'Изменить данные',
        roofStatus: 'Крыша подходит для выбранной системы',
        equipmentTitle: 'Рекомендуемое оборудование',
        equipmentCopy: 'Предварительный подбор. Окончательную совместимость подтвердит инженер.',
        roofTitle: 'Соответствие крыши',
        roofCopy: 'Полезной площади достаточно для выбранной системы.',
        roofRecommended: 'Рекомендуется',
        roofMaximum: 'Физический максимум крыши',
        roofArea: 'Площадь крыши',
        usableArea: 'Полезная площадь',
        panelsUnit: 'панелей',
        upTo: 'до',
        roofWhy: 'Почему рекомендуемая система меньше?',
        totalAnnualProduction: 'Всего за год',
        financialDisclaimer: 'Это предварительная оценка, а не коммерческое предложение.',
        financialTitle: 'Финансовый результат',
        financialCopy: 'Предварительная стоимость, годовая экономия и срок окупаемости.',
        financial: {
          budget: 'Предварительный диапазон стоимости',
          central: 'Ориентировочная цена',
          payback: 'Срок окупаемости',
          twentyFiveYears: 'Выгода за 25 лет'
        },
        energy: {
          title: 'Энергетический баланс',
          solar: 'От солнца',
          grid: 'Останется из сети'
        },
        outcomesTitle: 'Что это даёт вашему дому',
        potentialUnit: 'kWh/kWp в год',
        annualGenerationUnit: 'kWh/год',
        calculationTitle: 'Как рассчитана эта оценка',
        calculationCopy:
          'Мы использовали данные о солнечном ресурсе, местоположение, потребление электроэнергии и характеристики крыши, чтобы оценить солнечный потенциал.',
        nextTitle: 'Следующие шаги',
        nextCopy: 'Чтобы перейти к реализации вашего проекта:',
        nextSteps: [
          {
            icon: 'faq-settings',
            title: 'Проверка инженером',
            copy: 'Выезд на объект, проверка крыши и электрических условий.'
          },
          {
            icon: 'file-text',
            title: 'Подтверждение оборудования',
            copy: 'Точные модели, комплектация и финальная цена.'
          },
          {
            icon: 'wrench',
            title: 'Финальное предложение',
            copy: 'Детальный расчёт, договор и следующие шаги.'
          }
        ],
        offer: 'Получить точное предложение',
        downloadReport: 'Открыть окно печати / PDF',
        editCalculation: 'Изменить данные расчёта',
        metrics: {
          roofSpecificYield: 'Расчётная удельная выработка вашей крыши',
          recommendedPower: 'Рекомендуемая мощность',
          panelCount: 'Количество панелей',
          annualProduction: 'Годовая выработка',
          annualCoverage: 'Годовое покрытие потребления',
          annualSavings: 'Расчётная экономия в год',
          co2Reduction: 'Снижение CO₂ в год'
        },
        impact: { co2: 'Снижение CO₂ в год', trees: 'Эквивалент деревьев' },
        benefitsLabel: 'Основа расчёта',
        technologyTitle: 'Технологии, которые мы используем',
        technologyCopy:
          'Источники данных и инструменты работают вместе, чтобы сделать предварительную оценку прозрачной.',
        privacyNote: 'Мы не храним ваши личные данные: конфиденциальность важна для нас.',
        benefits: [
          {
            icon: 'shield-check',
            title: 'Данные о солнечном ресурсе',
            copy: 'Годовая и месячная оценка солнечного ресурса'
          },
          {
            icon: 'chart-bars',
            title: 'Расчёт системы',
            copy: 'Потребление, мощность и количество панелей рассматриваются вместе'
          },
          {
            icon: 'leaf',
            title: 'Каталог оборудования',
            copy: 'Предварительная рекомендация опирается на реальные модели'
          },
          {
            icon: 'support',
            title: 'Инженерная проверка',
            copy: 'Специалист подтверждает финальную схему после осмотра объекта'
          }
        ]
      },
      quick: 'Вернуться к быстрому калькулятору'
    }
  },
  en: {
    quickMeta: {
      title: 'Solar System Calculator in Armenia | YOURENERGY',
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
      description:
        'A transparent calculation using solar-resource data, roof parameters and sources.',
      ogTitle: 'Professional calculator | YOURENERGY',
      ogDescription: 'Detailed preliminary analysis.'
    },
    quick: {
      eyebrow: 'Quick preliminary estimate',
      title: 'See what solar system may suit your home',
      heroTitle: 'Solar Calculator',
      heroCopy:
        'Choose a mode, region and average consumption to get a preliminary estimate based on solar-resource data.',
      locationTitle: 'Location',
      locationCopy: 'Select a region for preliminary solar data',
      consumptionTitle: 'Electricity consumption',
      consumptionCopy: 'Enter your average monthly bill or consumption',
      region: 'Region',
      mode: 'What do you know about consumption?',
      bill: 'Average monthly bill',
      usage: 'Average monthly consumption',
      billLabel: 'Average monthly bill',
      usageLabel: 'Average monthly consumption',
      tariffLabel: 'Tariff for calculation',
      tariffHelp:
        'The official daytime tariff is used by default. Change the value if your actual tariff is different.',
      refineTariff: 'Refine tariff',
      officialTariff: 'Official tariff',
      customTariff: 'My tariff',
      userProvidedTariff: 'User-provided tariff',
      customerType: 'Customer type',
      standardCustomer: 'Standard consumer',
      socialVulnerable: 'Socially vulnerable consumer',
      period: 'Period',
      tariffDay: 'Daytime',
      tariffNight: 'Nighttime',
      chooseBracket: 'Choose consumption range',
      tariffSuggested: 'Determined from your consumption: {bracket}',
      customTariffHelp: 'Enter the actual average tariff from your bill.',
      mixedTariffHelp:
        'If some consumption is billed at daytime and some at nighttime rates, enter the actual average tariff from your bill in “My tariff” mode.',
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
      proAction: 'Switch to professional mode',
      waiting: 'Choose a region and enter consumption.',
      loading: 'Getting regional solar data…',
      unavailable:
        'Solar data is unavailable right now. We did not substitute example figures. Try again.',
      cacheNotConfigured:
        'Solar calculation is not enabled yet because the protected service cache is not configured. Contact an engineer.',
      providerNotConfigured:
        'The solar calculation service is not configured yet. Contact an engineer.',
      retry: 'Retry solar-data request',
      regional: 'Regional estimate',
      regionalCopy:
        'The solar data applies to a representative point in the selected region, not to your address or roof.',
      resultsTitle: 'Your preliminary result',
      resultsCopy: 'Based on the selected region and your electricity consumption.',
      capacity: 'Recommended power',
      panels: 'Panel count',
      generation: 'Expected production',
      coverage: 'Consumption coverage',
      approximately: '≈',
      kwhPerYear: 'kWh/year',
      amdPerYear: 'AMD/year',
      monthlyProduction: 'Estimated monthly production',
      savings: 'Estimated annual savings',
      systemCost: 'Estimated system cost',
      refine: 'Refine with my roof',
      contact: 'Get a proposal',
      phone: 'Call an engineer',
      lead: {
        eyebrow: 'Your preliminary estimate',
        title: 'Get a proposal',
        copy: 'Leave your contact details and an engineer will receive a short summary of this preliminary calculation.',
        name: 'Name',
        phone: 'Phone',
        comment: 'Comment',
        submit: 'Send request',
        loading: 'Sending your request…',
        success: {
          title: 'Thank you! Your request has been sent.',
          text: 'An engineer will contact you shortly.',
          close: 'Close'
        },
        unavailable: 'Your request cannot be sent right now. Call an engineer to get a proposal.',
        invalid: 'Enter your name and a valid phone number.',
        close: 'Close'
      },
      disclaimer:
        'Preliminary regional estimate. Roof parameters can be refined in Professional mode.',
      noTariff: 'Add a tariff to see estimated annual savings.',
      savingsUnavailable: 'Estimated annual savings are not available for the selected tariff.',
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
        'The refined calculation is unavailable right now. Your entered data remains available in this browser session.'
    },
    pro: {
      eyebrow: 'Professional mode',
      title: 'Professional Solar Calculator',
      intro:
        'Detailed preliminary analysis using the available parameters. Plan your system step by step.',
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
        intro: 'Here is the preliminary solar potential of your roof based on the inputs provided.',
        restart: 'Start over',
        potential: 'Recommended solar system',
        heroLines: ['Your solar system', 'in clear numbers'],
        heroCopy:
          'Start with the key figures, then review generation, equipment and the calculation details.',
        monthlyProduction: 'Monthly solar production',
        monthlyComparison: 'Monthly consumption vs solar production',
        impactTitle: 'Your environmental impact',
        overviewEyebrow: 'Recommended solar system',
        overviewTitle: 'Recommended solar system for your home',
        overviewCopy: 'Calculated from your location, roof and consumption inputs.',
        editData: 'Edit details',
        roofStatus: 'Roof is suitable for the selected system',
        equipmentTitle: 'Recommended equipment',
        equipmentCopy: 'Preliminary selection. Final compatibility is confirmed by an engineer.',
        roofTitle: 'Roof compatibility',
        roofCopy: 'The usable roof area is sufficient for the selected system.',
        roofRecommended: 'Recommended',
        roofMaximum: 'Physical roof maximum',
        roofArea: 'Roof area',
        usableArea: 'Usable area',
        panelsUnit: 'panels',
        upTo: 'up to',
        roofWhy: 'Why is the recommended system smaller?',
        totalAnnualProduction: 'Annual total',
        financialDisclaimer: 'This is a preliminary estimate, not a commercial offer.',
        financialTitle: 'Financial result',
        financialCopy: 'A preliminary cost, annual savings and simple payback view.',
        financial: {
          budget: 'Preliminary cost range',
          central: 'Estimated cost',
          payback: 'Payback period',
          twentyFiveYears: '25-year value'
        },
        energy: {
          title: 'Energy balance',
          solar: 'From solar',
          grid: 'Remaining from grid'
        },
        outcomesTitle: 'What this means for your home',
        potentialUnit: 'kWh/kWp per year',
        annualGenerationUnit: 'kWh/year',
        calculationTitle: 'How this estimate was calculated',
        calculationCopy:
          'We used solar-resource data, your location, electricity consumption and roof characteristics to estimate your solar potential.',
        nextTitle: 'Next steps',
        nextCopy: 'To move your project into delivery:',
        nextSteps: [
          {
            icon: 'faq-settings',
            title: 'Engineer review',
            copy: 'A site visit checks the roof and electrical conditions.'
          },
          {
            icon: 'file-text',
            title: 'Equipment confirmation',
            copy: 'Exact models, configuration and final price.'
          },
          {
            icon: 'wrench',
            title: 'Final proposal',
            copy: 'Detailed estimate, agreement and next steps.'
          }
        ],
        offer: 'Get an accurate proposal',
        downloadReport: 'Open print / PDF view',
        editCalculation: 'Edit calculation details',
        metrics: {
          roofSpecificYield: 'Estimated specific yield for your roof',
          recommendedPower: 'Recommended power',
          panelCount: 'Panel count',
          annualProduction: 'Annual production',
          annualCoverage: 'Annual consumption coverage',
          annualSavings: 'Estimated annual savings',
          co2Reduction: 'CO₂ reduction per year'
        },
        impact: { co2: 'CO₂ reduction per year', trees: 'Trees equivalent' },
        benefitsLabel: 'What powers the estimate',
        technologyTitle: 'Technologies we use',
        technologyCopy:
          'Connected data sources and tools make the preliminary estimate easier to understand and verify.',
        privacyNote: 'We do not store your personal data; your privacy matters to us.',
        benefits: [
          {
            icon: 'shield-check',
            title: 'Solar-resource data',
            copy: 'Annual and monthly solar-resource estimates'
          },
          {
            icon: 'chart-bars',
            title: 'System sizing',
            copy: 'Consumption, capacity and panel count are considered together'
          },
          {
            icon: 'leaf',
            title: 'Equipment catalogue',
            copy: 'Preliminary recommendations use real product models'
          },
          {
            icon: 'support',
            title: 'Engineering review',
            copy: 'A specialist confirms the final configuration after a site review'
          }
        ]
      },
      quick: 'Back to quick calculator'
    }
  }
};

export const calculatorModes = Object.freeze(common);
export const regionLabels = Object.freeze(regions);
