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

export const contactPageCopy = Object.freeze({
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
        title: 'Պլանավորել հանդիպում',
        value: 'Առցանց կամ գրասենյակում',
        href: '#contact-form',
        meeting: true
      }
    ],
    officesEyebrow: 'Մեր գրասենյակները',
    officesTitle: 'Մեր գրասենյակները',
    officesIntro: 'Եկեք հյուր։ Հաճույքով կհանդիպենք ու անձամբ կքննարկենք ձեր նախագիծը։',
    route: 'Կառուցել երթուղի',
    showOnMap: 'Ցույց տալ քարտեզում',
    offices: [
      office(
        'Երևան — Գլխավոր գրասենյակ',
        'Արտաշիսյան փ., 48, Երևան',
        CONTACT_HOURS.hy.office,
        '48 Artashesyan St, Yerevan',
        [40.151219, 44.474063]
      ),
      office(
        'Զովունի — Ներկայացուցչություն',
        '26-րդ փ., 33, Զովունի, Կոտայք',
        CONTACT_HOURS.hy.office,
        '40.235773, 44.490821',
        [40.235773, 44.490821]
      )
    ],
    formEyebrow: 'Հարցեր մնացի՞ն',
    formTitle: 'Գրեք մեզ',
    formIntro: 'Լրացրեք ձևը, և մենք շուտով կկապվենք ձեզ հետ։',
    name: 'Ձեր անունը',
    phone: 'Հեռախոս',
    email: 'Էլ․ փոստ',
    topic: 'Թեմա',
    message: 'Ձեր հաղորդագրությունը',
    meeting: {
      title: 'Պլանավորել հանդիպում',
      copy: 'Ընտրեք ձեզ հարմար օրն ու ժամը։',
      selectDate: 'Ընտրեք օրը',
      selectTime: 'Ընտրեք ժամը',
      previousMonth: 'Նախորդ ամիս',
      nextMonth: 'Հաջորդ ամիս',
      selectedDate: 'Ընտրված օր',
      selectedMeeting: 'Ընտրված հանդիպում',
      contactTitle: 'Թողեք ձեր տվյալները',
      contactCopy: 'Մուտքագրեք անունը և հեռախոսահամարը, և մեր ինժեները կկապվի ձեզ հետ։',
      submit: 'Ուղարկել հանդիպման հայտը',
      sending: 'Ուղարկում ենք հանդիպման հայտը…',
      invalid: 'Մուտքագրեք անունը և ճիշտ հեռախոսահամար։',
      invalidSelection: 'Սկզբում ընտրեք օրը և ժամը։',
      unavailable:
        'Չհաջողվեց ուղարկել հանդիպման հայտը։ Խնդրում ենք փորձել ավելի ուշ կամ զանգահարել մեզ։',
      success:
        'Շնորհակալություն։ Հանդիպման հայտը ուղարկված է։ Մեր ինժեները շուտով կկապվի ձեզ հետ։',
      noTimes: 'Այս օրվա համար հասանելի ժամեր չկան։',
      close: 'Փակել',
      message: 'Կցանկանայի հանդիպում պլանավորել {date}-ին՝ {time}-ին (առցանց կամ գրասենյակում)։'
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
    success: 'Շնորհակալություն։ Ձեր հաղորդագրությունն ընդունվել է, շուտով կկապվենք։',
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
        copy: 'Կօգնենք ընտրել ձեր խնդրի համար հարմար լուծումը։'
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
        title: 'Запланировать встречу',
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
        'Ереван — Главный офис',
        'ул. Арташисьяна, 48/14, Ереван',
        CONTACT_HOURS.ru.office,
        'Artashisyan Street 48/14, Yerevan',
        [40.2272612, 44.5454473]
      ),
      office(
        'Зовуни — Представительство',
        '26-я ул., 33, Зовуни, Котайк',
        CONTACT_HOURS.ru.office,
        '26th Street 33, Zovuni, Armenia',
        [40.1590219, 44.5387532]
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
      title: 'Запланировать встречу',
      copy: 'Выберите удобные день и время.',
      selectDate: 'Выберите день',
      selectTime: 'Выберите время',
      previousMonth: 'Предыдущий месяц',
      nextMonth: 'Следующий месяц',
      selectedDate: 'Выбранный день',
      selectedMeeting: 'Выбранная встреча',
      contactTitle: 'Оставьте контакты',
      contactCopy: 'Укажите имя и номер телефона — инженер свяжется с вами.',
      submit: 'Отправить заявку на встречу',
      sending: 'Отправляем заявку на встречу…',
      invalid: 'Укажите имя и корректный номер телефона.',
      invalidSelection: 'Сначала выберите день и время.',
      unavailable: 'Не удалось отправить заявку на встречу. Попробуйте позже или позвоните нам.',
      success: 'Спасибо! Заявка на встречу отправлена. Инженер скоро свяжется с вами.',
      noTimes: 'На этот день свободного времени нет.',
      close: 'Закрыть',
      message: 'Хочу запланировать встречу на {date} в {time} (онлайн или в офисе).'
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
    success: 'Спасибо! Сообщение принято — мы скоро свяжемся с вами.',
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
        title: 'Book a meeting',
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
        'Yerevan — Head office',
        '48/14 Artashisyan St., Yerevan',
        CONTACT_HOURS.en.office,
        'Artashisyan Street 48/14, Yerevan',
        [40.2272612, 44.5454473]
      ),
      office(
        'Zovuni — Representative office',
        '33, 26th St., Zovuni, Kotayk',
        CONTACT_HOURS.en.office,
        '26th Street 33, Zovuni, Armenia',
        [40.1590219, 44.5387532]
      )
    ],
    formEyebrow: 'Have questions?',
    formTitle: 'Write to us',
    formIntro: 'Fill in the form and we will get in touch shortly.',
    name: 'Your name',
    phone: 'Phone',
    email: 'Эл. почта',
    topic: 'Topic',
    message: 'Your message',
    meeting: {
      title: 'Book a meeting',
      copy: 'Choose a convenient day and time.',
      selectDate: 'Choose a day',
      selectTime: 'Choose a time',
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
      selectedDate: 'Selected day',
      selectedMeeting: 'Selected meeting',
      contactTitle: 'Leave your contact details',
      contactCopy: 'Enter your name and phone number and an engineer will contact you.',
      submit: 'Send meeting request',
      sending: 'Sending meeting request…',
      invalid: 'Enter your name and a valid phone number.',
      invalidSelection: 'Choose a day and time first.',
      unavailable: 'We could not send the meeting request. Please try again later or call us.',
      success: 'Thank you. Your meeting request was sent and an engineer will contact you shortly.',
      noTimes: 'There are no available times for this day.',
      close: 'Close',
      message: 'I would like to book a meeting for {date} at {time} (online or at the office).'
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
    success: 'Thank you. Your message was accepted and we will contact you shortly.',
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
