/**
 * Copy used only by the two P1 utility routes. Keeping it separate from the
 * homepage dictionary makes the tools independently publishable while the
 * shared generator still provides their canonical and language metadata.
 */
const tools = {
  hy: {
    calculator: {
      meta: {
        title: 'Արևային հաշվիչ՝ սպառումից մինչև տանիքի վերլուծություն | YOURENERGY',
        description:
          'Սկսեք ձեր Solar Passport-ը սպառման տվյալներից, ապա հաստատեք կետն ու տանիքի ուրվագիծը իրական PVGIS նախնական վերլուծության համար։',
        ogTitle: 'Սկսեք ձեր արևային հաշվարկը | YOURENERGY',
        ogDescription: 'Մուտքագրեք սպառումը և շարունակեք կետի ու տանիքի հաստատմանը։'
      },
      label: 'Արևային հաշվիչ',
      referenceTitle: 'Solar Passport',
      title: 'Սկսեք Solar Passport-ը ձեր սպառումից',
      intro:
        'Մուտքագրված տվյալները պահվում են միայն այս դիտարկչի ընթացիկ նստաշրջանում, որպեսզի գլխավոր հաշվիչում շարունակեք կետի, տանիքի և PVGIS-ի քայլերով։',
      principles: [
        'Առանց հասցեի «պատրաստի» արդյունքի',
        'Տանիքն ու տեղադրությունը հաստատվում են հաջորդ քայլում',
        'Խնայողությունը հաշվարկվում է միայն հաստատված կամ ձեր մուտքագրած սակագնով'
      ],
      formTitle: 'Սպառման տվյալներ',
      addressLabel: 'Օբյեկտի հասցե',
      addressHelp: 'Ընտրովի է այս քայլում․ հաջորդ էջում կարող եք որոնել կամ կետ դնել քարտեզի վրա։',
      addressPlaceholder: 'Օրինակ՝ Աբովյան, Հայաստան',
      consumptionLegend: 'Ինչ տվյալ ունեք',
      monthlyKwhLabel: 'Միջին ամսական սպառում',
      monthlyKwhHelp: 'Եթե ձեր հաշվում տեսնում եք kWh-ը, մուտքագրեք այն այստեղ։',
      billLabel: 'Միջին ամսական հաշիվ',
      billHelp: 'Եթե գիտեք միայն հաշվի գումարը, նշեք նաև սակագինը։',
      tariffLabel: 'Սակագին ձեր հաշվից',
      tariffHelp:
        'Օգտագործվում է միայն հաշիվը kWh-ի փոխարկելու և հետագա խնայողությունը բացատրելու համար։',
      unitKwh: 'kWh / ամիս',
      unitAmd: '֏ / ամիս',
      unitTariff: '֏ / kWh',
      or: 'կամ',
      submit: 'Շարունակել կետի և տանիքի հաստատմանը',
      invalid:
        'Մուտքագրեք միջին սպառումը կամ հաշվի գումարը, իսկ հաշվի համար՝ նաև զրոյից մեծ սակագին։',
      stored:
        'Տվյալները պահպանվել են այս դիտարկչի ընթացիկ նստաշրջանում։ Շարունակվում ենք լիարժեք հաշվիչին։',
      storageUnavailable:
        'Այս դիտարկիչում տեղային պահեստը հասանելի չէ։ Բացեք լիարժեք հաշվիչը և մուտքագրեք տվյալները այնտեղ։',
      noJsTitle: 'Դիտարկչում JavaScript-ը միացված չէ',
      noJsCopy:
        'Բացեք լիարժեք հաշվիչը՝ ձեռքով մուտքագրելու սպառումը, տեղադրության կետը և տանիքի ուրվագիծը։',
      noJsCta: 'Բացել լիարժեք հաշվիչը',
      honestNote:
        'Այս էջը չի ստեղծում արտադրության, խնայողության կամ արժեքի արդյունք։ Դրանք պահանջում են հաստատված կետ, տանիքի տվյալներ և PVGIS-ի պատասխան։'
    },
    offerChecker: {
      meta: {
        title: 'Ստուգել արևային համակարգի առաջարկը | YOURENERGY',
        description:
          'Համեմատեք այլ առաջարկի AMD/Wp ցուցանիշը ժամանակավոր ստանդարտ բնակելի միջակայքի հետ՝ առանց կոնտակտների հավաքման։',
        ogTitle: 'Ստուգեք արևային համակարգի առաջարկը | YOURENERGY',
        ogDescription:
          'Թափանցիկ AMD/Wp համեմատություն՝ կազմի ստուգմամբ, առանց անձնական տվյալների հավաքման։'
      },
      label: 'Առաջարկի ստուգիչ',
      title: 'Ստուգեք՝ արդյոք առաջարկը համեմատելի է',
      intro:
        'Մենք հաշվում ենք միայն առաջարկի AMD/Wp-ը և այն համեմատում ենք ժամանակավոր YOUR ENERGY բնակելի շրջանակի հետ։ Այս գործիքը ոչ գին է նշանակում, ոչ առաջարկ է փոխարինում։',
      privacy: 'Կոնտակտային և անձնական տվյալներ չեն հավաքվում։',
      formTitle: 'Այլ մատակարարի առաջարկի տվյալներ',
      totalLabel: 'Առաջարկի ընդհանուր գին',
      capacityLabel: 'Համակարգի հզորություն',
      regionLabel: 'Տարածք',
      regionArmenia: 'Հայաստան',
      systemLabel: 'Համակարգի տեսակ',
      systemGrid: 'Ցանցային՝ առանց մարտկոցի',
      systemBattery: 'Մարտկոցով',
      systemOther: 'Այլ / անհայտ',
      scopeLegend: 'Նշեք միայն առաջարկում հստակ ներառված կետերը',
      scopeHelp: 'Եթե հիմնական որևէ կետը բացակայում կամ հստակ չէ, գնի եզրակացություն չենք անում։',
      scope: {
        panels: 'Արևային վահանակներ',
        inverter: 'Ինվերտոր',
        mounting: 'Կրող կառուցվածք',
        installation: 'Ստանդարտ տեղադրում',
        grid: 'Հիմնական ցանցային միացում',
        battery: 'Մարտկոցը ներառված է'
      },
      submit: 'Համեմատել առաջարկը',
      reset: 'Մաքրել',
      referenceTitle: 'Ժամանակավոր ստանդարտ միջակայք',
      referenceCopy:
        'YOUR ENERGY-ի ժամանակավոր գների գրքույկ v0.1 է՝ ոչ օֆերտա։ Այն կիրառելի է միայն նշված ժամկետի ընթացքում և պահանջում է տեղազննում։',
      resultTitle: 'Ստուգման արդյունք',
      resultAwaiting: 'Լրացրեք տվյալները և սեղմեք «Համեմատել առաջարկը»։',
      status: {
        'below-range': 'Ստորին միջակայքից ցածր',
        'within-range': 'Միջակայքում է',
        'above-range': 'Վերին միջակայքից բարձր',
        'not-comparable': 'Չի համեմատվում'
      },
      resultRate: 'Առաջարկի գին մեկ Wp-ի համար',
      resultRange: 'Համեմատական միջակայք',
      resultWhy: 'Ինչու եզրակացություն չկա',
      resultQuestions: 'Հարցեր մատակարարին',
      invalid: 'Մուտքագրեք զրոյից մեծ գին և հզորություն։',
      notComparable:
        'Մարտկոցով, այլ տեսակի կամ թերի կազմով առաջարկը չի համեմատվում այս ստանդարտ ցանցային միջակայքի հետ։',
      engineeringCta: 'Ստանալ ինժեների ստուգում',
      noJsTitle: 'Ձեռքով ստուգման տարբերակ',
      noJsCopy:
        'JavaScript-ի բացակայության դեպքում կարող եք զանգահարել ինժեներին և պատրաստել առաջարկի գինը, kWp-ը ու կազմը։',
      expiry: 'Ժամանակավոր միջակայքի ժամկետն անցել է․ պահանջեք տեղազննում, ոչ թե հնացած գին։'
    },
    shared: {
      home: 'Գլխավոր էջ',
      calculator: 'Արևային հաշվիչ',
      offerChecker: 'Առաջարկի ստուգիչ',
      phone: 'Զանգել ինժեներին',
      language: 'Լեզվի ընտրություն',
      primaryNav: 'Հիմնական նավիգացիա',
      mobileNav: 'Բջջային նավիգացիա',
      menu: 'Բացել նավիգացիոն ցանկը',
      skip: 'Անցնել հիմնական բովանդակությանը',
      footer: 'YOURENERGY · բնակելի արևային համակարգերի նախնական, թափանցիկ գործիքներ Հայաստանում։'
    }
  },
  ru: {
    calculator: {
      meta: {
        title: 'Калькулятор солнечной системы: от потребления к анализу крыши | YOURENERGY',
        description:
          'Начните Solar Passport с данных о потреблении, затем подтвердите точку и контур крыши для реального предварительного анализа PVGIS.',
        ogTitle: 'Начните расчёт солнечной системы | YOURENERGY',
        ogDescription: 'Укажите потребление и продолжите к подтверждению точки и крыши.'
      },
      label: 'Солнечный калькулятор',
      referenceTitle: 'Solar Passport',
      title: 'Начните Solar Passport с вашего потребления',
      intro:
        'Данные остаются только в текущей сессии браузера, чтобы вы продолжили на главном калькуляторе с подтверждением точки, крыши и PVGIS.',
      principles: [
        'Без «готового» результата только по адресу',
        'Точка и крыша подтверждаются на следующем шаге',
        'Экономия рассчитывается лишь с подтверждённым или введённым вами тарифом'
      ],
      formTitle: 'Данные о потреблении',
      addressLabel: 'Адрес объекта',
      addressHelp:
        'Необязателен на этом шаге: далее можно найти адрес или поставить точку на карте.',
      addressPlaceholder: 'Например: Абовян, Армения',
      consumptionLegend: 'Какие данные у вас есть',
      monthlyKwhLabel: 'Среднее потребление в месяц',
      monthlyKwhHelp: 'Если в счёте есть kWh, укажите это значение.',
      billLabel: 'Средний счёт за месяц',
      billHelp: 'Если известна только сумма счёта, также укажите тариф.',
      tariffLabel: 'Тариф из вашего счёта',
      tariffHelp: 'Он нужен только для перевода счёта в kWh и прозрачного расчёта экономии дальше.',
      unitKwh: 'kWh / месяц',
      unitAmd: '֏ / месяц',
      unitTariff: '֏ / kWh',
      or: 'или',
      submit: 'Продолжить к точке и контуру крыши',
      invalid:
        'Укажите среднее потребление или сумму счёта; для счёта также нужен тариф больше нуля.',
      stored:
        'Данные сохранены только в текущей сессии браузера. Переходим к полному калькулятору.',
      storageUnavailable:
        'Локальное хранилище недоступно в этом браузере. Откройте полный калькулятор и укажите данные там.',
      noJsTitle: 'JavaScript отключён в браузере',
      noJsCopy:
        'Откройте полный калькулятор, чтобы вручную указать потребление, точку объекта и контур крыши.',
      noJsCta: 'Открыть полный калькулятор',
      honestNote:
        'Эта страница не выдаёт генерацию, экономию или цену. Для них нужны подтверждённая точка, данные крыши и ответ PVGIS.'
    },
    offerChecker: {
      meta: {
        title: 'Проверка предложения на солнечную систему | YOURENERGY',
        description:
          'Сравните AMD/Wp стороннего предложения с временным стандартным диапазоном для частного дома без сбора контактов.',
        ogTitle: 'Проверьте предложение на солнечную систему | YOURENERGY',
        ogDescription:
          'Прозрачное сравнение AMD/Wp с проверкой состава, без сбора персональных данных.'
      },
      label: 'Проверка предложения',
      title: 'Проверьте, можно ли сопоставить предложение',
      intro:
        'Мы считаем только AMD/Wp предложения и сопоставляем его с временным residential-диапазоном YOUR ENERGY. Инструмент не назначает цену и не заменяет коммерческое предложение.',
      privacy: 'Мы не собираем контактные или персональные данные.',
      formTitle: 'Данные предложения другого поставщика',
      totalLabel: 'Полная стоимость предложения',
      capacityLabel: 'Мощность системы',
      regionLabel: 'Регион',
      regionArmenia: 'Армения',
      systemLabel: 'Тип системы',
      systemGrid: 'Сетевая, без батареи',
      systemBattery: 'С батареей',
      systemOther: 'Другое / неизвестно',
      scopeLegend: 'Отметьте только позиции, явно включённые в предложение',
      scopeHelp: 'Если основной пункт отсутствует или неясен, ценовой вывод не показывается.',
      scope: {
        panels: 'Солнечные панели',
        inverter: 'Инвертор',
        mounting: 'Крепёжная система',
        installation: 'Стандартный монтаж',
        grid: 'Базовое подключение к сети',
        battery: 'Включена батарея'
      },
      submit: 'Сравнить предложение',
      reset: 'Очистить',
      referenceTitle: 'Временный стандартный диапазон',
      referenceCopy:
        'Это временный прайсбук YOUR ENERGY v0.1, а не оферта. Он действует только до указанной даты и требует обследования объекта.',
      resultTitle: 'Результат проверки',
      resultAwaiting: 'Заполните данные и нажмите «Сравнить предложение».',
      status: {
        'below-range': 'Ниже диапазона',
        'within-range': 'В диапазоне',
        'above-range': 'Выше диапазона',
        'not-comparable': 'Несопоставимо'
      },
      resultRate: 'Цена предложения за Wp',
      resultRange: 'Сопоставимый диапазон',
      resultWhy: 'Почему нет ценового вывода',
      resultQuestions: 'Что спросить у поставщика',
      invalid: 'Укажите цену и мощность больше нуля.',
      notComparable:
        'Предложение с батареей, другим типом системы или неполным составом не сравнивается с этим стандартным сетевым диапазоном.',
      engineeringCta: 'Получить инженерную проверку',
      noJsTitle: 'Вариант без JavaScript',
      noJsCopy:
        'Если JavaScript отключён, позвоните инженеру и подготовьте цену, kWp и состав предложения.',
      expiry:
        'Срок временного диапазона истёк: запросите обследование, а не ориентируйтесь на устаревшую цену.'
    },
    shared: {
      home: 'Главная',
      calculator: 'Калькулятор',
      offerChecker: 'Проверка КП',
      phone: 'Позвонить инженеру',
      language: 'Выбор языка',
      primaryNav: 'Основная навигация',
      mobileNav: 'Мобильная навигация',
      menu: 'Открыть навигационное меню',
      skip: 'Перейти к основному содержанию',
      footer:
        'YOURENERGY · прозрачные предварительные инструменты для домашних солнечных систем в Армении.'
    }
  },
  en: {
    calculator: {
      meta: {
        title: 'Solar calculator: from consumption to roof analysis | YOURENERGY',
        description:
          'Start a Solar Passport with consumption data, then confirm the property point and roof outline for a real preliminary PVGIS analysis.',
        ogTitle: 'Start your solar calculation | YOURENERGY',
        ogDescription: 'Enter consumption and continue to property-point and roof confirmation.'
      },
      label: 'Solar calculator',
      referenceTitle: 'Solar Passport',
      title: 'Start your Solar Passport with consumption',
      intro:
        'The details stay in this browser session only, so you can continue in the full calculator with property-point, roof and PVGIS confirmation.',
      principles: [
        'No “ready” result from an address alone',
        'The property point and roof are confirmed in the next step',
        'Savings are calculated only with a confirmed or user-entered tariff'
      ],
      formTitle: 'Consumption details',
      addressLabel: 'Property address',
      addressHelp:
        'Optional at this step. On the next page you can search it or place a point on the map.',
      addressPlaceholder: 'For example: Abovyan, Armenia',
      consumptionLegend: 'What information do you have?',
      monthlyKwhLabel: 'Average monthly consumption',
      monthlyKwhHelp: 'Enter this if your bill shows kWh.',
      billLabel: 'Average monthly bill',
      billHelp: 'If you only know the bill amount, enter your tariff too.',
      tariffLabel: 'Tariff from your bill',
      tariffHelp:
        'It is used only to convert a bill to kWh and explain later savings transparently.',
      unitKwh: 'kWh / month',
      unitAmd: '֏ / month',
      unitTariff: '֏ / kWh',
      or: 'or',
      submit: 'Continue to property point and roof',
      invalid:
        'Enter average consumption or a bill amount; a bill amount also requires a tariff above zero.',
      stored:
        'Your entries were saved only for this browser session. Continuing to the full calculator.',
      storageUnavailable:
        'Local storage is unavailable in this browser. Open the full calculator and enter the details there.',
      noJsTitle: 'JavaScript is disabled in this browser',
      noJsCopy:
        'Open the full calculator to enter consumption, a property point and a roof outline manually.',
      noJsCta: 'Open the full calculator',
      honestNote:
        'This page does not produce generation, savings or a price. Those require a confirmed point, roof data and a PVGIS response.'
    },
    offerChecker: {
      meta: {
        title: 'Solar proposal checker | YOURENERGY',
        description:
          'Compare the AMD/Wp of a third-party solar proposal to a temporary standard residential range without collecting contact details.',
        ogTitle: 'Check a solar proposal | YOURENERGY',
        ogDescription:
          'A transparent AMD/Wp comparison with scope checks and no personal-data collection.'
      },
      label: 'Proposal checker',
      title: 'Check whether a proposal is comparable',
      intro:
        'We calculate only the proposal’s AMD/Wp and compare it with a temporary YOUR ENERGY residential range. This tool neither sets a price nor replaces a commercial proposal.',
      privacy: 'No contact or personal data is collected.',
      formTitle: 'Third-party proposal details',
      totalLabel: 'Total proposal price',
      capacityLabel: 'System capacity',
      regionLabel: 'Region',
      regionArmenia: 'Armenia',
      systemLabel: 'System type',
      systemGrid: 'Grid-tied, no battery',
      systemBattery: 'With battery',
      systemOther: 'Other / unknown',
      scopeLegend: 'Tick only items explicitly included in the proposal',
      scopeHelp: 'If a core item is missing or unclear, we do not make a price conclusion.',
      scope: {
        panels: 'Solar panels',
        inverter: 'Inverter',
        mounting: 'Mounting structure',
        installation: 'Standard installation',
        grid: 'Basic grid connection',
        battery: 'A battery is included'
      },
      submit: 'Compare proposal',
      reset: 'Clear',
      referenceTitle: 'Temporary standard range',
      referenceCopy:
        'This is a temporary YOURENERGY price book v0.1, not an offer. It is valid only through its shown date and still needs a site survey.',
      resultTitle: 'Check result',
      resultAwaiting: 'Enter the details, then choose “Compare proposal”.',
      status: {
        'below-range': 'Below range',
        'within-range': 'Within range',
        'above-range': 'Above range',
        'not-comparable': 'Not comparable'
      },
      resultRate: 'Proposal price per Wp',
      resultRange: 'Comparable range',
      resultWhy: 'Why there is no price verdict',
      resultQuestions: 'Questions for the supplier',
      invalid: 'Enter a price and capacity above zero.',
      notComparable:
        'A battery, a different system type or incomplete scope cannot be compared with this standard grid-tied range.',
      engineeringCta: 'Request an engineering check',
      noJsTitle: 'Manual review option',
      noJsCopy:
        'With JavaScript disabled, call an engineer and prepare the proposal price, kWp and scope.',
      expiry:
        'The temporary range has expired. Request a survey instead of relying on an old price.'
    },
    shared: {
      home: 'Home',
      calculator: 'Calculator',
      offerChecker: 'Proposal checker',
      phone: 'Call an engineer',
      language: 'Language selection',
      primaryNav: 'Primary navigation',
      mobileNav: 'Mobile navigation',
      menu: 'Open navigation menu',
      skip: 'Skip to main content',
      footer: 'YOURENERGY · transparent preliminary tools for residential solar systems in Armenia.'
    }
  }
};

export default Object.freeze(tools);
