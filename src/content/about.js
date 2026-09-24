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
    eyebrow: 'ОФИЦИАЛЬНЫЕ ДАННЫЕ',
    title: 'Данные компании',
    copy: 'YOURENERGY — официально зарегистрированная компания в Армении.',
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
    eyebrow: 'ՊԱՇՏՈՆԱԿԱՆ ՏՎՅԱԼՆԵՐ',
    title: 'Ընկերության տվյալներ',
    copy: 'YOURENERGY-ն Հայաստանում պաշտոնապես գրանցված ընկերություն է։',
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
    eyebrow: 'OFFICIAL INFORMATION',
    title: 'Company details',
    copy: 'YOURENERGY is an officially registered company in Armenia.',
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
      copy: 'Проектируем и реализуем солнечные энергосистемы в Армении для частных домов и бизнеса.',
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
        'В одном процессе объединяем оценку объекта, расчёт, подбор оборудования, проектирование, монтаж, запуск и дальнейшую поддержку.',
      copyThird:
        'Каждое решение выбираем с учётом реального потребления, технических возможностей объекта и целей клиента.'
    },
    certification: {
      eyebrow: 'СЕРТИФИКАЦИЯ И ОПЫТ',
      title: 'Профессиональный опыт, подтверждённый реальной работой',
      copy: 'Мы работаем в соответствии с техническими требованиями производителей, развиваем профессиональный опыт и строим каждый проект на обоснованных инженерных решениях.',
      ...gallery.ru
    },
    company: company.ru,
    partners: {
      eyebrow: 'НАШИ ПАРТНЁРЫ',
      title: 'Международные бренды и финансовые партнёры',
      copy: 'Мы сотрудничаем с производителями солнечных технологий и финансовыми организациями, чтобы подобрать подходящее решение для проекта.',
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
          title: 'Обследование объекта',
          copy: 'Изучаем потребление, крышу или доступную площадь и задачи проекта.'
        },
        {
          icon: 'file',
          title: 'Расчёт и проектирование',
          copy: 'Определяем мощность системы, ожидаемую выработку и состав оборудования.'
        },
        {
          icon: 'shield-check',
          title: 'Монтаж и запуск',
          copy: 'Выполняем установку, подключение и ввод системы в эксплуатацию.'
        },
        {
          icon: 'chart-bars',
          title: 'Мониторинг и поддержка',
          copy: 'Контролируем работу системы и поддерживаем её в период эксплуатации.'
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
      copy: 'Արևային էներգիայի նախագծում և իրականացում Հայաստանում՝ մասնավոր տների և բիզնեսի համար։',
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
        'Մեկ գործընթացում միավորում ենք օբյեկտի գնահատումը, հաշվարկը, սարքավորումների ընտրությունը, նախագծումը, մոնտաժը, գործարկումը և հետագա աջակցությունը։',
      copyThird:
        'Յուրաքանչյուր լուծում ընտրում ենք իրական սպառման, օբյեկտի տեխնիկական հնարավորությունների և հաճախորդի նպատակների հիման վրա։'
    },
    certification: {
      eyebrow: 'ՀԱՎԱՍՏԱԳՐՈՒՄ ԵՎ ՓՈՐՁ',
      title: 'Մասնագիտական փորձ՝ հաստատված իրական աշխատանքով',
      copy: 'Մենք աշխատում ենք արտադրողների տեխնիկական պահանջներին համապատասխան, զարգացնում ենք մասնագիտական փորձը և յուրաքանչյուր նախագիծ կառուցում հաշվարկված ինժեներական որոշումների վրա։',
      ...gallery.hy
    },
    company: company.hy,
    partners: {
      eyebrow: 'ՄԵՐ ԳՈՐԾԸՆԿԵՐՆԵՐԸ',
      title: 'Միջազգային բրենդներ և ֆինանսական գործընկերներ',
      copy: 'Համագործակցում ենք արևային տեխնոլոգիաների արտադրողների և ֆինանսական կազմակերպությունների հետ՝ նախագծի համար համապատասխան լուծում ընտրելու նպատակով։',
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
          title: 'Օբյեկտի ուսումնասիրություն',
          copy: 'Ուսումնասիրում ենք սպառումը, տանիքը կամ հասանելի տարածքը և նախագծի նպատակները։'
        },
        {
          icon: 'file',
          title: 'Հաշվարկ և նախագծում',
          copy: 'Որոշում ենք համակարգի հզորությունը, սպասվող արտադրությունը և սարքավորումների կազմը։'
        },
        {
          icon: 'shield-check',
          title: 'Մոնտաժ և գործարկում',
          copy: 'Իրականացնում ենք տեղադրումը, միացումը և համակարգի գործարկումը։'
        },
        {
          icon: 'chart-bars',
          title: 'Մոնիթորինգ և աջակցություն',
          copy: 'Վերահսկում ենք համակարգի աշխատանքը և աջակցում շահագործման ընթացքում։'
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
      copy: 'Solar energy system design and delivery in Armenia for private homes and businesses.',
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
        'We bring site assessment, system sizing, equipment selection, engineering, installation, commissioning and ongoing support into one process.',
      copyThird:
        "Every solution is selected around actual energy use, the property's technical potential and the client's goals."
    },
    certification: {
      eyebrow: 'CERTIFICATION & EXPERIENCE',
      title: 'Professional experience backed by real work',
      copy: "We work in accordance with manufacturers' technical requirements, develop our expertise and build every project on informed engineering decisions.",
      ...gallery.en
    },
    company: company.en,
    partners: {
      eyebrow: 'OUR PARTNERS',
      title: 'International brands and financial partners',
      copy: 'We work with solar technology manufacturers and financial organizations to select the right solution for each project.',
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
          title: 'Site assessment',
          copy: 'We review energy use, the roof or available area, and the project goals.'
        },
        {
          icon: 'file',
          title: 'Sizing and design',
          copy: 'We determine system capacity, expected production and the equipment configuration.'
        },
        {
          icon: 'shield-check',
          title: 'Installation and commissioning',
          copy: 'We install, connect and commission the solar system.'
        },
        {
          icon: 'chart-bars',
          title: 'Monitoring and support',
          copy: 'We monitor system performance and support its operation.'
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
