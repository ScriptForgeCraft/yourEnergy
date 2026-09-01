/**
 * Copy used by the independently publishable P1 utility pages. Calculator
 * content itself lives with the primary product copy, so this file only keeps
 * its route metadata plus the Proposal Checker dictionary.
 */
const tools = {
  hy: {
    calculatorMeta: {
      title: 'Արևային հաշվիչ՝ սպառումից մինչև տանիքի վերլուծություն | YOURENERGY',
      description:
        'Սկսեք ձեր Solar Passport-ը սպառման տվյալներից, ապա հաստատեք կետն ու տանիքի ուրվագիծը իրական PVGIS նախնական վերլուծության համար։',
      ogTitle: 'Սկսեք ձեր արևային հաշվարկը | YOURENERGY',
      ogDescription: 'Մուտքագրեք սպառումը և շարունակեք կետի ու տանիքի հաստատմանը։'
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
        'YOUR ENERGY-ի ժամանակավոր գների գրքույկ v0.1 է՝ ոչ օֆերտա։ Այն կիրառելի է միայն գործողության ժամկետի ընթացքում և պահանջում է տեղազննում։',
      priceBookCheck:
        'Դիտարկիչը կստուգի ժամանակավոր գնացուցակի գործողությունը․ ժամկետն անցնելու դեպքում գին չի ցուցադրվի։',
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
      scopeIncomplete: 'Առաջարկում հստակ նշված չեն հետևյալ հիմնական կետերը',
      reason: {
        OFFER_PRICE_AND_CAPACITY_REQUIRED: 'Նշեք առաջարկի գինն ու հզորությունը։',
        PRICEBOOK_UNAVAILABLE: 'Ժամանակավոր գնացուցակը հիմա հասանելի չէ։',
        PRICEBOOK_EXPIRED: 'Ժամանակավոր գնացուցակի ժամկետն անցել է։',
        UNSUPPORTED_SYSTEM_TYPE:
          'Համակարգի այս տեսակը չի համեմատվում ստանդարտ ցանցային միջակայքի հետ։',
        BATTERY_SCOPE_UNSUPPORTED:
          'Մարտկոցով առաջարկը չի համեմատվում ստանդարտ ցանցային միջակայքի հետ։'
      },
      questions: {
        standardScope:
          'Հաստատեք, որ առաջարկը ներառում է վահանակներ, ինվերտոր, կրող կառուցվածք, տեղադրում և ցանցային միացում։',
        commercialTerms:
          'Առանձին հստակեցրեք ԱԱՀ-ը, թույլտվությունները, երաշխիքը և ոչ ստանդարտ էլեկտրական աշխատանքները։',
        equipmentTerms:
          'Պայմանագիր կնքելուց առաջ հստակեցրեք սարքավորումների մոդելները, երաշխիքի պայմանները, ԱԱՀ-ը և թույլտվությունները։'
      },
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
    calculatorMeta: {
      title: 'Калькулятор солнечной системы: от потребления к анализу крыши | YOURENERGY',
      description:
        'Начните Solar Passport с данных о потреблении, затем подтвердите точку и контур крыши для реального предварительного анализа PVGIS.',
      ogTitle: 'Начните расчёт солнечной системы | YOURENERGY',
      ogDescription: 'Укажите потребление и продолжите к подтверждению точки и крыши.'
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
        'Это временный прайсбук YOUR ENERGY v0.1, а не оферта. Он действует только в пределах срока действия и требует обследования объекта.',
      priceBookCheck:
        'Браузер проверит срок временного прайсбука; при истечении цена не будет показана.',
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
      scopeIncomplete: 'В предложении не подтверждены следующие основные позиции',
      reason: {
        OFFER_PRICE_AND_CAPACITY_REQUIRED: 'Укажите цену и мощность предложения.',
        PRICEBOOK_UNAVAILABLE: 'Временный прайсбук сейчас недоступен.',
        PRICEBOOK_EXPIRED: 'Срок временного прайсбука истёк.',
        UNSUPPORTED_SYSTEM_TYPE:
          'Этот тип системы не сравнивается со стандартным сетевым диапазоном.',
        BATTERY_SCOPE_UNSUPPORTED:
          'Предложение с батареей не сравнивается со стандартным сетевым диапазоном.'
      },
      questions: {
        standardScope:
          'Подтвердите, что в предложение входят панели, инвертор, крепёж, монтаж и подключение к сети.',
        commercialTerms:
          'Отдельно уточните НДС, разрешения, гарантию и нестандартные электромонтажные работы.',
        equipmentTerms:
          'До подписания уточните точные модели оборудования, условия гарантии, НДС и разрешения.'
      },
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
    calculatorMeta: {
      title: 'Solar calculator: from consumption to roof analysis | YOURENERGY',
      description:
        'Start a Solar Passport with consumption data, then confirm the property point and roof outline for a real preliminary PVGIS analysis.',
      ogTitle: 'Start your solar calculation | YOURENERGY',
      ogDescription: 'Enter consumption and continue to property-point and roof confirmation.'
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
        'This is a temporary YOURENERGY price book v0.1, not an offer. It is valid only during its validity period and still needs a site survey.',
      priceBookCheck:
        'Your browser checks the temporary price book date; no price is shown once it has expired.',
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
      scopeIncomplete: 'The proposal does not confirm these core items',
      reason: {
        OFFER_PRICE_AND_CAPACITY_REQUIRED: 'Enter the proposal price and capacity.',
        PRICEBOOK_UNAVAILABLE: 'The temporary price book is unavailable.',
        PRICEBOOK_EXPIRED: 'The temporary price book has expired.',
        UNSUPPORTED_SYSTEM_TYPE:
          'This system type cannot be compared with the standard grid-tied range.',
        BATTERY_SCOPE_UNSUPPORTED:
          'A proposal with a battery cannot be compared with the standard grid-tied range.'
      },
      questions: {
        standardScope:
          'Confirm that panels, inverter, mounting, installation and grid connection are included.',
        commercialTerms:
          'Confirm VAT, permits, warranty and any non-standard electrical work separately.',
        equipmentTerms:
          'Confirm the exact equipment models, warranty terms, VAT and permits before signing.'
      },
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
