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
      'Start a preliminary solar analysis with confirmed location, consumption input, roof outline and clear source status for Armenia.',
    ogTitle: 'Your home’s solar potential in 60 seconds | YOURENERGY',
    ogDescription:
      'A transparent preliminary solar analysis with source status and manual fallback.'
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
  product: {
    common: {
      required: 'Required field',
      optional: 'Optional',
      perMonth: 'per month',
      kwh: 'kWh',
      amd: '֏',
      complete: 'Done',
      cancel: 'Cancel',
      noJsCalculator:
        'The calculator requires JavaScript. For a manual consultation, call an engineer:'
    },
    tools: {
      calculator: 'Open the full calculator',
      offerChecker: 'Check a commercial offer'
    },
    workspace: {
      title: 'Every calculation, on one page',
      copy: 'Choose a section below. The main path moves from a point to PVGIS, roof inputs and a result; the proposal check is separate and never changes the home calculation.',
      menuLabel: 'Calculator sections',
      items: [
        {
          key: 'start',
          anchor: 'calculator-start',
          number: '01',
          label: 'Start a calculation',
          copy: 'Use an address only as a label or place a point on the map right away.',
          active: true
        },
        {
          key: 'potential',
          anchor: 'site-potential',
          number: '02',
          label: 'Point and PVGIS potential',
          copy: 'Confirm the point and receive a solar-resource benchmark.',
          active: false
        },
        {
          key: 'roof',
          anchor: 'roof-analysis',
          number: '03',
          label: 'Home, roof and consumption',
          copy: 'Outline the roof and enter its parameters and electricity use.',
          active: false
        },
        {
          key: 'result',
          anchor: 'passport',
          number: '04',
          label: 'Result and Solar Passport',
          copy: 'Review the preliminary result, assumptions and budget.',
          active: false
        },
        {
          key: 'offer',
          anchor: 'offer-checker',
          number: '05',
          label: 'Proposal checker',
          copy: 'Optional: compare a third-party proposal in AMD/Wp.',
          active: false
        }
      ]
    },
    flow: {
      title: 'How the estimate works',
      steps: [
        {
          number: '01',
          title: 'Choose the property point',
          copy: 'Place and confirm a point manually. An address is only an optional label for an engineer.'
        },
        {
          number: '02',
          title: 'See the location potential',
          copy: 'PVGIS shows a benchmark for the chosen point before your roof is calculated.'
        },
        {
          number: '03',
          title: 'Describe the roof and consumption',
          copy: 'Outline the usable area and enter the real roof direction, tilt and energy use.'
        },
        {
          number: '04',
          title: 'Get a preliminary estimate',
          copy: 'System size, budget and savings appear only from confirmed inputs.'
        }
      ]
    },
    potential: {
      eyebrow: 'Step 2 · Site potential',
      title: 'Solar benchmark for the selected point',
      loading: 'Requesting PVGIS for the confirmed point…',
      annualYieldLabel: 'Expected generation per 1 kWp each year',
      orientationLabel: 'Optimum direction for a free-standing system',
      tiltLabel: 'Optimum tilt for a free-standing system',
      source: 'Source: PVGIS · preliminary 14% system-loss assumption',
      cacheHit: 'The PVGIS response came from the protected cache; source date: {date}.',
      cacheMiss: 'PVGIS responded now; the cache protects the service from repeated requests.',
      disclosure:
        'This is a PVGIS benchmark for a fixed free-standing system at the chosen point. It is not a survey of your roof or an installation recommendation for it.',
      roofDisclosure:
        'The direction, pitch, area, shading and structural suitability of the actual roof must be entered below and confirmed by an engineer.',
      unavailable:
        'PVGIS potential could not be retrieved. Retry or contact an engineer; no example figures will be substituted.',
      contactPrefix: 'Need a manual check? Call an engineer:',
      retry: 'Retry PVGIS potential',
      continue: 'Continue to my roof estimate',
      directions: {
        north: 'north',
        northEast: 'north-east',
        east: 'east',
        southEast: 'south-east',
        south: 'south',
        southWest: 'south-west',
        west: 'west',
        northWest: 'north-west'
      }
    },
    consumption: {
      title: 'Electricity consumption',
      copy: 'This is only needed for system sizing, budget and savings — not to find an address or the potential of a point.',
      modes: {
        bill: 'Average bill',
        usage: 'Average consumption',
        monthly: 'Monthly profile'
      },
      billLabel: 'Average electricity bill',
      billHelp: 'Enter the average monthly amount in AMD.',
      tariffLabel: 'Tariff from your bill',
      tariffHelp:
        'Optional for kWh. A bill in AMD needs it to convert the amount to kWh; the Passport will mark it as user-provided.',
      usageLabel: 'Average monthly consumption',
      usageHelp: 'Enter the average monthly consumption in kWh.',
      monthlyTitle: 'Consumption over 12 months',
      monthlyHelp: 'Enter kWh for each month when those figures are available.',
      annualLabel: 'Estimated annual consumption',
      invalidNumber: 'Enter a number greater than zero.',
      invalidBill: 'Enter a valid bill amount in AMD.',
      invalidTariff: 'Enter a tariff greater than zero in AMD/kWh.',
      invalidUsage: 'Enter a valid consumption amount in kWh.',
      incompleteMonths: 'Complete all 12 months or choose a different method.',
      noConsumption: 'A consumption or bill value is needed for an estimate.',
      normalized: 'The data were normalised to an annual profile.'
    },
    location: {
      title: 'Property location',
      copy: 'The primary path is to place and confirm a point manually. An address remains only a label and is not treated as geocoding.',
      search: 'Choose a point on the map',
      searching: 'Finding address…',
      resultLabel: 'Selected point',
      confirmPrompt: 'Confirm the selected point',
      confirm: 'Confirm property',
      edit: 'Edit address',
      noResult: 'The address was not found. Select a point on the map manually.',
      unavailable: 'Address search is currently unavailable. Select a point on the map manually.',
      manualTitle: 'Select a point manually',
      manualPoint: 'Manual property point',
      manualCopy:
        'Click the map to mark the approximate property location. This is not address geocoding.',
      chooseOnMap: 'Choose a point on the map',
      useMapCenter: 'Use the map centre',
      manualUnavailable: 'Open the map to use its centre as a manual point.',
      pointSelected: 'Property point selected.',
      retry: 'Try search again',
      coordinatesTitle: 'Enter coordinates if the map is unavailable',
      coordinatesHelp:
        'Latitude and longitude are used only for PVGIS. Check them before confirming.',
      latitudeLabel: 'Latitude',
      longitudeLabel: 'Longitude',
      useCoordinates: 'Use these coordinates',
      invalidCoordinates: 'Enter valid property coordinates.'
    },
    roof: {
      title: 'Roof outline',
      copy: 'Outline the usable roof area and enter the actual roof-face parameters for a preliminary estimate.',
      mapDisclosure:
        'The map helps place a point and an approximate outline. Without aerial imagery or a 3D model, it cannot automatically detect the roof, its pitch or shading.',
      fallback: 'The map is unavailable. Enter and manually confirm the property coordinates.',
      start: 'Start outline',
      addPointAtCenter: 'Add a point at the map centre',
      addPoint: 'Add point',
      undo: 'Undo last point',
      reset: 'Clear outline',
      finish: 'Calculate from outline',
      finishHelp:
        'Enter the roof-face parameters and consumption, then request a preliminary PVGIS calculation.',
      edit: 'Edit outline',
      pointsLabel: 'Points in outline: {count}',
      minimumPoints: 'Add at least 3 points to finish the outline.',
      areaLabel: 'Preliminary roof area',
      mountingModeLabel: 'Mounting approach',
      mountingModeHelp:
        'For roof-parallel mounting, the entered plane is calculated. For an elevated system, the PVGIS benchmark is compared with the planned plane.',
      mountingModes: {
        roofParallel: 'Parallel to the roof face',
        elevated: 'Elevated / free-standing structure'
      },
      areaMethodTitle: 'How the area is provided',
      areaMethodHelp:
        'A map outline is the area from above, not the sloped roof-face area. Use a measured roof-face area for a steep roof.',
      areaMethods: {
        mapProjected: 'Map outline — projected area from above',
        measuredPlane: 'Measured roof-face area'
      },
      planeAreaLabel: 'Measured roof-face area',
      planeAreaHelp:
        'Enter the measured area of one roof face in m². It is still preliminary until an engineer visit.',
      planeAreaSummary: 'Preliminary roof-plane area used for calculation',
      orientationLabel: 'Roof-face direction',
      orientationHelp:
        'Choose the roof-face direction. A roof-specific calculation cannot be made without it; the PVGIS benchmark above remains available.',
      customOrientationLabel: 'Custom orientation (0° = north, 180° = south)',
      customOrientationHelp: 'Enter a compass bearing from 0 to 359°.',
      tiltLabel: 'This roof-face tilt',
      tiltHelp:
        'For a roof-specific calculation, enter an approximate angle from 0° to 90°. It is not detected from the address.',
      parametersRequired:
        'Enter the roof-face direction and tilt to create a roof-specific calculation.',
      angleGuideTitle: 'Visual check of the roof inputs',
      angleGuideCopy:
        'The arrow shows the roof-face direction you entered. It is different from the PVGIS free-standing benchmark above.',
      angleGuideOrientation: 'Roof-face direction',
      angleGuideTilt: 'Roof-face tilt',
      benchmarkOrientation: 'PVGIS benchmark for a free-standing plane',
      benchmarkTilt: 'PVGIS tilt benchmark for a free-standing plane',
      angleGuideUnknown: 'Not specified',
      pointSelectLabel: 'Select point {index}',
      removePoint: 'Remove point',
      nudgeNorth: 'Move point north',
      nudgeSouth: 'Move point south',
      nudgeEast: 'Move point east',
      nudgeWest: 'Move point west',
      orientationOptions: {
        north: 'North',
        southEast: 'South-east',
        southWest: 'South-west',
        east: 'East',
        south: 'South',
        west: 'West',
        unknown: 'Choose a direction',
        custom: 'Other'
      },
      unavailable: 'A roof outline has not been set yet.',
      tilesUnavailable:
        'The basemap is unavailable. You can outline the roof after selecting a point.',
      locationRequired: 'Confirm the property or select a point on the map first.'
    },
    result: {
      title: 'Preliminary analysis',
      preparing: 'Preparing the preliminary analysis…',
      ready: 'The preliminary analysis is ready.',
      unavailable: 'An analysis could not be prepared from the available data.',
      retry: 'Try calculation again',
      noTariff:
        'No tariff was entered: capacity, PVGIS generation and a preliminary price remain available, but savings and payback are not shown.',
      priceUnavailable:
        'The temporary price book is unavailable or has expired. Request an engineer survey; savings and payback also require a tariff.',
      noSavings: 'There is not enough data to show savings and payback.',
      chartDescription:
        'Monthly preliminary generation based on the confirmed inputs and returned solar-resource data.',
      confidenceTitle: 'Input-data completeness',
      confidence: {
        preliminary: 'Preliminary inputs',
        incomplete: 'Incomplete inputs',
        high: 'Preliminary inputs',
        medium: 'Preliminary inputs',
        low: 'Incomplete inputs',
        insufficient: 'Not enough data'
      },
      assumptionsTitle: 'Assumptions and limits',
      commercialEstimate:
        'Preliminary YOUR ENERGY price · {version} · not an offer: {p25}–{p75}; P50 {p50}. Valid until {validUntil}.'
    },
    solutions: {
      liveBadge: 'From your confirmed data',
      liveCopy:
        'These three preliminary technical scenarios are calculated from the confirmed property data.',
      financialUnavailable:
        'A preliminary price appears from the active PriceBook; savings and payback require a tariff.',
      priceUnavailable:
        'The temporary price book is unavailable or has expired. Request an engineer survey.'
    },
    ledger: {
      title: 'How this was calculated',
      copy: 'The sources, versions, assumptions and limits behind this preliminary result.',
      sources: {
        consumption: 'Consumption data',
        location: 'Property location',
        roof: 'Roof outline and parameters',
        tariff: 'Electricity tariff',
        userTariff: 'Entered by the visitor from a bill',
        solar: 'Solar resource',
        investment: 'System price',
        pricebook: 'Temporary YOUR ENERGY price book',
        unavailable: 'Source not connected'
      },
      assumptions: {
        NO_TARIFF_ESCALATION: 'No tariff escalation is modelled.',
        NO_PANEL_DEGRADATION: 'No panel degradation is modelled.',
        NO_MAINTENANCE_FINANCING_DISCOUNTING_EXPORT_OR_TAXES:
          'Maintenance, financing, discounting, export rules and taxes are excluded.',
        MISSING_EVIDENCE_SUPPRESSES_FINANCIAL_RESULT:
          'Missing verified evidence suppresses financial values.',
        PVGIS_SYSTEM_LOSS_14_PERCENT:
          'PVGIS uses a 14% preliminary system-loss assumption; an engineer must confirm it.',
        PRELIMINARY_ROOF_USABLE_AREA_70_PERCENT:
          'Preliminary capacity uses 70% of the outlined roof area. An engineer verifies actual usable area, setbacks and access paths.',
        PRELIMINARY_PANEL_SIZE_580W_2M2:
          'Preliminary capacity uses a 580 W, 2 m² module; this is not a confirmed equipment specification.',
        USER_PROVIDED_TARIFF:
          'The tariff was entered by the visitor from a bill and is not a tariff registry record.',
        TEMPORARY_PRICEBOOK_NOT_OFFER:
          'The temporary PriceBook is a preliminary budget guide, not an offer or contractual price.',
        MAP_PROJECTED_AREA_CONVERTED_TO_ROOF_PLANE:
          'The map outline area was converted from a top view to a preliminary roof-plane area using the entered tilt.',
        USER_MEASURED_ROOF_PLANE_AREA:
          'The roof-face area was entered by the visitor and needs engineering verification.',
        MANUAL_PROPERTY_POINT:
          'The property point was selected manually; it does not verify the address or ownership.',
        MANUAL_ROOF_PLANE:
          'Roof direction, tilt and area were entered manually; no automatic roof scan was performed.',
        LOCAL_OBSTACLES_AND_STRUCTURE_NOT_MEASURED:
          'Local obstacles, shade, structural suitability and grid connection were not measured.',
        PVGIS_FREE_STANDING_BENCHMARK_FOR_ELEVATED_MOUNT:
          'For an elevated structure, the PVGIS optimum is only a benchmark; an engineer confirms the design.',
        ROOF_PARALLEL_MOUNT_REQUIRES_ENGINEER_CONFIRMATION:
          'For a roof-parallel system, an engineer confirms the final parameters.'
      }
    },
    passport: {
      persistenceTitle: 'Solar Passport is stored in this browser',
      persistenceCopy: 'This preliminary Passport exists only in the current session memory.',
      memoryOnly: 'The data may be lost when this page is closed.',
      permanentLink: 'A permanent link and PDF will be available after storage is connected.',
      sourceLedger: 'Sources and assumptions',
      shareUnavailable: 'Sharing a link is not available yet.',
      pendingBadge: 'After calculation',
      pendingAddress: 'Appears after the property is confirmed',
      pendingDate: 'Created in this session',
      pendingSource: 'Source: awaiting a PVGIS response',
      pendingChartDescription: 'Monthly generation appears after the PVGIS calculation.',
      pendingTitle: 'Your Solar Passport appears after calculation',
      realTitle: 'Your preliminary Solar Passport',
      sessionBadge: 'This session'
    },
    lead: {
      title: 'Send this estimate to an engineer',
      copy: 'Leave your contact details so an engineer can clarify the property data.',
      nameLabel: 'Your name',
      phoneLabel: 'Phone',
      emailLabel: 'Email',
      messageLabel: 'Property note',
      consent: 'I agree to the processing of my data to answer this request.',
      submit: 'Send request',
      required: 'Complete the required fields and confirm consent.',
      invalidEmail: 'Enter a valid email address.',
      sending: 'Sending request…',
      sent: 'The request was sent. We will contact you after the data are reviewed.',
      unavailable: 'Sending is temporarily unavailable. Please try later.',
      retry: 'Try sending again',
      directCall: 'Or call an engineer:',
      privacy: 'Data are not sent to analytics.'
    },
    status: {
      geocodeUnavailable: 'The geocoding service is not connected or is temporarily unavailable.',
      analysisUnavailable:
        'The solar-analysis service is not connected or is temporarily unavailable.',
      outsideServiceArea:
        'This free preliminary calculator currently serves points in Armenia only.',
      cacheNotConfigured:
        'PVGIS analysis is not enabled yet because its protected cache is not configured.',
      cacheUnavailable: 'The protected PVGIS cache is temporarily unavailable. Try again later.',
      roofAreaRequiresMeasured:
        'For a very steep roof, enter a measured roof-face area instead of a top-view area.',
      potentialCooldown: 'A repeat request for this point will be available in {seconds} s.',
      analysisCooldown: 'A repeat calculation with the same data will be available in {seconds} s.',
      inputsChanged:
        'Inputs changed. The previous preliminary result is hidden until you calculate again.',
      leadUnavailable: 'The lead service is not connected or is temporarily unavailable.',
      retry: 'Try again',
      canceled: 'The previous request was cancelled.'
    },
    months: months.map(({ short, name }) => ({ short, name }))
  },
  hero: {
    eyebrow: 'A personal solar-system estimate for your home',
    titleLead: 'Discover your home’s',
    titleMiddle: 'solar potential',
    titleAccent: 'in 60 seconds',
    homeCopy:
      'Open the full calculator: enter consumption, confirm the property point and roof outline, then receive a preliminary PVGIS estimate.',
    calculatorCopy:
      'First choose and confirm a point manually, then see its PVGIS potential. Roof and consumption data are only needed for the detailed estimate.',
    disclosure:
      'A preliminary result requires property confirmation and does not replace a site visit, engineering design or commercial proposal.',
    addressLabel: 'Address for the engineer (optional)',
    addressPlaceholder: 'For example: Yerevan, Arabkir',
    addressHelp:
      'The address is not geocoded. Open the map, choose a point manually or enter coordinates below.',
    analyze: 'Open point selection',
    openCalculator: 'Open calculator',
    uploadTitle: 'Attach an electricity bill (optional)',
    uploadPrompt: 'Choose a file or drag it here',
    uploadHelp:
      'PDF, JPG or PNG up to 10 MB. The file stays out of the server and is not read automatically; enter values manually.',
    removeFile: 'Remove file',
    benefits: [
      'No call or obligation',
      'Confirm the property on a map',
      'Provide consumption data',
      'See sources and assumptions'
    ]
  },
  map: {
    title: 'Preliminary roof assessment',
    demo: 'Static demonstration fallback',
    location: 'Illustrative location',
    imageAlt: 'Illustrative aerial roof image before a property is confirmed',
    disclosure:
      'This static image and panel layout are used only as a labelled fallback before a property is confirmed.',
    interactive: 'Interactive property map',
    roofArea: 'Roof area',
    roofAreaValue: 'Example: 124 m²',
    orientation: 'Orientation',
    orientationValue: 'Example: south-west (236°)',
    tilt: 'Tilt',
    tiltValue: 'Example: 32°',
    score: 'Solar Score',
    scoreValue: 'Example only',
    result: 'Preliminary result — confirmation required',
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
    disclosure:
      'Each preliminary result shows its connected, missing and manually supplied sources. Static cards remain demonstrations.',
    items: [
      {
        icon: 'satellite',
        title: 'PVGIS solar resource',
        note: 'shown only when the provider responds'
      },
      { icon: 'calculator', title: 'A transparent home scenario', note: 'from confirmed inputs' },
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
    copy: 'Compare indicative capacity and generation. A preliminary budget appears after property analysis.',
    disclaimer:
      'The final configuration, price and outcome depend on the property and are confirmed after a site visit.',
    items: [
      {
        name: 'Starter',
        subtitle: 'Lower initial investment',
        capacity: '6.2 kWp',
        generation: '9,200 kWh / year',
        price: 'Preliminary budget after analysis',
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
        price: 'Preliminary budget after analysis',
        badge: 'Popular option',
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
        price: 'Needs a separate estimate',
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
    note: 'A preliminary result requires confirmed inputs; engineering design and commercial terms follow an inspection.',
    steps: [
      ['Enter your address', 'and a few home details'],
      ['Confirm the property', 'or choose its point manually'],
      ['Compare the estimate', 'and three system options'],
      ['Engineer site visit', 'to measure the roof and electrical panel'],
      ['System installation', 'after the design and contract'],
      ['Monitoring', 'and support after start-up']
    ].map(([title, copy], index) => ({ number: String(index + 1).padStart(2, '0'), title, copy }))
  },
  finance: {
    eyebrow: 'Financial model',
    title: 'An investment that works every day',
    copy: 'The financial chart appears only after PVGIS analysis, an entered or confirmed tariff, and an active price book.',
    benefits: [
      'Lower grid consumption',
      'Panels designed for more than 25 years of service',
      'Greater energy independence',
      'A transparent formula with no hidden assumptions'
    ],
    timelineTitle: 'How the net result grows',
    timeline: [{ year: 'Today' }, { year: 'Year 5' }, { year: 'Year 10' }, { year: 'Year 25' }],
    awaiting: 'After analysis',
    includedTitle: 'What the temporary preliminary price includes',
    included: [
      'Solar panels',
      'Inverter',
      'Mounting and standard installation',
      'Basic grid connection',
      'VAT and permits require confirmation',
      'Battery, roof repair and non-standard electrical work are excluded'
    ],
    disclaimer:
      'Financial values are not shown before analysis. The model excludes tariff growth, degradation, maintenance, financing, discounting, taxes and export rules.'
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
  companyRecord: {
    eyebrow: 'Legal information',
    title: 'A verifiable legal entity',
    copy: 'Before entering into a contract, you can independently verify the state-registration details of the legal entity you are working with.',
    facts: [
      { label: 'Legal name', value: 'YOUR ENERGY LLC' },
      { label: 'State registration', value: '17 August 2026' },
      { label: 'Registration number', value: '999.110.1603227' },
      { label: 'Taxpayer number', value: '02338724' }
    ],
    addressLabel: 'Registered address',
    address: '48 Artashisyan St., building 14, Shengavit, Yerevan 0039',
    source: 'Source: State Unified Registry extract dated 17 August 2026',
    verification: 'Verification code: RBE4-88FA-4C78-8ECF',
    action: 'Verify on the state platform',
    disclosure:
      'This block verifies company state-registration details only. It is not evidence of installer qualification, insurance, equipment availability, warranty coverage or suitability for a specific property.'
  },
  equipment: {
    title: 'Equipment technical documentation',
    note: 'This section contains manufacturer data sheets for models that may be discussed for a project. A brand mention does not confirm a partnership, availability or official status.',
    brands: ['LONGi', 'SolaX'],
    documentsTitle: 'Verifiable manufacturer data sheets',
    documentsCopy:
      'Open the original PDF to check the model, specifications and warranty wording before signing a contract.',
    documentAction: 'Open manufacturer PDF',
    documentsDisclosure:
      'These are product data sheets supplied for the website. They are not a YOURENERGY licence, evidence of dealer or installer authorisation, evidence of stock, or proof that equipment suits a particular property. The exact model, scope and warranty terms must be recorded in the contract.',
    documents: [
      {
        vendor: 'LONGi · data sheet',
        title: 'LR7-72HVDF 640–665M',
        href: '/documents/longi-lr7-72hvdf-640-665m.pdf',
        facts: [
          { label: 'Power range', value: '640–665 W' },
          { label: 'Maximum module efficiency', value: 'up to 24.6%' },
          { label: 'Standards listed', value: 'IEC 61215, IEC 61730' }
        ],
        note: 'The data sheet lists 15 years for materials and processing and 30 years of extra linear power output. Check the terms in the contract and with the supplier.'
      },
      {
        vendor: 'LONGi · data sheet',
        title: 'LR8-66HVD 640–665M',
        href: '/documents/longi-lr8-66hvd-640-665m.pdf',
        facts: [
          { label: 'Power range', value: '640–665 W' },
          { label: 'Maximum module efficiency', value: 'up to 24.62%' },
          { label: 'Construction', value: 'bifacial module, IP68 junction box' }
        ],
        note: 'The sheet lists IEC 61215 and IEC 61730 plus the manufacturer’s 15/30-year warranty wording. It does not confirm stock or applicability to a particular project.'
      },
      {
        vendor: 'SolaX · preliminary data sheet',
        title: 'X1-Lite-LV · 8 / 10 / 12 kW',
        href: '/documents/solax-x1-lite-lv-datasheet-v1-5.pdf',
        facts: [
          { label: 'Nominal AC power', value: '8 / 10 / 12 kW' },
          { label: 'Enclosure protection', value: 'IP65' },
          { label: 'Stated warranty', value: '5 years' }
        ],
        note: 'The manufacturer marks this sheet as preliminary and subject to change without notice. It lists EN IEC 62109-1/-2 and other standards; an engineer confirms final compatibility.'
      },
      {
        vendor: 'SolaX · data sheet',
        title: 'T-BAT-SYS-LV D53',
        href: '/documents/solax-t-bat-sys-lv-d53-v1-2.pdf',
        facts: [
          { label: 'One module', value: '5.3 kWh nominal / 4.7 kWh usable at 90% DoD' },
          { label: 'Expansion', value: 'up to 16 modules / 85.1 kWh nominal' },
          { label: 'Chemistry and protection', value: 'LFP, IP65' }
        ],
        note: 'The sheet lists 10 years, >6,000 cycles under stated conditions and IEC62619 / IEC62040 / CE / UN38.3. These parameters do not replace a backup-power design calculation.'
      }
    ]
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
        'After property analysis, a temporary preliminary YOUR ENERGY range may appear from an active PriceBook. It is not an offer: final pricing depends on capacity, roof, equipment and connection and is confirmed after a site visit.'
      ],
      [
        'How is system capacity calculated?',
        'The preliminary flow uses entered consumption, a confirmed property point, a manually outlined roof and provider solar-resource data when configured. An engineer still checks shading and grid limits.'
      ],
      [
        'What is the payback period?',
        'Payback is shown only after PVGIS analysis and an entered or confirmed tariff. The model excludes tariff growth, degradation, maintenance, financing, discounting, taxes and export rules.'
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
        'A preliminary Passport keeps the current session’s inputs, sources and assumptions together. It is not an engineering design, bank document or offer; permanent links and PDFs are not connected in P0.'
      ]
    ].map(([question, answer]) => ({ question, answer }))
  },
  finalCta: {
    title: 'Ready to discover your home’s potential?',
    copy: 'Start a preliminary analysis and see exactly which information is confirmed, missing or still needs an engineer.',
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
          ['Equipment documents', '/en/#equipment-documents'],
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
    analyzing: 'Preparing a preliminary analysis…',
    ready: 'The preliminary result is ready. Review the data before making a decision.',
    unavailable: 'The preliminary analysis is unavailable. Try again or select a point manually.',
    invalidFile: 'This format is not supported. Choose a PDF, JPG, JPEG or PNG.',
    largeFile: 'The file is too large. The maximum size is 10 MB.',
    fileSelected: 'The file was selected and remains only in browser memory.',
    fileRemoved: 'File removed.',
    mapReady: 'The interactive property map is ready.',
    mapFailed: 'The map is unavailable. The static demonstration fallback remains available.',
    monthTooltip: 'Generation in {month}: {value} kWh'
  }
};
