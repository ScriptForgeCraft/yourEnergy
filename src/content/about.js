const partnerLogos = Object.freeze({
  longi: '/about/partners/longi.png',
  solax: '/about/partners/solax.webp',
  acba: '/about/partners/acba-leasing.webp',
  armenian: '/about/partners/armenian-leasing.webp'
});

const gallery = {
  ru: {
    galleryTitle: 'Материалы LONGi',
    openImage: 'Открыть изображение',
    closeImage: 'Закрыть',
    previousImage: 'Предыдущее изображение',
    nextImage: 'Следующее изображение',
    items: [
      {
        image: '/about/gallery/event-certificate-02.webp',
        layout: 'featured',
        alt: 'Фотография с сертификатом LONGi',
        caption: 'Сертификация LONGi'
      },
      {
        image: '/about/gallery/event-awards-01.webp',
        layout: 'secondary',
        alt: 'Сертификаты и наградные материалы LONGi',
        caption: 'Сертификационные материалы'
      },
      {
        image: '/about/certificates/longi-certificate.webp',
        layout: 'document',
        alt: 'Сертификат LONGi, выданный Your Energy',
        caption: 'Сертификат LONGi'
      }
    ]
  },
  hy: {
    galleryTitle: 'LONGi նյութեր',
    openImage: 'Բացել լուսանկարը',
    closeImage: 'Փակել',
    previousImage: 'Նախորդ լուսանկարը',
    nextImage: 'Հաջորդ լուսանկարը',
    items: [
      {
        image: '/about/gallery/event-certificate-02.webp',
        layout: 'featured',
        alt: 'Լուսանկար LONGi հավաստագրով',
        caption: 'LONGi հավաստագրում'
      },
      {
        image: '/about/gallery/event-awards-01.webp',
        layout: 'secondary',
        alt: 'LONGi հավաստագրեր և պարգևատրման նյութեր',
        caption: 'Հավաստագրման նյութեր'
      },
      {
        image: '/about/certificates/longi-certificate.webp',
        layout: 'document',
        alt: 'LONGi հավաստագիր՝ տրված Your Energy-ին',
        caption: 'LONGi հավաստագիր'
      }
    ]
  },
  en: {
    galleryTitle: 'LONGi materials',
    openImage: 'Open image',
    closeImage: 'Close',
    previousImage: 'Previous image',
    nextImage: 'Next image',
    items: [
      {
        image: '/about/gallery/event-certificate-02.webp',
        layout: 'featured',
        alt: 'Photograph with a LONGi certificate',
        caption: 'LONGi certification'
      },
      {
        image: '/about/gallery/event-awards-01.webp',
        layout: 'secondary',
        alt: 'LONGi certificates and award materials',
        caption: 'Certification materials'
      },
      {
        image: '/about/certificates/longi-certificate.webp',
        layout: 'document',
        alt: 'LONGi certificate issued to Your Energy',
        caption: 'LONGi certificate'
      }
    ]
  }
};

const company = {
  ru: {
    eyebrow: 'ДАННЫЕ КОМПАНИИ',
    title: 'Юридическая прозрачность',
    copy: 'YOURENERGY — официально зарегистрированная в Армении компания. Основные юридические сведения открыто представлены для клиентов и партнёров.',
    recordLabel: 'Данные государственной регистрации',
    facts: [
      { label: 'Юридическое наименование', value: 'ООО «ЮР ЭНЕРДЖИ»' },
      { label: 'Государственная регистрация', value: '17.08.2026' },
      { label: 'Регистрационный номер', value: '999.110.1603227' },
      { label: 'ИНН', value: '02338724' }
    ],
    addressLabel: 'Юридический адрес',
    address: 'Ереван, Шенгавит, ул. Арташисиян 48, строение 14, 0039',
    source: 'Источник: данные Государственного единого реестра.',
    verification: 'Контрольный номер: RBE4-88FA-4C78-8ECF.'
  },
  hy: {
    eyebrow: 'ԸՆԿԵՐՈՒԹՅԱՆ ՏՎՅԱԼՆԵՐ',
    title: 'Իրավաբանական թափանցիկություն',
    copy: 'YOURENERGY-ն Հայաստանում պաշտոնապես գրանցված ընկերություն է։ Մեր իրավաբանական տվյալները ներկայացնում ենք բաց և հստակ՝ հաճախորդների և գործընկերների համար։',
    recordLabel: 'Պետական գրանցման տվյալներ',
    facts: [
      { label: 'Իրավաբանական անվանում', value: '«ՅՈՒՐ ԷՆԵՐՋԻ» ՍՊԸ' },
      { label: 'Պետական գրանցում', value: '17.08.2026' },
      { label: 'Գրանցման համար', value: '999.110.1603227' },
      { label: 'ՀՎՀՀ', value: '02338724' }
    ],
    addressLabel: 'Իրավաբանական հասցե',
    address: 'Երևան, Շենգավիթ, Արտաշիսյան փողոց 48, շինություն 14, 0039',
    source: 'Աղբյուր՝ Պետական միասնական ռեեստրի տվյալներ։',
    verification: 'Վերահսկիչ համար՝ RBE4-88FA-4C78-8ECF։'
  },
  en: {
    eyebrow: 'COMPANY INFORMATION',
    title: 'Legal transparency',
    copy: 'YOURENERGY is an officially registered company in Armenia. We make our core legal information openly available to clients and partners.',
    recordLabel: 'State registration details',
    facts: [
      { label: 'Legal name', value: 'YOUR ENERGY LLC' },
      { label: 'State registration', value: '17 August 2026' },
      { label: 'Registration number', value: '999.110.1603227' },
      { label: 'Tax ID', value: '02338724' }
    ],
    addressLabel: 'Legal address',
    address: '48 Artashisyan Street, Building 14, Shengavit, Yerevan 0039, Armenia',
    source: 'Source: State Unified Register data.',
    verification: 'Reference number: RBE4-88FA-4C78-8ECF.'
  }
};

