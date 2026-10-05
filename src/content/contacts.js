import { CONTACT_HOURS } from './contact-hours.js';

const mapsUrl = (query) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

const office = (title, address, hours, mapQuery, coordinates) => ({
  title,
  address,
  hours,
  mapQuery,
  coordinates: Object.freeze(coordinates),
  latitude: coordinates[0],
  longitude: coordinates[1],
  href: mapsUrl(mapQuery)
});

const baseContactPageCopy = Object.freeze({
  hy: {
    meta: {
      title: 'Կապ | YOURENERGY',
      description:
        'Կապվեք YOURENERGY-ի հետ՝ արևային համակարգի նախագծման, հաշվարկի և տեղադրման համար։',
      ogTitle: 'Կապվեք YOURENERGY-ի հետ',
      ogDescription: 'Պատասխանենք հարցերին, կհաշվարկենք նախագիծը և կօգնենք սկսել։'
    },
    eyebrow: 'Կապ',
    title: 'Կապվեք\n<span>մեզ հետ</span>',
    intro:
      'Մենք միշտ կապի մեջ ենք՝ պատասխանելու հարցերին, հաշվարկելու նախագիծը և օգնելու կատարել առաջին քայլը դեպի մաքուր էներգիա։',
    signature: 'Մաքուր էներգիան\nավելի մոտ է,\nքան կարծում եք',
    channels: [
      {
        icon: 'phone',
        title: 'Զանգահարեք մեզ',
        value: '+374 91 095 950',
        href: 'tel:+37491095950'
      },
      {
        icon: 'mail',
        title: 'Գրեք մեզ',
        value: 'info@yourenergy.am',
        href: 'mailto:info@yourenergy.am'
      },
      {
        icon: 'whatsapp',
        title: 'Գրեք WhatsApp-ով',
        value: 'Արագ պատասխան',
        href: 'https://wa.me/37491095950',
        external: true
      },
      {
        icon: 'calendar',
        title: 'Հանդիպման հարցում',
        value: 'Առցանց կամ գրասենյակում',
        href: '#contact-form',
        meeting: true
      }
    ],
    officesEyebrow: 'Մեր գրասենյակները',
    officesTitle: 'Մեր գրասենյակները',
    officesIntro: 'Եկեք հյուր։ Հաճույքով կհանդիպենք ու անձամբ կքննարկենք Ձեր նախագիծը։',
    route: 'Կառուցել երթուղի',
    showOnMap: 'Ցույց տալ քարտեզում',
    offices: [
      office(
        'Երևան',
        'Երևան, Արտաշիսյան փ., 48/14',
        CONTACT_HOURS.hy.office,
        '40.151219, 44.474063',
        [40.151219, 44.474063]
      ),
      office(
        'Զովունի',
        'Զովունի, 26-րդ փողոց, 33',
        CONTACT_HOURS.hy.office,
        '40.235773, 44.490821',
        [40.235773, 44.490821]
      )
    ],
    formEyebrow: 'Հարցեր մնացի՞ն',
    formTitle: 'Գրեք մեզ',
    formIntro: 'Լրացրեք ձևը, և մենք շուտով կկապվենք Ձեզ հետ։',
    name: 'Ձեր անունը',
    phone: 'Հեռախոս',
    email: 'Էլ․ փոստ',
    topic: 'Թեմա',
    message: 'Ձեր հաղորդագրությունը',
    meeting: {
      title: 'Հանդիպման հարցում',
      copy: 'Ընտրեք նախընտրելի օրն ու ժամը՝ Երևանի ժամանակով։ Հասանելիությունը կհաստատենք կապվելիս։',
      selectDate: 'Ընտրեք օրը',
      selectTime: 'Ընտրեք ժամը',
      back: 'Հետ',
      previousMonth: 'Նախորդ ամիս',
      nextMonth: 'Հաջորդ ամիս',
      selectedDate: 'Ընտրված օր',
      selectedMeeting: 'Ընտրված հանդիպում',
      contactTitle: 'Թողեք Ձեր տվյալները',
      contactCopy:
        'Մուտքագրեք անունն ու հեռախոսահամարը, և ինժեները կհաստատի ընտրված ժամանակի հասանելիությունը։',
      privacyBefore:
        'Ձեր տվյալներն օգտագործվում են YOURENERGY-ի կողմից՝ հանդիպման հարցումը մշակելու համար՝ ',
      privacyLink: 'Գաղտնիության քաղաքականության համաձայն',
      privacyAfter: '։',
      submit: 'Ուղարկել հանդիպման հարցումը',
      sending: 'Ուղարկում ենք հանդիպման հարցումը…',
      invalid: 'Մուտքագրեք անունը և ճիշտ հեռախոսահամար։',
      invalidSelection: 'Սկզբում ընտրեք օրը և ժամը։',
      unavailable:
        'Չհաջողվեց ուղարկել հանդիպման հայտը։ Խնդրում ենք փորձել ավելի ուշ կամ զանգահարել մեզ։',
      success: {
        title: 'Շնորհակալություն։ Ձեր հայտը ուղարկված է։',
        text: 'Ինժեները շուտով կապ կհաստատի Ձեզ հետ։',
        close: 'Փակել'
      },
      noTimes: 'Այս օրվա համար հասանելի ժամեր չկան։',
      close: 'Փակել',
      message:
        'Կցանկանայի հանդիպման հարցում ուղարկել {date}-ին՝ {time}-ին (առցանց կամ գրասենյակում)։'
    },
    topicOptions: ['Համակարգի հաշվարկ', 'Տեղազննում', 'Սարքավորումներ', 'Այլ հարց'],
    consent: {
      before: 'Համաձայն եմ ',
      link: 'Գաղտնիության քաղաքականությանը',
      after: ' և տալիս եմ համաձայնություն անձնական տվյալների մշակմանը'
    },
    submit: 'Ուղարկել հաղորդագրությունը',
    sending: 'Ուղարկում ենք հաղորդագրությունը…',
    invalid: 'Լրացրեք անունը, հեռախոսը և համաձայնությունը։',
    unavailable:
      'Չհաջողվեց ուղարկել հաղորդագրությունը։ Խնդրում ենք փորձել ավելի ուշ կամ զանգահարել մեզ։',
    success: {
      title: 'Շնորհակալություն։ Ձեր հայտը ուղարկված է։',
      text: 'Ինժեները շուտով կապ կհաստատի Ձեզ հետ։',
      close: 'Փակել'
    },
    cardTitle: 'Միասին՝\nմաքուր էներգիայի\nճանապարհին',
    cardCopy: 'Խորհրդատվություն · Հաշվարկ · Նախագիծ · Տեղադրում',
    benefits: [
      {
        icon: 'whatsapp',
        title: 'Արագ պատասխան',
        copy: 'Սովորաբար պատասխանում ենք մի քանի ժամվա ընթացքում։'
      },
      {
        icon: 'support',
        title: 'Մասնագիտական խորհրդատվություն',
        copy: 'Կօգնենք ընտրել Ձեր խնդրի համար հարմար լուծումը։'
      },
      {
        icon: 'pin',
        title: 'Անհատական մոտեցում',
        copy: 'Հաշվի ենք առնում օբյեկտի ու բյուջեի առանձնահատկությունները։'
      },
      {
        icon: 'heart',
        title: 'Ամբողջական ուղեկցում',
        copy: 'Հաշվարկից մինչև գործարկում և սպասարկում։'
      }
    ]
  },
  ru: {
    meta: {
      title: 'Контакты | YOURENERGY',
      description:
        'Свяжитесь с YOURENERGY по вопросам расчёта, проектирования и установки солнечной системы.',
      ogTitle: 'Свяжитесь с YOURENERGY',
      ogDescription: 'Ответим на вопросы, рассчитаем проект и поможем начать путь к чистой энергии.'
    },
    eyebrow: 'Контакты',
    title: 'Свяжитесь\n<span>с нами</span>',
    intro:
      'Мы всегда на связи, чтобы ответить на ваши вопросы, рассчитать проект и помочь сделать первый шаг к чистой энергии.',
    signature: 'Чистая энергия\nближе,\nчем вы думаете',
    channels: [
      { icon: 'phone', title: 'Позвоните нам', value: '+374 91 095 950', href: 'tel:+37491095950' },
      {
        icon: 'mail',
        title: 'Напишите нам',
        value: 'info@yourenergy.am',
        href: 'mailto:info@yourenergy.am'
      },
      {
        icon: 'whatsapp',
        title: 'Напишите в WhatsApp',
        value: 'Быстрый ответ',
        href: 'https://wa.me/37491095950',
        external: true
      },
      {
        icon: 'calendar',
        title: 'Запросить встречу',
        value: 'Онлайн или в офисе',
        href: '#contact-form',
        meeting: true
      }
    ],
    officesEyebrow: 'Наши офисы',
    officesTitle: 'Наши офисы',
    officesIntro: 'Приходите к нам в гости. Мы будем рады встретиться и обсудить ваш проект лично.',
    route: 'Построить маршрут',
    showOnMap: 'Показать на карте',
    offices: [
      office(
        'Ереван',
        'Ереван, ул. Арташисьяна, 48/14',
        CONTACT_HOURS.ru.office,
        '40.151219, 44.474063',
        [40.151219, 44.474063]
      ),
      office(
        'Зовуни',
        'Зовуни, 26-я улица, 33',
        CONTACT_HOURS.ru.office,
        '40.235773, 44.490821',
        [40.235773, 44.490821]
      )
    ],
    formEyebrow: 'Остались вопросы?',
    formTitle: 'Напишите нам',
    formIntro: 'Заполните форму, и мы свяжемся с вами в ближайшее время.',
    name: 'Ваше имя',
    phone: 'Телефон',
    email: 'Эл. почта',
    topic: 'Тема обращения',
    message: 'Ваше сообщение',
    meeting: {
      title: 'Запросить встречу',
      copy: 'Выберите предпочтительные день и время по Еревану. Мы подтвердим доступность при связи с вами.',
      selectDate: 'Выберите день',
      selectTime: 'Выберите время',
      back: 'Назад',
      previousMonth: 'Предыдущий месяц',
      nextMonth: 'Следующий месяц',
      selectedDate: 'Выбранный день',
      selectedMeeting: 'Выбранная встреча',
      contactTitle: 'Оставьте контакты',
      contactCopy:
        'Укажите имя и номер телефона — инженер подтвердит доступность выбранного времени.',
      privacyBefore:
        'Ваши данные используются YOURENERGY для обработки запроса на встречу в соответствии с ',
      privacyLink: 'Политикой конфиденциальности',
      privacyAfter: '.',
      submit: 'Запросить встречу',
      sending: 'Отправляем запрос на встречу…',
      invalid: 'Укажите имя и корректный номер телефона.',
      invalidSelection: 'Сначала выберите день и время.',
      unavailable: 'Не удалось отправить заявку на встречу. Попробуйте позже или позвоните нам.',
      success: {
        title: 'Спасибо! Ваша заявка отправлена.',
        text: 'Инженер скоро свяжется с вами.',
        close: 'Закрыть'
      },
      noTimes: 'На этот день свободного времени нет.',
      close: 'Закрыть',
      message: 'Хочу запросить встречу на {date} в {time} (онлайн или в офисе).'
    },
    topicOptions: ['Расчёт системы', 'Выезд специалиста', 'Оборудование', 'Другой вопрос'],
    consent: {
      before: 'Я согласен(-на) с ',
      link: 'Политикой конфиденциальности',
      after: ' и даю согласие на обработку персональных данных'
    },
    submit: 'Отправить сообщение',
    sending: 'Отправляем сообщение…',
    invalid: 'Укажите имя, телефон и согласие на обработку данных.',
    unavailable: 'Не удалось отправить сообщение. Попробуйте позже или позвоните нам.',
    success: {
      title: 'Спасибо! Ваша заявка отправлена.',
      text: 'Инженер скоро свяжется с вами.',
      close: 'Закрыть'
    },
    cardTitle: 'Вместе\nк чистой энергии',
    cardCopy: 'Консультация · Расчёт · Проект · Установка',
    benefits: [
      {
        icon: 'whatsapp',
        title: 'Быстрый ответ',
        copy: 'Обычно отвечаем в течение нескольких часов.'
      },
      {
        icon: 'support',
        title: 'Профессиональная консультация',
        copy: 'Поможем выбрать подходящее решение под ваши задачи.'
      },
      {
        icon: 'pin',
        title: 'Индивидуальный подход',
        copy: 'Учитываем особенности вашего объекта и бюджета.'
      },
      { icon: 'heart', title: 'Полный цикл', copy: 'От расчёта до запуска и обслуживания.' }
    ]
  },
  en: {
    meta: {
      title: 'Contact | YOURENERGY',
      description: 'Contact YOURENERGY about solar-system design, estimates and installation.',
      ogTitle: 'Contact YOURENERGY',
      ogDescription: 'We will answer your questions, estimate a project and help you start.'
    },
    eyebrow: 'Contact',
    title: 'Get in touch\n<span>with us</span>',
    intro:
      'We are here to answer your questions, estimate your project and help you take the first step toward clean energy.',
    signature: 'Clean energy\nis closer\nthan you think',
    channels: [
      { icon: 'phone', title: 'Call us', value: '+374 91 095 950', href: 'tel:+37491095950' },
      {
        icon: 'mail',
        title: 'Email us',
        value: 'info@yourenergy.am',
        href: 'mailto:info@yourenergy.am'
      },
      {
        icon: 'whatsapp',
        title: 'Message on WhatsApp',
        value: 'Quick reply',
        href: 'https://wa.me/37491095950',
        external: true
      },
      {
        icon: 'calendar',
        title: 'Request a meeting',
        value: 'Online or in our office',
        href: '#contact-form',
        meeting: true
      }
    ],
    officesEyebrow: 'Our offices',
    officesTitle: 'Our offices',
    officesIntro: 'Come and visit us. We will be happy to meet and discuss your project in person.',
    route: 'Get directions',
    showOnMap: 'Show on map',
    offices: [
      office(
        'Yerevan',
        'Yerevan, 48/14 Artashisyan St.',
        CONTACT_HOURS.en.office,
        '40.151219, 44.474063',
        [40.151219, 44.474063]
      ),
      office(
        'Zovuni',
        'Zovuni, 26th Street, 33',
        CONTACT_HOURS.en.office,
        '40.235773, 44.490821',
        [40.235773, 44.490821]
      )
    ],
    formEyebrow: 'Have questions?',
    formTitle: 'Write to us',
    formIntro: 'Fill in the form and we will get in touch shortly.',
    name: 'Your name',
    phone: 'Phone',
    email: 'Email',
    topic: 'Topic',
    message: 'Your message',
    meeting: {
      title: 'Request a meeting',
      copy: 'Choose your preferred day and time in Yerevan time. We will confirm availability when we contact you.',
      selectDate: 'Choose a day',
      selectTime: 'Choose a time',
      back: 'Back',
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
      selectedDate: 'Selected day',
      selectedMeeting: 'Selected meeting',
      contactTitle: 'Leave your contact details',
      contactCopy:
        'Enter your name and phone number. An engineer will confirm whether the selected time is available.',
      privacyBefore:
        'YOURENERGY uses your data to process this meeting request in accordance with the ',
      privacyLink: 'Privacy Policy',
      privacyAfter: '.',
      submit: 'Request a meeting',
      sending: 'Sending meeting request…',
      invalid: 'Enter your name and a valid phone number.',
      invalidSelection: 'Choose a day and time first.',
      unavailable: 'We could not send the meeting request. Please try again later or call us.',
      success: {
        title: 'Thank you! Your request has been sent.',
        text: 'An engineer will contact you shortly.',
        close: 'Close'
      },
      noTimes: 'There are no available times for this day.',
      close: 'Close',
      message: 'I would like to request a meeting for {date} at {time} (online or at the office).'
    },
    topicOptions: ['System estimate', 'Site visit', 'Equipment', 'Other question'],
    consent: {
      before: 'I agree to the ',
      link: 'Privacy Policy',
      after: ' and consent to the processing of my personal data'
    },
    submit: 'Send message',
    sending: 'Sending message…',
    invalid: 'Enter your name, phone number and consent.',
    unavailable: 'We could not send your message. Please try again later or call us.',
    success: {
      title: 'Thank you! Your request has been sent.',
      text: 'An engineer will contact you shortly.',
      close: 'Close'
    },
    cardTitle: 'Together\ntoward clean energy',
    cardCopy: 'Consultation · Estimate · Design · Installation',
    benefits: [
      { icon: 'whatsapp', title: 'Quick response', copy: 'We usually reply within a few hours.' },
      {
        icon: 'support',
        title: 'Professional advice',
        copy: 'We help choose the right solution for your needs.'
      },
      {
        icon: 'pin',
        title: 'Personal approach',
        copy: 'We account for the specifics of your property and budget.'
      },
      { icon: 'heart', title: 'Full service', copy: 'From estimate to commissioning and support.' }
    ]
  }
});

