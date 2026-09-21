const aboutPageCopy = {
  ru: {
    meta: {
      title: 'О компании YOURENERGY | Солнечная энергетика в Армении',
      description:
        'YOURENERGY — инженерный подход к солнечной энергетике в Армении. Документы, подтверждённые сведения о компании и материалы о её работе публикуются прозрачно.',
      ogTitle: 'YOURENERGY — больше, чем солнечная энергия',
      ogDescription:
        'Знакомьтесь с подходом YOURENERGY, юридическими сведениями и подтверждающими материалами компании.'
    },
    hero: {
      eyebrow: 'О КОМПАНИИ',
      titleLead: 'Больше, чем',
      titleAccent: 'солнечная энергия.',
      copy: 'Мы помогаем домам и бизнесу в Армении сделать энергию понятной, устойчивой и управляемой — от первой идеи до поддержки после запуска.',
      signals: [
        { icon: 'leaf', title: 'Чистая среда', copy: 'для жизни' },
        { icon: 'faq-home', title: 'Энергетическая независимость', copy: 'и комфорт' },
        { icon: 'chart-bars', title: 'Устойчивое', copy: 'будущее' }
      ],
      aside: ['Проектируем.', 'Реализуем.', 'Поддерживаем.'],
      scroll: 'Листайте, чтобы узнать больше'
    },
    approach: {
      eyebrow: 'НАШ ПОДХОД',
      title: 'Продуманные решения для реальных людей',
      copy: 'Соединяем инженерную дисциплину, ясную коммуникацию и внимание к объекту, чтобы путь к солнечной энергии оставался прозрачным на каждом этапе.',
      action: 'Как проходит проект',
      items: [
        {
          icon: 'satellite',
          title: 'Инженерный подход',
          copy: 'Начинаем с задачи и параметров конкретного объекта.'
        },
        {
          icon: 'cycle',
          title: 'Полный цикл',
          copy: 'Сопровождаем путь от расчёта до запуска системы.'
        },
        {
          icon: 'shield-check',
          title: 'Прозрачность',
          copy: 'Фиксируем исходные данные, допущения и дальнейшие шаги.'
        },
        {
          icon: 'support',
          title: 'Поддержка клиента',
          copy: 'Остаёмся на связи, когда система уже работает.'
        }
      ]
    },
    certificates: {
      eyebrow: 'СЕРТИФИКАТЫ',
      title: 'Подтверждаем качество первоисточниками',
      copy: 'Здесь публикуются только документы, переданные YOURENERGY и пригодные для независимой проверки. Для каждого документа предусмотрены предпросмотр и ссылка на исходный PDF.',
      emptyTitle: 'Подтверждённые сертификаты пока не опубликованы',
      emptyCopy:
        'Мы не показываем макеты и не заявляем сертификаты без подтверждённого документа. В этом разделе появятся только проверенные оригиналы с названием, датой, предпросмотром и PDF.',
      emptyNote: 'Публикуем материалы только после проверки оригиналов.',
      openPdf: 'Открыть PDF',
      preview: 'Предпросмотр документа',
      items: []
    },
    company: {
      eyebrow: 'ДОКУМЕНТЫ КОМПАНИИ',
      title: 'Юридическая прозрачность',
      copy: 'Официальные сведения о юридическом лице выделены отдельно от сертификатов оборудования и квалификации.',
      recordLabel: 'Сведения о государственной регистрации',
      facts: [
        { label: 'Юридическое название', value: 'ООО «ЮР ЭНЕРДЖИ»' },
        { label: 'Государственная регистрация', value: '17.08.2026' },
        { label: 'Регистрационный номер', value: '999.110.1603227' },
        { label: 'ИНН', value: '02338724' }
      ],
      addressLabel: 'Юридический адрес',
      address: 'Ереван, Шенгавит, ул. Арташисиян 48, строение 14, 0039',
      source: 'Источник: выписка из Государственного единого реестра от 17.08.2026',
      verification: 'Контрольный номер: RBE4-88FA-4C78-8ECF',
      filesTitle: 'Официальные PDF компании',
      filesCopy:
        'В этом разделе публикуются регистрационные документы, выписки и другие подтверждающие PDF после получения и проверки оригиналов.',
      emptyTitle: 'Официальные PDF пока не опубликованы',
      emptyCopy:
        'Публикуем файлы только после получения оригиналов. Юридические документы компании отделены от сертификатов и не заменяют их.',
      openPdf: 'Открыть PDF',
      preview: 'Предпросмотр документа',
      items: []
    },
    partners: {
      eyebrow: 'НАШИ ПАРТНЁРЫ',
      title: 'Партнёрства, которые можно проверить',
      copy: 'Публикуем логотип и статус только тех компаний, чьи отношения с YOURENERGY подтверждены материалами, пригодными для публикации.',
      emptyTitle: 'Подтверждённые партнёрства пока не опубликованы',
      emptyCopy:
        'Мы не используем логотипы производителей как заявление об официальном партнёрстве. В разделе будут только отношения, статус которых подтверждён документально.',
      emptyNote: 'Только подтверждённые партнёрства.',
      items: []
    },
    events: {
      eyebrow: 'СОБЫТИЯ И ДОСТИЖЕНИЯ',
      title: 'Развитие через знания и партнёрство',
      copy: 'Здесь публикуются только реальные материалы YOURENERGY с выставок, обучения, встреч и сертификационных мероприятий — с датой, названием и кратким контекстом.',
      emptyTitle: 'Материалы о событиях пока не опубликованы',
      emptyCopy:
        'Мы не заменяем реальные события стоковыми сюжетами. Здесь появятся только фотографии и сведения, которые можно привязать к конкретному событию.',
      emptyMeta: 'Фото · дата · описание',
      allEvents: 'Все события',
      items: []
    },
    finalCta: {
      eyebrow: 'ДАВАЙТЕ ОБСУДИМ ВАШ ПРОЕКТ',
      title: 'Сделаем чистую энергию частью вашего будущего',
      copy: 'Оставьте заявку — начнём с понятного предварительного расчёта для вашего дома или бизнеса.',
      primary: 'Получить расчёт',
      secondary: 'Связаться с нами',
      note: ['Чистая', 'энергия.', 'Реальные', 'решения.']
    }
  },
  hy: {
    meta: {
      title: 'YOURENERGY ընկերության մասին | Արևային էներգիա Հայաստանում',
      description:
        'YOURENERGY-ն Հայաստանում արևային էներգիայի ինժեներական մոտեցում է։ Ընկերության փաստաթղթերն ու հաստատված տվյալները հրապարակվում են թափանցիկ։',
      ogTitle: 'YOURENERGY — արևային էներգիայից ավելին',
      ogDescription:
        'Ծանոթացեք YOURENERGY-ի մոտեցմանը, իրավաբանական տվյալներին և ընկերության հաստատող նյութերին։'
    },
    hero: {
      eyebrow: 'ՄԵՐ ՄԱՍԻՆ',
      titleLead: 'Ավելի շատ, քան',
      titleAccent: 'արևային էներգիա։',
      copy: 'Մենք օգնում ենք Հայաստանի տներին ու բիզնեսին էներգիան դարձնել հասկանալի, կայուն և կառավարելի՝ առաջին գաղափարից մինչև գործարկումից հետո աջակցություն։',
      signals: [
        { icon: 'leaf', title: 'Մաքուր միջավայր', copy: 'կյանքի համար' },
        { icon: 'faq-home', title: 'Էներգետիկ անկախություն', copy: 'և հարմարավետություն' },
        { icon: 'chart-bars', title: 'Կայուն', copy: 'ապագա' }
      ],
      aside: ['Նախագծում ենք։', 'Իրականացնում ենք։', 'Աջակցում ենք։'],
      scroll: 'Շարունակեք՝ ավելին իմանալու համար'
    },
    approach: {
      eyebrow: 'ՄԵՐ ՄՈՏԵՑՈՒՄԸ',
      title: 'Մտածված լուծումներ իրական մարդկանց համար',
      copy: 'Միավորում ենք ինժեներական կարգապահությունը, հստակ հաղորդակցությունն ու օբյեկտի նկատմամբ ուշադրությունը, որպեսզի արևային էներգիայի ճանապարհը թափանցիկ լինի յուրաքանչյուր փուլում։',
      action: 'Ինչպես է ընթանում նախագիծը',
      items: [
        {
          icon: 'satellite',
          title: 'Ինժեներական մոտեցում',
          copy: 'Սկսում ենք կոնկրետ օբյեկտի խնդրից և պարամետրերից։'
        },
        {
          icon: 'cycle',
          title: 'Ամբողջական ցիկլ',
          copy: 'Ուղեկցում ենք հաշվարկից մինչև համակարգի գործարկումը։'
        },
        {
          icon: 'shield-check',
          title: 'Թափանցիկություն',
          copy: 'Ֆիքսում ենք ելակետային տվյալները, ենթադրություններն ու հաջորդ քայլերը։'
        },
        {
          icon: 'support',
          title: 'Հաճախորդի աջակցություն',
          copy: 'Կապի մեջ ենք մնում նաև այն ժամանակ, երբ համակարգն արդեն աշխատում է։'
        }
      ]
    },
    certificates: {
      eyebrow: 'ՀԱՎԱՍՏԱԳՐԵՐ',
      title: 'Որակը հաստատում ենք սկզբնաղբյուրներով',
      copy: 'Այստեղ հրապարակվում են միայն YOURENERGY-ի տրամադրած և անկախ ստուգման համար պիտանի փաստաթղթերը։ Յուրաքանչյուր փաստաթղթի համար նախատեսված են նախադիտում և սկզբնական PDF-ի հղում։',
      emptyTitle: 'Հաստատված հավաստագրերը դեռ հրապարակված չեն',
      emptyCopy:
        'Չենք ցուցադրում մակետներ և չենք հայտարարում հավաստագրեր առանց հաստատված փաստաթղթի։ Այս բաժնում կհայտնվեն միայն ստուգված բնօրինակներ՝ անվամբ, ամսաթվով, նախադիտմամբ և PDF-ով։',
      emptyNote: 'Նյութերը հրապարակվում են միայն բնօրինակների ստուգումից հետո։',
      openPdf: 'Բացել PDF-ը',
      preview: 'Փաստաթղթի նախադիտում',
      items: []
    },
    company: {
      eyebrow: 'ԸՆԿԵՐՈՒԹՅԱՆ ՓԱՍՏԱԹՂԹԵՐ',
      title: 'Իրավաբանական թափանցիկություն',
      copy: 'Իրավաբանական անձի պաշտոնական տվյալները ներկայացված են առանձին՝ սարքավորումների և որակավորման հավաստագրերից։',
      recordLabel: 'Պետական գրանցման տվյալներ',
      facts: [
        { label: 'Իրավաբանական անվանում', value: '«ՅՈՒՐ ԷՆԵՐՋԻ» ՍՊԸ' },
        { label: 'Պետական գրանցում', value: '17.08.2026' },
        { label: 'Գրանցման համար', value: '999.110.1603227' },
        { label: 'ՀՎՀՀ', value: '02338724' }
      ],
      addressLabel: 'Իրավաբանական հասցե',
      address: 'Երևան, Շենգավիթ, Արտաշիսյան փողոց 48, շինություն 14, 0039',
      source: 'Աղբյուր՝ Պետական միասնական ռեեստրի քաղվածք՝ 17.08.2026',
      verification: 'Վերահսկիչ համար՝ RBE4-88FA-4C78-8ECF',
      filesTitle: 'Ընկերության պաշտոնական PDF-ներ',
      filesCopy:
        'Այս բաժնում գրանցման փաստաթղթերը, քաղվածքները և այլ հաստատող PDF-ները հրապարակվում են բնօրինակները ստանալուց և ստուգելուց հետո։',
      emptyTitle: 'Պաշտոնական PDF-ները դեռ հրապարակված չեն',
      emptyCopy:
        'Ֆայլերը հրապարակվում են միայն բնօրինակները ստանալուց հետո։ Ընկերության իրավաբանական փաստաթղթերը ներկայացված են առանձին և չեն փոխարինում հավաստագրերին։',
      openPdf: 'Բացել PDF-ը',
      preview: 'Փաստաթղթի նախադիտում',
      items: []
    },
    partners: {
      eyebrow: 'ՄԵՐ ԳՈՐԾԸՆԿԵՐՆԵՐԸ',
      title: 'Գործընկերություններ, որոնք կարելի է ստուգել',
      copy: 'Հրապարակում ենք միայն այն ընկերությունների լոգոն և կարգավիճակը, որոնց հարաբերությունը YOURENERGY-ի հետ հաստատված է հրապարակման համար պիտանի նյութերով։',
      emptyTitle: 'Հաստատված գործընկերությունները դեռ հրապարակված չեն',
      emptyCopy:
        'Արտադրողների լոգոները չենք օգտագործում որպես պաշտոնական գործընկերության հայտարարություն։ Այս բաժնում կներկայացվեն միայն փաստաթղթերով հաստատված հարաբերություններ և դրանց հստակ կարգավիճակը։',
      emptyNote: 'Միայն հաստատված գործընկերություններ։',
      items: []
    },
    events: {
      eyebrow: 'ԻՐԱԴԱՐՁՈՒԹՅՈՒՆՆԵՐ ԵՎ ՆՎԱՃՈՒՄՆԵՐ',
      title: 'Զարգացում՝ գիտելիքի և գործընկերության միջոցով',
      copy: 'Այստեղ հրապարակվում են միայն YOURENERGY-ի իրական նյութերը ցուցահանդեսներից, ուսուցումներից, հանդիպումներից և հավաստագրման միջոցառումներից՝ ամսաթվով, վերնագրով և կարճ նկարագրությամբ։',
      emptyTitle: 'Իրադարձությունների նյութերը դեռ հրապարակված չեն',
      emptyCopy:
        'Իրական իրադարձությունները չենք փոխարինում ֆոնդային սյուժեներով։ Այստեղ կհայտնվեն միայն կոնկրետ իրադարձությանը կապվող լուսանկարներն ու ստուգելի տվյալները։',
      emptyMeta: 'Լուսանկար · ամսաթիվ · նկարագրություն',
      allEvents: 'Բոլոր իրադարձությունները',
      items: []
    },
    finalCta: {
      eyebrow: 'ԵԿԵՔ ՔՆՆԱՐԿԵՆՔ ՁԵՐ ՆԱԽԱԳԻԾԸ',
      title: 'Մաքուր էներգիան դարձնենք ձեր ապագայի մի մասը',
      copy: 'Թողեք հայտ՝ սկսենք ձեր տան կամ բիզնեսի համար հասկանալի նախնական հաշվարկից։',
      primary: 'Ստանալ հաշվարկ',
      secondary: 'Կապվել մեզ հետ',
      note: ['Մաքուր', 'էներգիա։', 'Իրական', 'լուծումներ։']
    }
  },
  en: {
    meta: {
      title: 'About YOURENERGY | Solar energy in Armenia',
      description:
        'YOURENERGY brings an engineering approach to solar energy in Armenia. Company records and supporting materials are published transparently.',
      ogTitle: 'YOURENERGY — more than solar energy',
      ogDescription:
        'Explore YOURENERGY’s approach, legal records and supporting company materials.'
    },
    hero: {
      eyebrow: 'ABOUT THE COMPANY',
      titleLead: 'More than',
      titleAccent: 'solar energy.',
      copy: 'We help homes and businesses in Armenia make energy understandable, resilient and manageable — from the first idea to support after commissioning.',
      signals: [
        { icon: 'leaf', title: 'A cleaner environment', copy: 'for living' },
        { icon: 'faq-home', title: 'Energy independence', copy: 'and comfort' },
        { icon: 'chart-bars', title: 'A sustainable', copy: 'future' }
      ],
      aside: ['We design.', 'We deliver.', 'We support.'],
      scroll: 'Scroll to learn more'
    },
    approach: {
      eyebrow: 'OUR APPROACH',
      title: 'Considered solutions for real people',
      copy: 'We combine engineering discipline, clear communication and care for each site so the path to solar remains transparent at every step.',
      action: 'How a project works',
      items: [
        {
          icon: 'satellite',
          title: 'Engineering first',
          copy: 'We begin with the task and parameters of the specific site.'
        },
        {
          icon: 'cycle',
          title: 'Full cycle',
          copy: 'We guide the journey from estimate through system commissioning.'
        },
        {
          icon: 'shield-check',
          title: 'Transparency',
          copy: 'We record the inputs, assumptions and next steps.'
        },
        {
          icon: 'support',
          title: 'Client support',
          copy: 'We stay in touch once the system is already running.'
        }
      ]
    },
    certificates: {
      eyebrow: 'CERTIFICATES',
      title: 'Quality, supported by source documents',
      copy: 'Only documents supplied by YOURENERGY and suitable for independent verification are published here. Each document includes a preview and a link to the original PDF.',
      emptyTitle: 'Verified certificates have not been published yet',
      emptyCopy:
        'We do not show mock-ups or claim certificates without a verified document. This section will contain only checked originals with a title, date, preview and PDF.',
      emptyNote: 'Materials are published only after the originals are verified.',
      openPdf: 'Open PDF',
      preview: 'Document preview',
      items: []
    },
    company: {
      eyebrow: 'COMPANY DOCUMENTS',
      title: 'Legal transparency',
      copy: 'Official information about the legal entity is kept separate from equipment and qualification certificates.',
      recordLabel: 'State registration details',
      facts: [
        { label: 'Legal name', value: 'YOUR ENERGY LLC' },
        { label: 'State registration', value: '17 Aug 2026' },
        { label: 'Registration number', value: '999.110.1603227' },
        { label: 'Tax ID', value: '02338724' }
      ],
      addressLabel: 'Legal address',
      address: '48 Artashisyan Street, building 14, Shengavit, Yerevan 0039',
      source: 'Source: extract from the State Unified Register dated 17 Aug 2026',
      verification: 'Reference number: RBE4-88FA-4C78-8ECF',
      filesTitle: 'Official company PDFs',
      filesCopy:
        'Registration documents, extracts and other supporting PDFs are published here after the originals are received and verified.',
      emptyTitle: 'Official PDFs have not been published yet',
      emptyCopy:
        'Files are published only after the originals are received. Company legal documents are kept separate from certificates and do not substitute for them.',
      openPdf: 'Open PDF',
      preview: 'Document preview',
      items: []
    },
    partners: {
      eyebrow: 'OUR PARTNERS',
      title: 'Partnerships you can verify',
      copy: 'We publish a logo and status only when a company’s relationship with YOURENERGY is supported by materials suitable for publication.',
      emptyTitle: 'Verified partnerships have not been published yet',
      emptyCopy:
        'We do not use manufacturer logos as an assertion of an official partnership. This section will contain only relationships with documented status.',
      emptyNote: 'Confirmed partnerships only.',
      items: []
    },
    events: {
      eyebrow: 'EVENTS & MILESTONES',
      title: 'Growing through knowledge and partnership',
      copy: 'Only real YOURENERGY materials from exhibitions, training, meetings and certification events are published here, with a date, title and short context.',
      emptyTitle: 'Event materials have not been published yet',
      emptyCopy:
        'We do not replace real events with stock scenes. This section will contain only photographs and information that can be tied to a specific event.',
      emptyMeta: 'Photo · date · description',
      allEvents: 'All events',
      items: []
    },
    finalCta: {
      eyebrow: 'LET’S DISCUSS YOUR PROJECT',
      title: 'Make clean energy part of your future',
      copy: 'Send an enquiry and we will begin with a clear preliminary estimate for your home or business.',
      primary: 'Get an estimate',
      secondary: 'Contact us',
      note: ['Clean', 'energy.', 'Real', 'solutions.']
    }
  }
};

export default Object.freeze(aboutPageCopy);