const aboutPageCopy = {
  ru: {
    meta: {
      title: 'О компании YOURENERGY | Солнечная энергетика в Армении',
      description: 'YOURENERGY проектирует и реализует солнечные энергосистемы в Армении.',
      ogTitle: 'О компании YOURENERGY',
      ogDescription: 'Инженерный подход и полная реализация солнечных проектов YOURENERGY.'
    },
    hero: {
      titleLead: 'О компании',
      titleAccent: 'YOUR ENERGY',
      copy: 'Солнечные энергетические решения для домов и бизнеса — с инженерным расчётом, правильно подобранным оборудованием и полной реализацией проекта.',
      signals: [
        { icon: 'faq-settings', title: 'Инженерный', copy: 'подход' },
        { icon: 'chart-bars', title: 'Понятные', copy: 'решения' },
        { icon: 'shield-check', title: 'Ответственная', copy: 'реализация' }
      ]
    },
    intro: {
      eyebrow: 'YOURENERGY',
      titleLead: 'Что такое',
      titleAccent: 'YOUR ENERGY',
      copy: 'YOURENERGY — компания в сфере солнечной энергетики в Армении. Мы проектируем и реализуем солнечные системы для частных домов и бизнеса.',
      copySecond:
        'В одном процессе мы объединяем обследование объекта, анализ энергопотребления, расчёт системы, проектирование, подбор оборудования, монтаж, запуск и дальнейшую поддержку.',
      copyThird:
        'Наша задача — не просто установить солнечные панели. Каждую систему мы подбираем на основе реального потребления, технических особенностей объекта и целей клиента, чтобы решение было эффективным, понятным и рассчитанным на долгосрочную работу.'
    },
    certification: {
      eyebrow: 'СЕРТИФИКАЦИЯ И ОПЫТ',
      title: 'Профессиональный подход, подтверждённый работой',
      copy: 'Для YOURENERGY важен не только конечный результат, но и качество каждого этапа проекта.',
      copySecond:
        'Мы работаем с учётом технических требований производителей, развиваем профессиональную экспертизу и строим проекты на обоснованных инженерных решениях.',
      copyThird:
        'Материалы сертификации LONGi отражают часть нашей профессиональной подготовки и работы с современными технологиями солнечной энергетики.',
      ...gallery.ru
    },
    company: company.ru,
    partners: {
      eyebrow: 'НАШИ ПАРТНЁРЫ',
      title: 'Технологические и финансовые партнёры',
      copy: 'Надёжный солнечный проект требует не только точного расчёта, но и качественного оборудования, технологической поддержки и удобных вариантов финансирования.',
      intro:
        'YOURENERGY работает с международными технологическими брендами солнечной энергетики и финансовыми организациями Армении, объединяя оборудование и финансовые инструменты в рамках одного проекта.',
      note: 'Конкретные модели оборудования и условия финансирования подбираются индивидуально в соответствии с техническими и финансовыми параметрами проекта.',
      previous: 'Предыдущие карточки',
      next: 'Следующие карточки',
      items: [
        {
          name: 'LONGi',
          detail: 'Authorized Installer',
          subdetail: 'Высокоэффективные солнечные модули',
          logo: partnerLogos.longi,
          tone: 'light'
        },
        {
          name: 'SolaX Power',
          detail: 'Инверторы и системы накопления энергии',
          logo: partnerLogos.solax,
          tone: 'dark'
        },
        {
          name: 'ACBA Leasing',
          detail: 'Лизинговое финансирование солнечных проектов',
          logo: partnerLogos.acba,
          tone: 'navy'
        },
        {
          name: 'Armenian Leasing',
          detail: 'Лизинговое финансирование солнечных проектов',
          logo: partnerLogos.armenian,
          tone: 'light'
        }
      ]
    },
    principles: {
      eyebrow: 'НАШ ПОДХОД',
      title: 'Как мы работаем',
      items: [
        {
          icon: 'faq-settings',
          title: 'Начинаем с объекта и реального потребления',
          copy: 'Изучаем потребление электроэнергии, особенности объекта, параметры крыши или доступной территории и задачи клиента. На основе этих данных определяем необходимую мощность и конфигурацию системы.'
        },
        {
          icon: 'file',
          title: 'Рассчитываем и объясняем решение',
          copy: 'Показываем основные параметры системы, ожидаемую выработку и логику выбора оборудования, чтобы клиент понимал не только результат, но и основания предложенного решения.'
        },
        {
          icon: 'shield-check',
          title: 'Реализуем и продолжаем поддерживать',
          copy: 'Организуем монтаж, запуск и мониторинг системы и остаёмся на связи после ввода оборудования в эксплуатацию.'
        }
      ]
    },
    finalCta: {
      eyebrow: 'ЕСТЬ ПРОЕКТ?',
      title: 'Начнём с расчёта',
      copy: 'Расскажите о вашем доме, бизнесе или планируемом объекте. Мы оценим исходные данные и предложим солнечное решение, соответствующее вашему проекту.',
      primary: 'Получить расчёт',
      secondary: 'Связаться с нами'
    }
  },
  hy: {
    meta: {
      title: 'YOURENERGY ընկերության մասին | Արևային էներգիա Հայաստանում',
      description: 'YOURENERGY-ն նախագծում և իրականացնում է արևային համակարգեր Հայաստանում։',
      ogTitle: 'YOURENERGY-ի մասին',
      ogDescription: 'Ինժեներական մոտեցում և արևային նախագծերի ամբողջական իրականացում։'
    },
    hero: {
      titleLead: 'Մեր մասին',
      titleAccent: 'YOUR ENERGY',
      copy: 'Արևային էներգիայի լուծումներ տների և բիզնեսի համար՝ ինժեներական հաշվարկով, ճիշտ ընտրված սարքավորումներով և ամբողջական իրականացմամբ։',
      signals: [
        { icon: 'faq-settings', title: 'Ինժեներական', copy: 'մոտեցում' },
        { icon: 'chart-bars', title: 'Հասկանալի', copy: 'լուծումներ' },
        { icon: 'shield-check', title: 'Պատասխանատու', copy: 'իրականացում' }
      ]
    },
    intro: {
      eyebrow: 'YOURENERGY',
      titleLead: 'Ի՞նչ է',
      titleAccent: 'YOUR ENERGY-ը',
      copy: 'YOURENERGY-ն արևային էներգետիկայի ընկերություն է Հայաստանում, որը նախագծում և իրականացնում է արևային համակարգեր մասնավոր տների և բիզնեսի համար։',
      copySecond:
        'Մենք մեկ ամբողջական գործընթացում միավորում ենք օբյեկտի գնահատումը, էներգասպառման վերլուծությունը, համակարգի հաշվարկը, նախագծումը, սարքավորումների ընտրությունը, մոնտաժը, գործարկումը և հետագա աջակցությունը։',
      copyThird:
        'Մեր նպատակը պարզապես արևային վահանակներ տեղադրելը չէ։ Յուրաքանչյուր համակարգ ընտրում ենք տվյալ օբյեկտի իրական սպառման, տեխնիկական հնարավորությունների և հաճախորդի նպատակների հիման վրա, որպեսզի լուծումը լինի արդյունավետ, հասկանալի և երկարաժամկետ։'
    },
    certification: {
      eyebrow: 'ՀԱՎԱՍՏԱԳՐՈՒՄ ԵՎ ՓՈՐՁ',
      title: 'Մասնագիտական մոտեցում՝ հաստատված աշխատանքով',
      copy: 'YOURENERGY-ի համար կարևոր է ոչ միայն վերջնական արդյունքը, այլ նաև այն ճանապարհը, որով հասնում ենք դրան։',
      copySecond:
        'Մենք աշխատում ենք արտադրողների տեխնիկական պահանջներին համապատասխան, զարգացնում ենք մեր մասնագիտական փորձը և յուրաքանչյուր նախագիծ կառուցում ենք հաշվարկված ինժեներական որոշումների վրա։',
      copyThird:
        'LONGi-ի հավաստագրման նյութերը ներկայացնում են մեր մասնագիտական աշխատանքի և տեխնոլոգիական գիտելիքների զարգացման մի մասը։',
      ...gallery.hy
    },
    company: company.hy,
    partners: {
      eyebrow: 'ՄԵՐ ԳՈՐԾԸՆԿԵՐՆԵՐԸ',
      title: 'Տեխնոլոգիական և ֆինանսական գործընկերներ',
      copy: 'Հուսալի արևային նախագիծը պահանջում է ոչ միայն ճիշտ հաշվարկ, այլ նաև որակյալ սարքավորումներ, տեխնոլոգիական աջակցություն և հարմար ֆինանսավորման հնարավորություններ։',
      intro:
        'YOURENERGY-ն աշխատում է արևային էներգետիկայի միջազգային տեխնոլոգիական բրենդների և Հայաստանում գործող ֆինանսական կազմակերպությունների հետ՝ նախագծերի համար առաջարկելով ամբողջական տեխնիկական և ֆինանսական լուծումներ։',
      note: 'Սարքավորումների կոնկրետ մոդելները և ֆինանսավորման պայմանները ընտրվում են յուրաքանչյուր նախագծի պահանջներին համապատասխան։',
      previous: 'Նախորդ քարտերը',
      next: 'Հաջորդ քարտերը',
      items: [
        {
          name: 'LONGi',
          detail: 'Authorized Installer',
          subdetail: 'Բարձր արդյունավետության արևային մոդուլներ',
          logo: partnerLogos.longi,
          tone: 'light'
        },
        {
          name: 'SolaX Power',
          detail: 'Ինվերտորներ և էներգիայի կուտակման համակարգեր',
          logo: partnerLogos.solax,
          tone: 'dark'
        },
        {
          name: 'ACBA Leasing',
          detail: 'Արևային նախագծերի լիզինգային ֆինանսավորում',
          logo: partnerLogos.acba,
          tone: 'navy'
        },
        {
          name: 'Armenian Leasing',
          detail: 'Արևային նախագծերի լիզինգային ֆինանսավորում',
          logo: partnerLogos.armenian,
          tone: 'light'
        }
      ]
    },
    principles: {
      eyebrow: 'ՄԵՐ ՄՈՏԵՑՈՒՄԸ',
      title: 'Ինչպես ենք աշխատում',
      items: [
        {
          icon: 'faq-settings',
          title: 'Սկսում ենք օբյեկտից և իրական սպառումից',
          copy: 'Ուսումնասիրում ենք էլեկտրաէներգիայի սպառումը, օբյեկտի առանձնահատկությունները, տանիքը կամ հասանելի տարածքը և հաճախորդի նպատակները։ Այդ տվյալների հիման վրա որոշում ենք համակարգի անհրաժեշտ հզորությունն ու կազմը։'
        },
        {
          icon: 'file',
          title: 'Հաշվարկում և հիմնավորում ենք լուծումը',
          copy: 'Ներկայացնում ենք համակարգի հիմնական պարամետրերը, սպասվող արտադրությունը և սարքավորումների ընտրության տրամաբանությունը, որպեսզի հաճախորդը հասկանա, թե ինչ է ստանում և ինչու։'
        },
        {
          icon: 'shield-check',
          title: 'Իրականացնում և աջակցում ենք',
          copy: 'Կազմակերպում ենք մոնտաժը, համակարգի գործարկումն ու մոնիթորինգը և շարունակում ենք աջակցել նաև շահագործման ընթացքում։'
        }
      ]
    },
    finalCta: {
      eyebrow: 'ՈՒՆԵ՞Ք ՆԱԽԱԳԻԾ',
      title: 'Եկեք սկսենք հաշվարկից',
      copy: 'Պատմեք ձեր տան, բիզնեսի կամ նախատեսվող նախագծի մասին։ Կգնահատենք ելակետային տվյալները և կառաջարկենք ձեր օբյեկտին համապատասխան արևային լուծում։',
      primary: 'Ստանալ հաշվարկ',
      secondary: 'Կապվել մեզ հետ'
    }
  },
  en: {
    meta: {
      title: 'About YOURENERGY | Solar energy in Armenia',
      description: 'YOURENERGY designs and delivers solar energy systems in Armenia.',
      ogTitle: 'About YOURENERGY',
      ogDescription: 'Engineering-led solar project delivery by YOURENERGY.'
    },
    hero: {
      titleLead: 'About',
      titleAccent: 'YOUR ENERGY',
      copy: 'Solar energy solutions for homes and businesses — backed by engineering calculations, carefully selected equipment and complete project delivery.',
      signals: [
        { icon: 'faq-settings', title: 'Engineering', copy: 'approach' },
        { icon: 'chart-bars', title: 'Clear', copy: 'solutions' },
        { icon: 'shield-check', title: 'Responsible', copy: 'delivery' }
      ]
    },
    intro: {
      eyebrow: 'YOURENERGY',
      titleLead: 'What is',
      titleAccent: 'YOUR ENERGY?',
      copy: 'YOURENERGY is a solar energy company in Armenia that designs and delivers solar power systems for private homes and businesses.',
      copySecond:
        'We bring site assessment, energy-consumption analysis, system sizing, engineering, equipment selection, installation, commissioning and ongoing support into one complete process.',
      copyThird:
        "Our goal is not simply to install solar panels. Every system is designed around actual energy consumption, the technical characteristics of the property and the client's objectives, creating a solution that is efficient, understandable and built for long-term operation."
    },
    certification: {
      eyebrow: 'CERTIFICATION & EXPERIENCE',
      title: 'Professional expertise backed by real work',
      copy: 'At YOURENERGY, the quality of the process matters just as much as the final result.',
      copySecond:
        "We work in accordance with manufacturers' technical requirements, continuously develop our professional expertise and base every project on informed engineering decisions.",
      copyThird:
        'Our LONGi certification materials represent part of our professional development and experience with modern solar technologies.',
      ...gallery.en
    },
    company: company.en,
    partners: {
      eyebrow: 'OUR PARTNERS',
      title: 'Technology and financial partners',
      copy: 'A reliable solar project requires more than accurate engineering. It also depends on quality equipment, technology support and practical financing options.',
      intro:
        'YOURENERGY works with international solar technology brands and financial organizations in Armenia to bring equipment and financing solutions together within a complete project.',
      note: 'Specific equipment models and financing terms are selected according to the technical and financial requirements of each project.',
      previous: 'Previous cards',
      next: 'Next cards',
      items: [
        {
          name: 'LONGi',
          detail: 'Authorized Installer',
          subdetail: 'High-efficiency solar modules',
          logo: partnerLogos.longi,
          tone: 'light'
        },
        {
          name: 'SolaX Power',
          detail: 'Inverters and energy storage systems',
          logo: partnerLogos.solax,
          tone: 'dark'
        },
        {
          name: 'ACBA Leasing',
          detail: 'Leasing solutions for solar projects',
          logo: partnerLogos.acba,
          tone: 'navy'
        },
        {
          name: 'Armenian Leasing',
          detail: 'Leasing solutions for solar projects',
          logo: partnerLogos.armenian,
          tone: 'light'
        }
      ]
    },
    principles: {
      eyebrow: 'OUR APPROACH',
      title: 'How we work',
      items: [
        {
          icon: 'faq-settings',
          title: 'We start with the property and actual energy use',
          copy: "We analyse electricity consumption, site characteristics, available roof or ground area and the client's objectives. These inputs determine the required system capacity and configuration."
        },
        {
          icon: 'file',
          title: 'We calculate and explain the solution',
          copy: 'We present the main system parameters, expected energy production and the reasoning behind the equipment selection, so the client understands both the solution and the logic behind it.'
        },
        {
          icon: 'shield-check',
          title: 'We deliver and continue to support',
          copy: 'We manage installation, commissioning and monitoring and continue supporting the system after it becomes operational.'
        }
      ]
    },
    finalCta: {
      eyebrow: 'HAVE A PROJECT?',
      title: 'Start with an estimate',
      copy: 'Tell us about your home, business or planned project. We will review the initial information and propose a solar solution suited to your property and goals.',
      primary: 'Get an estimate',
      secondary: 'Contact us'
    }
  }
};

export default Object.freeze(aboutPageCopy);