const CONTACT_VISUAL_COPY = Object.freeze({
  hy: {
    heroEyebrow: 'Կապ',
    heroTitle: 'Եկեք քննարկենք<br><span>Ձեր նախագիծը</span>',
    heroIntro:
      'Պատասխանենք արևային համակարգի, հաշվարկի, սարքավորումների և տեղադրման մասին Ձեր հարցերին։',
    contactCardTitle: 'Ինչով կարող ենք օգնել',
    contactCardCopy: 'Պատմեք ձեր նախագծի մասին, իսկ մենք կօգնենք ընտրել ճիշտ լուծումը։',
    helpItems: [
      {
        icon: 'calculator',
        title: 'Նախնական հաշվարկ',
        copy: 'Կգնահատենք համակարգի հզորությունն ու արտադրությունը։'
      },
      {
        icon: 'faq-settings',
        title: 'Համակարգի ընտրություն',
        copy: 'Կօգնենք ընտրել ձեր տան կամ բիզնեսի համար ճիշտ լուծումը։'
      },
      {
        icon: 'roof-measure',
        title: 'Այց և չափագրում',
        copy: 'Կգնահատենք տանիքը և տեղադրման պայմանները։'
      },
      {
        icon: 'file-text',
        title: 'Առաջարկի պատրաստում',
        copy: 'Կպատրաստենք անհատական լուծում և նախնական առաջարկ։'
      }
    ],
    formTitleRef: 'Թողնել հայտ',
    formIntroRef: 'Մի փոքր պատմեք օբյեկտի մասին — մենք կօգնենք ընտրել օպտիմալ լուծումը։',
    propertyTypeLabel: 'Օբյեկտի տեսակը',
    propertyTypes: [
      { value: 'Առանձնատուն', icon: 'faq-home', label: 'Առանձնատուն' },
      { value: 'Բնակարան', icon: 'roof-measure', label: 'Բնակարան' },
      { value: 'Կոմերցիոն օբյեկտ', icon: 'electrical-panel', label: 'Կոմերցիոն օբյեկտ' },
      { value: 'Այլ', icon: 'menu', label: 'Այլ' }
    ],
    privacyHint:
      'Ձեր տվյալներն օգտագործվում են YOURENERGY-ի կողմից՝ Ձեր հայտը մշակելու համար՝ Գաղտնիության քաղաքականության համաձայն։',
    officesProjectsTitle: 'Մեր գրասենյակները',
    officesProjectsIntro: 'Ընտրեք հասցեն՝ Google Քարտեզներում երթուղին բացելու համար։',
    calculatorTitle: 'Հաշվարկ պե՞տք է հենց հիմա',
    calculatorCopy:
      'Իմացեք համակարգի մոտավոր հզորությունն ու սպասվող արտադրությունը մի քանի րոպեում։',
    calculatorAction: 'Անցնել հաշվիչին'
  },
  ru: {
    heroEyebrow: 'Контакты',
    heroTitle: 'Давайте обсудим<br><span>ваш проект</span>',
    heroIntro: 'Ответим на вопросы по солнечной системе, расчёту, оборудованию и установке.',
    contactCardTitle: 'Чем мы можем помочь',
    contactCardCopy: 'Расскажите о вашем проекте, а мы поможем подобрать подходящее решение.',
    helpItems: [
      {
        icon: 'calculator',
        title: 'Предварительный расчёт',
        copy: 'Оценим мощность системы и ожидаемую выработку.'
      },
      {
        icon: 'faq-settings',
        title: 'Подбор системы',
        copy: 'Поможем выбрать подходящее решение для дома или бизнеса.'
      },
      {
        icon: 'roof-measure',
        title: 'Выезд и замеры',
        copy: 'Оценим крышу и условия для установки системы.'
      },
      {
        icon: 'file-text',
        title: 'Подготовка предложения',
        copy: 'Подготовим индивидуальное решение и предварительное предложение.'
      }
    ],
    formTitleRef: 'Оставить заявку',
    formIntroRef: 'Расскажите немного о вашем объекте — мы поможем подобрать оптимальное решение.',
    propertyTypeLabel: 'Тип объекта',
    propertyTypes: [
      { value: 'Частный дом', icon: 'faq-home', label: 'Частный дом' },
      { value: 'Квартира', icon: 'roof-measure', label: 'Квартира' },
      { value: 'Коммерческий объект', icon: 'electrical-panel', label: 'Коммерческий объект' },
      { value: 'Другое', icon: 'menu', label: 'Другое' }
    ],
    privacyHint:
      'Ваши данные используются YOURENERGY для обработки заявки в соответствии с Политикой конфиденциальности.',
    officesProjectsTitle: 'Наши офисы',
    officesProjectsIntro: 'Выберите адрес, чтобы построить маршрут в Google Картах.',
    calculatorTitle: 'Нужен расчёт прямо сейчас?',
    calculatorCopy:
      'Узнайте примерную мощность системы и ожидаемую выработку электроэнергии за несколько минут.',
    calculatorAction: 'Перейти к калькулятору'
  },
  en: {
    heroEyebrow: 'Contacts',
    heroTitle: 'Let’s discuss<br><span>your project</span>',
    heroIntro:
      'We’ll answer your questions about solar systems, estimates, equipment and installation.',
    contactCardTitle: 'How we can help',
    contactCardCopy: 'Tell us about your project, and we’ll help you choose the right solution.',
    helpItems: [
      {
        icon: 'calculator',
        title: 'Preliminary estimate',
        copy: 'We’ll estimate the system capacity and expected energy production.'
      },
      {
        icon: 'faq-settings',
        title: 'System selection',
        copy: 'We’ll help you choose the right solution for your home or business.'
      },
      {
        icon: 'roof-measure',
        title: 'Site visit & measurements',
        copy: 'We’ll assess the roof and installation conditions.'
      },
      {
        icon: 'file-text',
        title: 'Proposal preparation',
        copy: 'We’ll prepare a tailored solution and preliminary proposal.'
      }
    ],
    formTitleRef: 'Send a request',
    formIntroRef:
      'Tell us a little about your property — we’ll help you choose the right solution.',
    propertyTypeLabel: 'Property type',
    propertyTypes: [
      { value: 'Private home', icon: 'faq-home', label: 'Private home' },
      { value: 'Apartment', icon: 'roof-measure', label: 'Apartment' },
      { value: 'Commercial property', icon: 'electrical-panel', label: 'Commercial property' },
      { value: 'Other', icon: 'menu', label: 'Other' }
    ],
    privacyHint:
      'YOURENERGY uses your data to process your request in accordance with the Privacy Policy.',
    officesProjectsTitle: 'Our offices',
    officesProjectsIntro: 'Select an address to get directions in Google Maps.',
    calculatorTitle: 'Need an estimate right now?',
    calculatorCopy:
      'See the approximate system size and expected energy production in a few minutes.',
    calculatorAction: 'Open calculator'
  }
});

const calculatorHref = (locale) => `${locale === 'hy' ? '' : `/${locale}`}/calculator/`;

export const contactPageCopy = Object.freeze(
  Object.fromEntries(
    Object.entries(baseContactPageCopy).map(([locale, base]) => [
      locale,
      Object.freeze({
        ...base,
        ...CONTACT_VISUAL_COPY[locale],
        calculatorHref: calculatorHref(locale)
      })
    ])
  )
);
