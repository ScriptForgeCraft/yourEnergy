const months = [
  ['Jan', 'January', 600, 32],
  ['Feb', 'February', 750, 41],
  ['Mar', 'March', 1050, 57],
  ['Apr', 'April', 1350, 73],
  ['May', 'May', 1600, 86],
  ['Jun', 'June', 1750, 95],
  ['Jul', 'July', 1850, 100],
  ['Aug', 'August', 1750, 95],
  ['Sep', 'September', 1450, 78],
  ['Oct', 'October', 1100, 59],
  ['Nov', 'November', 750, 41],
  ['Dec', 'December', 600, 32]
].map(([short, name, value, percent]) => ({ short, name, value, percent }));

export default {
  locale: 'en',
  localeCode: 'en_US',
  localeName: 'English',
  path: '/en/',
  homeHref: '/en/',
  supportBase: '/en',
  meta: {
    title: 'Solar systems and a personal estimate in Armenia | YOURENERGY',
    description:
      'Estimate your home’s solar potential, compare three options and explore a Solar Passport example. A demonstration solar-system estimate for Armenia.',
    ogTitle: 'Your home’s solar potential in 60 seconds | YOURENERGY',
    ogDescription:
      'A preliminary demonstration estimate for a solar system, generation and savings.'
  },
  aria: {
    skip: 'Skip to main content',
    primaryNav: 'Primary navigation',
    mobileNav: 'Mobile navigation',
    languageNav: 'Language selection',
    menu: 'Open navigation menu',
    logo: 'YOURENERGY — home page',
    previousProject: 'Previous project',
    nextProject: 'Next project',
    previousTestimonial: 'Previous testimonial',
    nextTestimonial: 'Next testimonial',
    close: 'Close'
  },
  nav: {
    home: 'For homes',
    business: 'For business',
    projects: 'Projects',
    process: 'How it works',
    about: 'About us',
    blog: 'Blog',
    contacts: 'Contact'
  },
  contact: {
    phone: '+374 91 095 950',
    phoneHref: 'tel:+37491095950',
    address: 'Artashisyan 48 14 Kotayq, Zovuni, 26 33 str, Yerevan',
    hours: 'Open until 21:00',
    note: 'Contact details provided by Your Energy LLC.'
  },
  common: {
    cta: 'Calculate my home',
    demo: 'Demonstration example',
    illustrative: 'Illustrative image',
    soon: 'Coming soon',
    details: 'View details',
    free: 'Free'
  },
  hero: {
    eyebrow: 'A personal solar-system estimate for your home',
    titleLead: 'Discover your home’s',
    titleMiddle: 'solar potential',
    titleAccent: 'in 60 seconds',
    copy: 'Enter an address and the YOURENERGY demo tool will show an example of roof analysis, generation and savings.',
    disclosure:
      'This is a demonstration estimate. It does not replace a site visit, engineering design or commercial proposal.',
    addressLabel: 'Your home address',
    addressPlaceholder: 'For example: Yerevan, Arabkir',
    addressHelp: 'The address is processed only in this browser and is not geocoded.',
    analyze: 'Analyse',
    uploadTitle: 'Upload your electricity bill',
    uploadPrompt: 'Choose a file or drag it here',
    uploadHelp: 'PDF, JPG or PNG up to 10 MB. The file is not sent to a server.',
    removeFile: 'Remove file',
    benefits: [
      'No call or obligation',
      'ENA tariffs — future integration',
      'PVGIS — future integration',
      'A scenario for your home'
    ]
  },
  map: {
    title: 'Preliminary roof assessment',
    demo: 'Demonstration profile',
    location: 'Yerevan, Arabkir',
    imageAlt: 'Demonstration aerial roof image with no real geocoding',
    disclosure: 'The image, address and panel layout are for demonstration only.',
    interactive: 'Interactive roof diagram',
    roofArea: 'Roof area',
    roofAreaValue: '124 m²',
    orientation: 'Orientation',
    orientationValue: 'South-west (236°)',
    tilt: 'Tilt',
    tiltValue: '32°',
    score: 'Solar Score',
    scoreValue: 'Excellent',
    result: 'Preliminary demo result',
    full: 'View the full estimate'
  },
  metrics: [
    { key: 'generation', label: 'Annual generation', value: '14,600', unit: 'kWh' },
    { key: 'savings', label: 'Annual savings', value: '720,000', unit: '֏' },
    { key: 'payback', label: 'Simple payback', value: '≈ 6.0', unit: 'years' },
    { key: 'coverage', label: 'Consumption covered', value: '92', unit: '%' }
  ],
  passport: {
    eyebrow: 'A digital report for your property',
    title: 'Your personal Solar Passport',
    badge: 'free example',
    copy: 'A roof map, system parameters, monthly generation and a clear financial model in one report.',
    features: [
      'Roof map and example panel layout',
      'Monthly generation',
      'A 25-year financial model',
      'Recommended equipment',
      'Estimate assumptions and limitations'
    ],
    cta: 'View report example',
    dialogTitle: 'Demonstration Solar Passport',
    close: 'Close report',
    reportLabel: 'SOLAR PASSPORT',
    reportAddress: 'Yerevan, Arabkir',
    reportDate: 'Example dated 28 August 2026',
    system: 'Recommended system',
    capacity: '9.86 kWp',
    panels: '17 × 580 W',
    source: 'Source: demonstration model',
    chartTitle: 'Monthly generation, kWh',
    chartDescription: 'A bar chart showing demonstration generation from January to December.',
    tableTitle: 'Monthly generation data table',
    monthLabel: 'Month',
    months
  },
  trust: {
    disclosure: 'Data sources are not connected in this version.',
    items: [
      { icon: 'satellite', title: 'PVGIS and satellite data', note: 'integration is planned' },
      { icon: 'calculator', title: 'An accurate home scenario', note: 'after data connections' },
      { icon: 'shield', title: 'Equipment selection', note: 'based on site parameters' },
      { icon: 'cycle', title: 'End-to-end service', note: 'from estimate to support' },
      {
        icon: 'support',
        title: 'Support after installation',
        note: 'terms are set in the contract'
      }
    ]
  },
  solutions: {
    eyebrow: 'Solutions',
    title: 'Three practical solutions for your home',
    copy: 'Compare capacity, generation and indicative cost. All figures are demonstrations.',
    disclaimer:
      'The final configuration, price and outcome depend on the property and are confirmed after a site visit.',
    items: [
      {
        name: 'Starter',
        subtitle: 'Lower initial investment',
        capacity: '6.2 kWp',
        generation: '9,200 kWh / year',
        price: 'from 2,950,000 ֏',
        popular: false,
        details: [
          '10–12 panels in the selected class',
          'Estimated area: 34–40 m²',
          'Inverter, installation and basic monitoring'
        ]
      },
      {
        name: 'Optimal',
        subtitle: 'The best balance of cost and return',
        capacity: '9.86 kWp',
        generation: '14,600 kWh / year',
        price: '4,300,000 ֏',
        badge: 'Popular demo option',
        popular: true,
        details: [
          '17 × 580 W panels',
          'Estimated area: 54–62 m²',
          'Inverter, design, installation and monitoring'
        ]
      },
      {
        name: 'Energy independence',
        subtitle: 'Maximum coverage plus a battery',
        capacity: '12.5 kWp + 10 kWh',
        generation: '18,900 kWh / year',
        price: 'from 6,750,000 ֏',
        popular: false,
        details: [
          'Higher-capacity system',
          '10 kWh battery in the demonstration configuration',
          'Hybrid inverter and backup scenarios'
        ]
      }
    ]
  },
  projects: {
    eyebrow: 'Projects',
    title: 'What YOURENERGY projects could look like',
    copy: 'Illustrative scenarios, not real clients, addresses or completed installations.',
    badge: 'Demo project',
    before: 'Before installation',
    after: 'After installation',
    imageNote: 'The image and data were created to demonstrate the interface.',
    items: [
      {
        id: 'arabkir',
        city: 'Yerevan, Arabkir',
        image: 'project-arabkir',
        before: '68,000 ֏ / month',
        after: '≈ 8,000 ֏ / month',
        capacity: '9.86 kWp',
        generation: '14,600 kWh/year',
        payback: '≈ 6.0 years',
        featured: true
      },
      {
        id: 'abovyan',
        city: 'Abovyan',
        image: 'project-abovyan',
        capacity: '7.2 kWp',
        generation: '10,150 kWh/year',
        payback: '5.9 years'
      },
      {
        id: 'vagharshapat',
        city: 'Vagharshapat',
        image: 'project-vagharshapat',
        capacity: '10.8 kWp',
        generation: '15,700 kWh/year',
        payback: '6.1 years'
      },
      {
        id: 'ararat',
        city: 'Ararat',
        image: 'project-ararat',
        capacity: '5.6 kWp',
        generation: '7,800 kWh/year',
        payback: '6.4 years'
      }
    ]
  },
  process: {
    eyebrow: 'Customer journey',
    title: 'How it works',
    note: 'The first three steps work as a demonstration. The remaining steps describe the intended service process.',
    steps: [
      ['Enter your address', 'and a few home details'],
      ['Receive an estimate', 'for a demo roof profile'],
      ['Compare the estimate', 'and three system options'],
      ['Engineer site visit', 'to measure the roof and electrical panel'],
      ['System installation', 'after the design and contract'],
      ['Monitoring', 'and support after start-up']
    ].map(([title, copy], index) => ({ number: String(index + 1).padStart(2, '0'), title, copy }))
  },
  finance: {
    eyebrow: 'Financial model',
    title: 'An investment that works every day',
    copy: 'A conservative demonstration scenario with no hidden tariff growth.',
    benefits: [
      'Lower grid consumption',
      'Panels designed for more than 25 years of service',
      'Greater energy independence',
      'A transparent formula with no hidden assumptions'
    ],
    timelineTitle: 'How the net result grows',
    timeline: [
      { year: 'Today', value: '−4.3m ֏', percent: 2 },
      { year: 'Year 5', value: '−0.7m ֏', percent: 27 },
      { year: 'Year 6', value: '+20k ֏', percent: 34 },
      { year: 'Year 10', value: '+2.9m ֏', percent: 51 },
      { year: 'Year 25', value: '+13.7m ֏', percent: 94 }
    ],
    includedTitle: 'What the demo cost includes',
    included: [
      'Solar panels',
      'Inverter',
      'Installation and materials',
      'Design',
      'Grid connection',
      'System monitoring',
      'Example warranty service'
    ],
    disclaimer:
      '4,300,000 ֏ ÷ 720,000 ֏/year = 5.97 years. Tariff growth, degradation, service, financing and discounting are not included. Gross savings over 25 years: 18.0m ֏.'
  },
  engineering: {
    eyebrow: 'A human check',
    title: 'First we estimate digitally. Then we check on site.',
    copy: 'A final offer is made only after an on-site inspection and engineering review of the property.',
    items: [
      'Roof condition and load-bearing capacity',
      'Shading, tilt and orientation',
      'Electrical panel and cable routes',
      'Protection, grounding and connection'
    ],
    imageAlt: 'Illustrative image of an engineer inspecting a solar system',
    imageNote: 'The person shown is not a confirmed YOURENERGY employee.'
  },
  equipment: {
    title: 'Equipment a project may use',
    note: 'Brand mentions do not confirm a partnership, availability or official status.',
    brands: ['LONGi', 'JA Solar', 'Jinko Solar', 'Huawei', 'Growatt', 'Deye', 'Canadian Solar']
  },
  myEnergy: {
    eyebrow: 'MyEnergy · coming soon',
    title: 'Your generation, always in view',
    copy: 'A demonstration teaser for a future post-installation customer portal.',
    metrics: [
      ['Today', '42.8 kWh'],
      ['This month', '1.17 MWh'],
      ['Estimated savings', '61,420 ֏'],
      ['System status', 'Everything is working normally']
    ].map(([label, value]) => ({ label, value })),
    cta: 'Customer portal',
    note: 'Live monitoring is not connected in this version.'
  },
  testimonials: {
    eyebrow: 'The human context',
    title: 'What a testimonials section could look like',
    disclosure:
      'All names and quotations below are fictional and are used only to demonstrate the design.',
    items: [
      {
        name: 'Homeowner · demo persona',
        city: 'Yerevan',
        quote:
          'The sample estimate made it easy to compare system sizes and understand which details need confirmation.'
      },
      {
        name: 'Small-business representative · demo persona',
        city: 'Abovyan',
        quote:
          'Generation and the financial model are collected in one clear scenario without unnecessary promises.'
      },
      {
        name: 'Homeowner · demo persona',
        city: 'Ararat',
        quote:
          'The Solar Passport shows which questions are worth asking an engineer during a site visit.'
      }
    ]
  },
  faq: {
    eyebrow: 'Answers without the fine print',
    title: 'Frequently asked questions',
    items: [
      [
        'How much does a solar system cost?',
        'This page shows demonstration options from 2,950,000 ֏. Actual cost depends on capacity, roof, equipment and connection, and is confirmed only after a site visit.'
      ],
      [
        'How is system capacity calculated?',
        'A real project considers consumption, available roof area, orientation, shading and grid limitations. This version selects one of several fixed demo profiles.'
      ],
      [
        'What is the payback period?',
        'In the base example, 4,300,000 ֏ is divided by annual savings of 720,000 ֏: 5.97 years, rounded to approximately 6.0 years. Tariff growth and additional costs are not included.'
      ],
      [
        'Do solar panels need maintenance?',
        'Periodic inspection, monitoring checks and cleaning when needed help maintain the system. The exact schedule depends on the equipment and site conditions.'
      ],
      [
        'What happens in cloudy weather?',
        'Generation is lower and stops at night. The home uses the grid or a battery if one is included in the confirmed project.'
      ],
      [
        'Can I install a battery?',
        'Yes. A battery appears in the Energy independence demo option. Actual capacity is selected from the consumption profile and required backup time.'
      ],
      [
        'Can I finance a system?',
        'This version does not advertise a financing programme. Financing terms can be published only after a specific partner and agreement are confirmed.'
      ],
      [
        'What is a Solar Passport?',
        'It is a demonstration report format with a roof assessment, system, generation and financial model. It is not an engineering design, bank document or offer.'
      ]
    ].map(([question, answer]) => ({ question, answer }))
  },
  finalCta: {
    title: 'Ready to discover your home’s potential?',
    copy: 'Get a demonstration estimate and learn which details are needed for an accurate project.',
    primary: 'Calculate my home',
    secondary: 'View Solar Passport',
    note: 'Free, with no obligation and no commercial promise.'
  },
  footer: {
    description:
      'Solar systems for homes and businesses: audit, design, installation, service and monitoring.',
    columns: [
      {
        title: 'For homes',
        links: [
          ['Solutions', '#solutions'],
          ['Calculator', '#calculator'],
          ['Cost', '#solutions'],
          ['FAQ', '#faq']
        ]
      },
      {
        title: 'For business',
        links: [
          ['Solutions', '/en/soon/#business'],
          ['Projects', '#projects'],
          ['Benefits', '#investment'],
          ['Calculator', '#calculator']
        ]
      },
      {
        title: 'Company',
        links: [
          ['About us', '#engineering'],
          ['Our team', '/en/soon/#team'],
          ['Certificates', '/en/soon/#certificates'],
          ['Careers', '/en/soon/#career']
        ]
      },
      {
        title: 'Support',
        links: [
          ['Warranty', '/en/soon/#warranty'],
          ['Service', '/en/soon/#service'],
          ['Documents', '/en/soon/#documents'],
          ['Contact', '#contacts']
        ]
      }
    ],
    account: 'Customer portal →',
    privacy: 'Draft privacy policy',
    terms: 'Draft terms of use',
    copyright: '© 2026 YOURENERGY. All rights reserved.'
  },
  status: {
    minAddress: 'Enter an address of at least 5 characters.',
    analyzing: 'Preparing a demonstration estimate…',
    ready: 'The demonstration result is ready. The address was not geocoded.',
    unavailable: 'The demo estimate is currently unavailable. Please try again.',
    profileArabkir: 'The Arabkir demonstration profile was selected. The address was not geocoded.',
    profileAbovyan: 'The Abovyan demonstration profile was selected. The address was not geocoded.',
    profileArarat: 'The Ararat demonstration profile was selected. The address was not geocoded.',
    profileDefault:
      'The standard Yerevan demonstration profile was selected. The address was not geocoded.',
    invalidFile: 'This format is not supported. Choose a PDF, JPG, JPEG or PNG.',
    largeFile: 'The file is too large. The maximum size is 10 MB.',
    fileSelected: 'The file was selected and remains only in browser memory.',
    fileRemoved: 'File removed.',
    mapReady: 'The interactive demonstration map is enabled.',
    mapFailed: 'The map could not be enabled. The static image remains available.',
    monthTooltip: 'Generation in {month}: {value} kWh'
  }
};
