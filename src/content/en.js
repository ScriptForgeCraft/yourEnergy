import { CONTACT_HOURS } from './contact-hours.js';

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
    title: 'Solar Panels & Solar Systems in Armenia | YOURENERGY',
    description:
      'Choose a region and enter consumption for a preliminary solar estimate, then refine it with your roof and professional inputs when needed.',
    ogTitle: 'Start your home solar estimate | YOURENERGY',
    ogDescription:
      'Region and consumption first; optional roof refinement and professional calculation follow.',
    serviceDescription:
      'A preliminary residential solar calculation for Armenia: start with region and consumption, optionally refine the roof, then continue to a professional calculation.'
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
    close: 'Close'
  },
  nav: {
    home: 'Home',
    calculator: 'Calculator',
    projects: 'Projects',
    process: 'Process',
    equipment: 'Equipment',
    contacts: 'Contact',
    about: 'About us',
    blog: 'Blog'
  },
  contact: {
    phone: '+374 91 095 950',
    phoneHref: 'tel:+37491095950',
    whatsapp: 'WhatsApp',
    whatsappHref: 'https://wa.me/37491095950',
    whatsappLabel: 'Chat with us on WhatsApp',
    phoneLabel: 'Call +374 91 095 950',
    address1: '48/14 Artashisyan St., Yerevan',
    address2: '33, 26th St., Zovuni',
    hours: CONTACT_HOURS.en.footer
  },
  common: {
    headerCta: 'Get an estimate',
    demo: 'Example',
    illustrative: 'Illustrative image'
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
    potential: {
      eyebrow: 'Step 2 · Site potential',
      title: 'Solar-resource reference',
      loading: 'Getting solar-resource data for the confirmed point…',
      annualYieldLabel: 'Solar-resource reference yield',
      orientationLabel: 'Reference optimal direction',
      tiltLabel: 'Reference optimal tilt',
      source:
        'Source: European Commission Joint Research Centre · preliminary 14% system-loss assumption',
      disclosure:
        'These values describe the solar resource at this location for a reference 1 kWp fixed system. Your actual roof is analysed in Step 3.',
      roofDisclosure:
        'The direction, pitch, area, shading and structural suitability of the actual roof must be entered below and confirmed by an engineer.',
      unavailable:
        'Solar-potential data could not be retrieved. Retry or contact an engineer; no example figures will be substituted.',
      contactPrefix: 'Need a manual check? Call an engineer:',
      retry: 'Retry solar-potential data',
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
      copy: 'Enter your electricity usage to calculate the optimal system size.',
      modes: {
        bill: 'Average bill',
        usage: 'Average consumption',
        monthly: 'Monthly profile'
      },
      billLabel: 'Average electricity bill',
      billHelp: 'Enter the average monthly amount in AMD.',
      billKwhAction: 'Have kWh on this bill? Enter it →',
      billKwhRemove: 'Do not use kWh from the bill',
      billKwhLabel: 'Consumption from the same bill',
      refineEffectiveRate: 'Refine electricity cost',
      tariffSettingTitle: 'Tariff for the financial estimate',
      tariffInfoLabel: 'How the tariff is calculated',
      tariffInfoTitle: 'How is the tariff calculated?',
      tariffInfo: [
        'The tariff is used only for savings and payback. Solar-system sizing is determined from consumption in kWh.',
        'If you enter a bill amount and kWh from the same bill, the calculator can determine your average electricity cost automatically.',
        'For the standard source, the calculator selects the official residential tariff band from consumption.'
      ],
      tariffModeLabel: 'Financial tariff mode',
      standardTariff: 'Standard residential tariff',
      billDerivedRate: 'From your bill',
      billDerivedHelp: 'Calculated from {bill} AMD and {kwh} kWh.',
      customEffectiveRate: 'Enter my average rate',
      effectiveRateLabel: 'Average price per kWh',
      effectiveRateHelp: 'Enter the average price per kWh if you know it from your bill.',
      customBillComparison:
        'Your bill works out to {derived} AMD/kWh. The financial estimate will use {custom} AMD/kWh.',
      automaticStandardTariff: 'Standard residential tariff',
      userProvidedEffectiveRate: 'Average rate from user',
      actualDayNightRate: 'Actual day / night consumption',
      bracketUpTo: 'Up to {max} kWh/month',
      bracketBetween: '{min}–{max} kWh/month',
      bracketAbove: 'Above {min} kWh/month',
      monthlyBracket: 'The tariff band is selected for each month',
      standardRangePending: 'The band will be selected after consumption is entered',
      actualDayNightDisclosure: 'I have separate Day / Night readings from my bill',
      actualDayLabel: 'Day',
      actualNightLabel: 'Night',
      actualDayNightHelp: 'The two values must add up to the monthly consumption.',
      invalidDayNight: 'Enter valid day and night kWh for the same month.',
      usageLabel: 'Average monthly consumption',
      usageHelp: 'Enter the average monthly consumption in kWh.',
      monthlyTitle: 'Consumption over 12 months',
      monthlyHelp: 'Enter kWh for each month when those figures are available.',
      annualLabel: 'Estimated annual consumption',
      emptyState: 'Enter consumption to see the annual estimate.',
      invalidNumber: 'Enter a number greater than zero.',
      invalidBill: 'Enter a valid bill amount in AMD.',
      invalidEffectiveRate: 'Enter an effective rate greater than zero in AMD/kWh.',
      invalidBillDerived: 'Enter a valid amount and kWh from the same bill.',
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
        'Latitude and longitude are used only for the solar-resource calculation. Check them before confirming.',
      latitudeLabel: 'Latitude',
      longitudeLabel: 'Longitude',
      useCoordinates: 'Use these coordinates',
      invalidCoordinates: 'Enter valid property coordinates.',
      regionLabel: 'Region or Yerevan',
      localityLabel: 'City, locality or district',
      localityPlaceholder: 'Choose from the list',
      localityHelp:
        'Choose a place and the map will move there immediately. Then click once to mark your home’s exact point.',
      regions: [
        { id: 'yerevan', label: 'Yerevan' },
        { id: 'aragatsotn', label: 'Aragatsotn' },
        { id: 'ararat', label: 'Ararat' },
        { id: 'armavir', label: 'Armavir' },
        { id: 'gegharkunik', label: 'Gegharkunik' },
        { id: 'kotayk', label: 'Kotayk' },
        { id: 'lori', label: 'Lori' },
        { id: 'shirak', label: 'Shirak' },
        { id: 'syunik', label: 'Syunik' },
        { id: 'tavush', label: 'Tavush' },
        { id: 'vayots-dzor', label: 'Vayots Dzor' }
      ]
    },
    roof: {
      title: 'Roof',
      copy: 'Outline the usable roof section and enter its orientation and tilt for a preliminary estimate.',
      mapDisclosure:
        'The map helps place a point and an approximate outline. Without aerial imagery or a 3D model, it cannot automatically detect the roof, its pitch or shading.',
      fallback: 'The map is unavailable. Enter and manually confirm the property coordinates.',
      start: 'Start outline',
      addPointAtCenter: 'Add a point at the map centre',
      addPoint: 'Add point',
      undo: 'Undo last point',
      reset: 'Clear outline',
      edit: 'Edit outline',
      pointsLabel: 'Points in outline: {count}',
      minimumPoints: 'Add at least 3 points to create an outline.',
      areaLabel: 'Preliminary area from the outline',
      mountingModeLabel: 'Mounting approach',
      mountingModeHelp:
        'Along the roof plane: panels are installed following the existing roof surface. Tilted rows on supports: row spacing is considered to reduce inter-row shading.',
      mountingModes: {
        roofParallel: 'Along the roof plane',
        roofParallelHelp: 'Panels are installed following the existing roof surface.',
        elevated: 'Tilted rows on supports',
        elevatedHelp:
          'Panels are installed in separate tilted rows, typically on a flat roof. Row spacing is considered to reduce inter-row shading.'
      },
      areaMethodTitle: 'How do you want to enter the area?',
      areaMethodHelp:
        'The map outline shows the roof from above. On a pitched roof, the actual surface area can be larger. If you know the measured area of this roof section, use it.',
      areaMethods: {
        mapProjected: 'Map outline — area from above',
        measuredPlane: 'Measured roof section area'
      },
      planeAreaLabel: 'Measured roof section area',
      planeAreaHelp:
        'Enter the actual measured area of this roof section in m². The value remains preliminary until an engineer survey.',
      planeAreaSummary: 'Roof area used in calculation',
      orientationLabel: 'Roof orientation',
      orientationHelp: 'Choose the direction this roof section faces.',
      customOrientationLabel: 'Custom orientation (0° = north, 180° = south)',
      customOrientationHelp: 'Enter a compass bearing from 0 to 359°.',
      tiltLabel: 'Roof tilt',
      tiltHelp:
        'The angle of the roof itself relative to horizontal. A flat roof is about 0°, while pitched roofs are often around 20–35°. If you do not know the exact angle, enter an approximate value.',
      tiltInfoLabel: 'More information about roof tilt',
      arrayTiltLabel: 'Panel tilt (optional)',
      arrayTiltHelp:
        'Only for tilted rows on supports. This is the tilt of the solar panels, not the roof. If left blank, YOURENERGY automatically selects the closest catalog-supported angle to the PVGIS calculated optimum.',
      arrayTiltInfoLabel: 'More information about panel tilt',
      arrayAzimuthLabel: 'Panel direction (optional)',
      arrayAzimuthHelp:
        'Only for tilted rows on supports. This is the compass direction of the panels themselves. If left blank, YOURENERGY uses the PVGIS recommended direction.',
      arrayAzimuthInfoLabel: 'More information about panel direction',
      parametersRequired: 'Enter the roof orientation and tilt for the calculation.',
      angleGuideTitle: 'Check roof orientation and tilt',
      angleGuideCopy: 'The arrow shows the roof orientation you entered.',
      angleGuideOrientation: 'Roof orientation',
      angleGuideTilt: 'Roof tilt',
      benchmarkOrientation: 'Reference direction for tilted rows on supports',
      benchmarkTilt: 'Reference tilt for tilted rows on supports',
      angleGuideUnknown: 'Not specified',
      pointSelectLabel: 'Remove point {index}',
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
        'No tariff was entered: capacity, calculated solar generation and a preliminary price remain available, but savings and payback are not shown.',
      priceUnavailable:
        'The owner-managed price book is unavailable or needs an update. Request an engineer survey; savings and payback also require a tariff.',
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
        'Owner-managed preliminary YOURENERGY price · {version} · not an offer: {p25}–{p75}; P50 {p50}.'
    },
    ledger: {
      title: 'How this was calculated',
      copy: 'The sources, versions, assumptions and limits behind this preliminary result.',
      sources: {
        consumption: 'Consumption data',
        location: 'Property location',
        roof: 'Roof outline and parameters',
        tariff: 'Electricity tariff',
        solar: 'Solar resource',
        investment: 'System price',
        pricebook: 'YOURENERGY owner-managed price list',
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
          'The solar model uses a 14% preliminary system-loss assumption; an engineer must confirm it.',
        PRELIMINARY_ROOF_USABLE_AREA_70_PERCENT:
          'Preliminary capacity uses 70% of the outlined roof area. An engineer verifies actual usable area, setbacks and access paths.',
        PRELIMINARY_ELEVATED_SINGLE_DIRECTION_ROW_DENSITY:
          'Capacity for tilted rows on supports uses a preliminary single-direction row-spacing model, not a fixed roof-coverage percentage.',
        PRELIMINARY_ELEVATED_LIMIT_PROFILE_ANGLE_20_DEGREES:
          'The preliminary row-spacing model uses a 20° shading limit/profile angle assumption.',
        PRELIMINARY_ROW_DENSITY_NOT_FINAL_PANEL_LAYOUT:
          'This is a preliminary row-density estimate, not a final panel layout.',
        PRELIMINARY_PANEL_FROM_EQUIPMENT_CATALOG:
          'Preliminary capacity uses a module from the equipment catalog; an engineer must confirm the final specification.',
        USER_PROVIDED_TARIFF:
          'The tariff was entered by the visitor from a bill and is not a tariff registry record.',
        STANDARD_RESIDENTIAL_DAY_NIGHT_RANGE_WITH_UNKNOWN_USAGE_SPLIT:
          'The standard day/night consumption split is unknown, so the financial result is shown as a range.',
        USER_PROVIDED_ACTUAL_DAY_NIGHT_CONSUMPTION:
          'The effective rate is calculated from actual day and night kWh supplied by the user.',
        STANDARD_RESIDENTIAL_DAY_RATE_REFERENCE_FOR_BILL_TO_KWH_ESTIMATE:
          'The standard day rate is used only as a reference when estimating consumption from a bill amount.',
        OWNER_MANAGED_PRICEBOOK_NOT_OFFER:
          'The owner-managed price list is a preliminary budget guide, not an offer or contractual price.',
        ARMENIA_MONTHLY_NET_METERING_MAY_TO_APRIL:
          'The annual electricity net-metering settlement runs from May through April.',
        UNIFORM_MONTHLY_CONSUMPTION_FOR_SETTLEMENT:
          'No monthly profile was entered, so consumption is distributed evenly by month for the settlement calculation.',
        CONFIRMED_REGISTRY_TARIFF: 'A confirmed residential-tariff registry was used.',
        VERIFIED_HISTORICAL_GRID_FACTOR:
          'The CO₂ factor uses the latest available verified historical value for {year}.',
        SURPLUS_COMPENSATION_UNAVAILABLE:
          'No verified surplus-compensation rate is configured, so surplus generation is excluded from the financial estimate.',
        MAP_PROJECTED_AREA_CONVERTED_TO_ROOF_PLANE:
          'The map outline area was converted from a top view to a preliminary roof area using the entered tilt.',
        USER_MEASURED_ROOF_PLANE_AREA:
          'The measured roof area was entered by the visitor and needs engineering verification.',
        MANUAL_PROPERTY_POINT:
          'The property point was selected manually; it does not verify the address or ownership.',
        MANUAL_ROOF_PLANE:
          'Roof direction, tilt and area were entered manually; no automatic roof scan was performed.',
        LOCAL_OBSTACLES_AND_STRUCTURE_NOT_MEASURED:
          'Local obstacles, shade, structural suitability and grid connection were not measured.',
        LOCAL_OBSTACLES_SETBACKS_AND_ACCESS_NOT_SURVEYED:
          'Local obstacles, setbacks and access routes have not been surveyed.',
        STRUCTURAL_CAPACITY_WIND_SNOW_BALLAST_AND_ATTACHMENT_NOT_CONFIRMED:
          'Structural capacity, wind and snow loading, ballast and attachment design are not confirmed by this preliminary calculator.',
        ELEVATED_ON_SLOPED_ROOF_REQUIRES_ENGINEERING_LAYOUT:
          'Tilted rows on supports on a sloped roof require an engineering layout; no preliminary module limit is shown.',
        PVGIS_FREE_STANDING_BENCHMARK_FOR_ELEVATED_MOUNT:
          'For tilted rows on supports, the calculated optimum is only a reference; an engineer confirms the final design.',
        ROOF_PARALLEL_MOUNT_REQUIRES_ENGINEER_CONFIRMATION:
          'For installation along the roof plane, an engineer confirms the final parameters.'
      }
    },
    status: {
      geocodeUnavailable: 'The geocoding service is not connected or is temporarily unavailable.',
      analysisUnavailable:
        'The solar-analysis service is not connected or is temporarily unavailable.',
      outsideServiceArea:
        'This free preliminary calculator currently serves points in Armenia only.',
      roofAreaRequiresMeasured: 'For a very steep roof, enter a measured roof section area.',
      potentialCooldown: 'A repeat request for this point will be available in {seconds} s.',
      analysisCooldown: 'A repeat calculation with the same data will be available in {seconds} s.',
      inputsChanged:
        'Inputs changed. The previous preliminary result is hidden until you calculate again.',
      retry: 'Try again',
      canceled: 'The previous request was cancelled.'
    },
    months: months.map(({ short, name }) => ({ short, name }))
  },
  hero: {
    eyebrow: 'Manage your solar energy your way.',
    titleLead: 'Your roof',
    titleMiddle: 'has more potential',
    titleAccent: 'than you think.',
    homeCopy:
      'In a few steps, see your home’s solar potential, a preliminary system size and budget — plus savings when you enter your tariff.',
    calculatorCopy:
      'First choose and confirm a point manually, then see its solar potential. Roof and consumption data are only needed for the detailed estimate.',
    disclosure:
      'A preliminary result requires property confirmation and does not replace a site visit, engineering design or commercial proposal.',
    addressLabel: 'Property address',
    addressPlaceholder: 'For example: Yerevan, Komitas 10',
    addressHelp: 'Find the address, choose a result, then confirm the home point on the map.',
    addressSearchDisclosure:
      'Search sends the address you enter to the configured geocoding service. A result is not a confirmed home point.',
    addressSearchAttribution: 'Address-search data:',
    analyze: 'Open point selection',
    openCalculator: 'Calculate my home',
    signatureLead: 'Your solar energy,',
    signatureTail: 'your way.',
    dashboardAriaLabel: 'Solar calculation summary',
    dashboardLocationSelected: 'Selected point',
    dashboardLocationRegional: 'Regional estimate',
    dashboardStatusPreliminary: 'PRELIMINARY',
    dashboardReady: 'Current session result',
    dashboardGeneration: 'Annual generation',
    dashboardGenerationUnit: 'kWh / year',
    dashboardCoverage: 'Consumption coverage',
    dashboardCoverageUnit: '%',
    dashboardSavings: 'Annual savings',
    dashboardSavingsUnit: '֏ / year',
    dashboardCo2: 'CO₂ reduction',
    dashboardCo2Unit: 't / year',
    dashboardNeedConsumption: 'Add consumption',
    dashboardNeedTariff: 'Add tariff',
    dashboardLoading: 'Calculating…',
    dashboardNotePreliminary:
      'Preliminary calculation. Final parameters and price require an engineering review.',
    quickCalculator: {
      eyebrow: 'Quick solar calculation',
      title: 'See your home’s preliminary potential',
      region: 'Region',
      consumption: 'Average monthly consumption',
      consumptionUnit: 'kWh / month',
      tariff: 'Your average tariff',
      tariffUnit: '֏ / kWh',
      tariffHint: 'Optional — leave blank to use the standard residential tariff.',
      submit: 'Calculate',
      calculating: 'Calculating…',
      edit: 'Edit inputs',
      capacity: 'System size',
      panels: 'Panels',
      payback: 'Payback',
      paybackUnit: 'years',
      invalid: 'Choose a region and enter a positive average monthly consumption.',
      invalidTariff: 'Enter a positive tariff or leave the field blank.',
      unavailable: 'The calculation is unavailable right now. Please try again.',
      country: 'Armenia'
    },
    dashboardExample: {
      location: 'Yerevan, Armenia',
      status: 'EXAMPLE RESULT',
      annualGenerationKwh: 8420,
      annualGenerationDisplay: '8,420',
      monthlyGenerationKwh: [320, 390, 570, 740, 820, 900, 980, 940, 790, 630, 470, 350],
      monthlyBarPercent: [33, 40, 58, 76, 84, 92, 100, 96, 81, 64, 48, 36],
      co2Label: 'CO₂ savings',
      treesLabel: 'Tree CO₂ absorption equivalent',
      treesUnit: 'trees / year',
      note: 'Example result — calculate your home to see your figures.'
    }
  },
  map: {
    demo: 'Example data',
    imageAlt: 'Illustrative aerial roof image before a property is confirmed'
  },
  passport: {
    eyebrow: 'What you receive after calculation',
    title: 'Example Solar Passport',
    badge: 'example',
    copy: 'This is what a preliminary report looks like after a successful calculation: roof map, system parameters, generation and financial values when a tariff is supplied.',
    features: [
      'Roof map and example panel layout',
      'Monthly generation',
      'A 25-year financial model',
      'Recommended equipment',
      'Estimate assumptions and limitations'
    ],
    cta: 'View report example',
    close: 'Close report',
    reportLabel: 'SOLAR PASSPORT',
    reportAddress: 'Illustrative home',
    reportDate: 'Example report structure',
    system: 'Recommended system',
    capacity: '10.4 kWp',
    panels: '16 × 650 W',
    source: 'Source: example data',
    chartTitle: 'Monthly generation, kWh',
    chartDescription: 'A bar chart showing example monthly generation from January to December.',
    tableTitle: 'Monthly generation data table',
    monthLabel: 'Month',
    months
  },
  trust: {
    disclosure:
      'Each preliminary result shows which data came from connected sources, was entered manually or is still missing. The examples on the page illustrate the result structure; your calculation is built from your own data.',
    items: [
      {
        icon: 'satellite',
        title: 'Solar-resource data',
        note: 'when the provider responds'
      },
      {
        icon: 'calculator',
        title: 'Tailored system',
        note: 'from confirmed inputs'
      },
      { icon: 'support', title: 'Local engineering', note: 'for Armenia homes' },
      {
        icon: 'shield',
        title: 'Clear conditions',
        note: 'scope confirmed before work'
      }
    ]
  },
  journey: {
    title: 'Your solar journey',
    progressLabel: 'Solar analysis journey',
    previewLabel: 'Preliminary result',
    chartPreviewLabel: 'Monthly generation is calculated from your inputs',
    chartReadyLabel: 'Monthly generation from your calculation',
    availableAfterCalculation: 'Calculated from your inputs',
    confirmedInput: 'Confirmed input',
    awaitingInput: 'Enter this in the calculator',
    previousStepLabel: 'Back',
    nextStepLabel: 'Continue',
    chartMonths: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    steps: [
      {
        number: '1',
        nav: 'Your Home',
        visual: 'home',
        visualLabel: 'Illustrative home view',
        headline: 'Let’s start with your home',
        copy: 'Enter your location and electricity use. We’ll establish the starting point for your solar analysis.',
        status: 'home',
        cards: [
          {
            icon: 'map-pin',
            label: 'Location',
            value: 'Choose a region or property point',
            data: 'location'
          },
          {
            icon: 'zap',
            label: 'Electricity use',
            value: 'Enter your bill or monthly consumption',
            data: 'consumption'
          },
          {
            icon: 'sun',
            label: 'Solar resource',
            value: 'Calculated from the selected location',
            data: 'solar-resource'
          }
        ],
        visualCards: [
          { label: 'Property', value: 'Preview', data: 'location' },
          { label: 'Input status', value: 'Waiting for your details', data: 'home-status' }
        ]
      },
      {
        number: '2',
        nav: 'Roof Details',
        visual: 'roof',
        visualLabel: 'Illustrative roof outline',
        headline: 'Let’s understand your roof',
        copy: 'Refine the estimate with your property point, usable roof area and roof conditions.',
        status: 'roof',
        cards: [
          {
            icon: 'satellite',
            label: 'Usable roof area',
            value: 'From an outline or measured area',
            data: 'roof-area'
          },
          {
            icon: 'sun',
            label: 'Roof direction',
            value: 'Enter the roof orientation',
            data: 'roof-direction'
          },
          {
            icon: 'arrow-right',
            label: 'Roof tilt',
            value: 'Enter the roof tilt angle',
            data: 'roof-tilt'
          }
        ],
        visualCards: [
          { label: 'Roof outline', value: 'Manual refinement', data: 'roof-status' },
          { label: 'Input status', value: 'Not an automatic roof scan', data: 'roof-status' }
        ]
      },
      {
        number: '3',
        nav: 'System Design',
        visual: 'system',
        visualLabel: 'Illustrative solar-system view',
        headline: 'Your solar system takes shape',
        copy: 'We combine your consumption, location and roof inputs to recommend a system that fits your home.',
        status: 'system',
        chart: true,
        cards: [
          {
            icon: 'zap',
            label: 'System size',
            value: 'Based on consumption and solar resource',
            data: 'system-size'
          },
          {
            icon: 'sun',
            label: 'Solar panels',
            value: 'Count based on capacity and selected panel',
            data: 'panel-count'
          },
          {
            icon: 'shield-check',
            label: 'Inverter',
            value: 'Power and type matched to the system',
            data: 'inverter'
          },
          {
            icon: 'cycle',
            label: 'Annual production',
            value: 'Based on system configuration and solar data',
            data: 'annual-production'
          }
        ],
        visualCards: [
          { label: 'Recommended system', value: 'Based on your entered data', data: 'system-size' },
          { label: 'Data source', value: 'Shown with the calculated result', data: 'system-status' }
        ]
      },
      {
        number: '4',
        nav: 'Engineer Site Survey',
        visual: 'inspection',
        visualLabel: 'On-site engineering survey',
        headline: 'Engineer site survey',
        copy: 'An engineer checks the roof, electrical panel and shading before the final design.',
        cards: [
          {
            icon: 'pin',
            label: 'Roof measurements',
            value: 'Measured on site'
          },
          {
            icon: 'calculator',
            label: 'Electrical panel',
            value: 'Connection conditions are checked'
          },
          {
            icon: 'sun',
            label: 'Shading review',
            value: 'Verified on site'
          }
        ],
        visualCards: [
          { label: 'Site visit', value: 'Before the final offer' },
          { label: 'Engineering review', value: 'In person' }
        ]
      },
      {
        number: '5',
        nav: 'Installation',
        visual: 'installation',
        visualLabel: 'Illustrative installation view',
        headline: 'From analysis to installation',
        copy: 'An engineer verifies the property, finalizes the design and prepares the system for professional installation.',
        cards: [
          { icon: 'pin', label: 'Site review', value: 'Property parameters confirmed on site' },
          { icon: 'calculator', label: 'Final design', value: 'Approved system configuration' },
          {
            icon: 'sun',
            label: 'Equipment preparation',
            value: 'Specified for the approved design'
          }
        ],
        timeline: [
          { number: '1', label: 'Site preparation' },
          { number: '2', label: 'Mounting-system installation' },
          { number: '3', label: 'Panel installation' },
          { number: '4', label: 'Inverter and electrical work' },
          { number: '5', label: 'Testing and commissioning' }
        ]
      },
      {
        number: '6',
        nav: 'Lifetime Support',
        visual: 'support',
        visualLabel: 'Illustrative monitoring and service view',
        headline: 'Your system keeps working for you',
        copy: 'After installation, keep system information, generation data and service contacts together in one place.',
        cards: [
          {
            icon: 'file',
            label: 'Solar Passport',
            value: 'Inputs and assumptions from the current calculation'
          },
          {
            icon: 'shield-check',
            label: 'System information',
            value: 'Design and technical documentation'
          },
          { icon: 'cycle', label: 'Generation', value: 'Monitoring data when available' },
          { icon: 'support', label: 'Support', value: 'YOURENERGY service and contact options' }
        ],
        visualCards: [
          { label: 'Documents', value: 'Together in one place' },
          { label: 'Service', value: 'Support after commissioning' }
        ]
      }
    ]
  },
  projects: {
    titleLead: 'Real projects,',
    titleAccent: 'real results',
    copy: 'Explore our completed solar projects and see how we help homes and businesses produce their own energy and reduce electricity costs.',
    viewAll: 'View all projects',
    discuss: 'Discuss your project',
    signature: 'For a cleaner future',
    items: [
      {
        id: 'arabkir',
        type: 'Residential home',
        city: 'Yerevan',
        image: 'project-arabkir',
        action: 'View project',
        metrics: [
          { icon: 'zap', value: '10.4 kWp', label: 'System capacity' },
          { icon: 'chart-bars', value: '15,200 kWh/year', label: 'Annual production' },
          { icon: 'leaf', value: '3.2 t CO₂/year', label: 'CO₂ avoided' }
        ]
      },
      {
        id: 'abovyan',
        type: 'Residential home',
        city: 'Abovyan',
        image: 'project-abovyan',
        action: 'View project',
        metrics: [
          { icon: 'zap', value: '6.8 kWp', label: 'System capacity' },
          { icon: 'chart-bars', value: '9,800 kWh/year', label: 'Annual production' },
          { icon: 'leaf', value: '2.1 t CO₂/year', label: 'CO₂ avoided' }
        ]
      },
      {
        id: 'vagharshapat',
        type: 'Commercial facility',
        city: 'Armavir',
        image: 'project-vagharshapat',
        action: 'View project',
        metrics: [
          { icon: 'zap', value: '50 kWp', label: 'System capacity' },
          { icon: 'chart-bars', value: '68,000 kWh/year', label: 'Annual production' },
          { icon: 'leaf', value: '15.6 t CO₂/year', label: 'CO₂ avoided' }
        ]
      },
      {
        id: 'ararat',
        type: 'Residential home',
        city: 'Kotayk region',
        image: 'project-ararat',
        action: 'View project',
        metrics: [
          { icon: 'zap', value: '8.1 kWp', label: 'System capacity' },
          { icon: 'chart-bars', value: '11,800 kWh/year', label: 'Annual production' },
          { icon: 'leaf', value: '2.8 t CO₂/year', label: 'CO₂ avoided' }
        ]
      },
      {
        id: 'yerevan',
        type: 'Residential home',
        city: 'Yerevan',
        image: 'project-arabkir',
        action: 'View project',
        metrics: [
          { icon: 'zap', value: '12.5 kWp', label: 'System capacity' },
          { icon: 'chart-bars', value: '17,500 kWh/year', label: 'Annual production' },
          { icon: 'leaf', value: '3.7 t CO₂/year', label: 'CO₂ avoided' }
        ]
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
    title: 'Financial details',
    disclaimer:
      'Financial values are not shown before analysis. The model excludes tariff growth, degradation, maintenance, financing, discounting, taxes and export rules.'
  },
  engineering: {
    eyebrow: 'Engineer review',
    title: 'We estimate online first. Then we verify on site.',
    copy: 'A final offer is made only after an on-site inspection and engineering review of the property.',
    items: [
      'Roof condition and load-bearing capacity',
      'Shading, tilt and orientation',
      'Electrical panel and cable routes',
      'Protection, grounding and connection'
    ],
    imageAlt: 'Illustrative image of an engineer inspecting a solar system',
    imageNote: 'The person shown is illustrative and is not identified as a YOURENERGY employee.'
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
        note: 'The manufacturer identifies this data sheet as preliminary and may change it without notice. It lists EN IEC 62109-1/-2 and other standards; an engineer confirms final compatibility.'
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
  faq: {
    eyebrow: 'FAQ',
    title: 'Frequently asked questions',
    homeTitle: 'Everything you need to know before installing a solar system',
    homeTitleLead: 'Everything you need to know',
    homeTitleAccent: 'before installing',
    homeTitleTail: 'a solar system',
    pageTitle: 'Frequently asked questions, answered',
    intro:
      'Clear answers about solar systems, the calculation and next steps. Choose a topic or search for your question.',
    previewIntro:
      'Costs, warranties, documents, grid connection and batteries — answers to the most common questions, all in one place.',
    allQuestions: 'All questions',
    searchLabel: 'Search questions',
    searchPlaceholder: 'Search questions...',
    categoriesLabel: 'FAQ topics',
    noResults: 'No questions found. Try a different search.',
    notFound: 'Didn’t find an answer?',
    contactLink: 'Ask an engineer',
    categories: [
      { id: 'all', label: 'All questions', icon: 'list' },
      { id: 'cost-payback', label: 'Cost and payback period', icon: 'coins' },
      { id: 'warranty-service', label: 'Warranties and maintenance', icon: 'shield-check' },
      { id: 'documents-permits', label: 'Documents and permits', icon: 'file-text' },
      { id: 'storage', label: 'Batteries and energy storage', icon: 'battery' },
      { id: 'calculator', label: 'How to use the calculator', icon: 'calculator' },
      { id: 'solar-passport', label: 'Solar Passport', icon: 'file' }
    ],
    previewItems: [
      {
        question: 'Costs',
        answer: 'and payback',
        icon: 'coins',
        target: 'category-cost-payback'
      },
      {
        question: 'Warranties',
        answer: 'and service',
        icon: 'shield-check',
        target: 'category-warranty-service'
      },
      {
        question: 'Documents',
        answer: 'and permits',
        icon: 'file-text',
        target: 'category-documents-permits'
      },
      {
        question: 'Batteries',
        answer: 'and energy storage',
        icon: 'battery',
        target: 'category-storage'
      }
    ],
    meta: {
      title: 'Solar Systems in Armenia: FAQ | YOURENERGY',
      description:
        'Answers to common questions about solar-system pricing, estimates, payback, installation and maintenance.',
      ogTitle: 'Solar system FAQ | YOURENERGY',
      ogDescription: 'Clear answers about solar-system calculations, installation and operation.'
    },
    items: [
      {
        id: 'system-cost',
        category: 'cost-payback',
        icon: 'coins',
        question: 'How much does a solar system cost?',
        answer:
          'Start by selecting your region and entering your average electricity bill or consumption. The first result is preliminary. The final configuration and price are confirmed after the roof data, equipment and engineering conditions have been reviewed.'
      },
      {
        id: 'system-capacity',
        category: 'cost-payback',
        icon: 'calculator',
        question: 'How is the system capacity calculated?',
        answer:
          'The preliminary sizing is based on your electricity consumption and solar-resource data. Professional mode can refine the estimate using the exact property location, roof area, orientation and tilt. Final sizing and technical compatibility are confirmed by an engineer.'
      },
      {
        id: 'payback',
        category: 'cost-payback',
        icon: 'chart-bars',
        question: 'What is the payback period?',
        answer:
          'Payback is calculated when sufficient solar-production and financial data are available. The calculator can use the standard residential tariff or an effective electricity rate supplied by you. The result is preliminary and does not model future tariff increases, panel degradation, financing, taxes or future maintenance costs.'
      },
      {
        id: 'final-price',
        category: 'cost-payback',
        icon: 'zap',
        question: 'What affects the final system price?',
        answer:
          'The final price depends on system capacity, the selected panels and inverter, mounting hardware, roof conditions, protection and electrical components, optional battery storage and installation work. Website pricing is a preliminary guide, not a contractual offer.'
      },
      {
        id: 'financing',
        category: 'cost-payback',
        icon: 'file',
        question: 'Can the system be financed?',
        answer:
          'Credit or leasing availability depends on current financial-partner offers and the project parameters. A YOURENERGY specialist can explain the available options and terms for your project.'
      },
      {
        id: 'maintenance',
        category: 'warranty-service',
        icon: 'wrench',
        question: 'Do solar panels require maintenance?',
        answer:
          'Periodic inspections, monitoring checks and cleaning when needed help maintain efficient operation. The exact maintenance schedule depends on the equipment, installation conditions and local environment.'
      },
      {
        id: 'warranty',
        category: 'warranty-service',
        icon: 'shield-check',
        question: 'What warranty is provided for the equipment?',
        answer:
          'Warranty periods can differ between panels, inverters, batteries and installation work. The selected equipment comes with warranty terms confirmed by the manufacturer or supplier. Final warranty obligations are confirmed in the proposal and contract.'
      },
      {
        id: 'system-failure',
        category: 'warranty-service',
        icon: 'support',
        question: 'What should I do if the system develops a fault?',
        answer:
          'Contact the YOURENERGY team and provide the monitoring error or a description of the issue. Diagnosis comes first; further action depends on the cause, equipment warranty and the applicable service terms.'
      },
      {
        id: 'required-documents',
        category: 'documents-permits',
        icon: 'file-text',
        question: 'What documents are required for a solar system?',
        answer:
          'The exact document set depends on the property, system capacity and current grid requirements. A complete document package is not needed for the preliminary online calculation. During implementation, the engineer confirms the documents and process required for the specific project.'
      },
      {
        id: 'permits',
        category: 'documents-permits',
        icon: 'shield',
        question: 'Is a permit required for installation?',
        answer:
          'That depends on the property type, project and current requirements. Before implementation, a YOURENERGY engineer will verify the current requirements for the specific property.'
      },
      {
        id: 'grid-connection',
        category: 'documents-permits',
        icon: 'zap',
        question: 'How is the solar system connected to the grid?',
        answer:
          'The final grid-connection scheme and requirements depend on the project and current network conditions. The calculator provides a preliminary solar assessment and is not a grid-connection approval. Connection compatibility is confirmed during the engineering stage.'
      },
      {
        id: 'battery',
        category: 'storage',
        icon: 'battery',
        question: 'Can a battery be added?',
        answer:
          'Yes. Battery storage can be included when the selected inverter, system architecture and project conditions are compatible. Professional Calculator allows you to request a storage or backup assessment.'
      },
      {
        id: 'battery-sizing',
        category: 'storage',
        icon: 'chart-bars',
        question: 'How is battery capacity selected?',
        answer:
          'Accurate battery sizing depends on which loads must be backed up, their power demand and the desired backup duration. Total monthly household consumption alone is not sufficient for precise battery sizing.'
      },
      {
        id: 'battery-outage',
        category: 'storage',
        icon: 'zap',
        question: 'Will the solar system work during a grid outage?',
        answer:
          'Not every solar system continues operating automatically during a grid outage. Backup operation requires a compatible inverter, battery and properly designed backup configuration. This capability must be planned during system design.'
      },
      {
        id: 'battery-later',
        category: 'storage',
        icon: 'cycle',
        question: 'Can a battery be added later?',
        answer:
          'It is possible with many systems, but it depends on the inverter model, electrical architecture and compatibility of the future battery. If storage may be added later, it is best to account for that during the initial design.'
      },
      {
        id: 'calculator-modes',
        category: 'calculator',
        icon: 'calculator',
        question: 'What is the difference between Quick and Professional Calculator?',
        answer:
          'Quick Calculator is designed for an initial estimate: select your region and enter an average bill or consumption. Professional mode uses the same calculation foundation but adds exact location, solar-resource data, roof parameters, more detailed consumption inputs and expanded results.'
      },
      {
        id: 'professional-calculator',
        category: 'calculator',
        icon: 'calculator',
        question: 'How do I use Professional Calculator?',
        answer:
          'Professional Calculator refines the preliminary estimate with location, consumption and roof data, then presents expanded results.',
        guide: [
          {
            title: 'Step 1 — Location',
            copy: 'Search for the address, select the correct result and confirm the property on the map. If needed, select the point directly on the map or enter coordinates. The calculator obtains reference solar-resource data for the selected location.',
            tip: 'Tip: choosing the correct address makes the preliminary estimate more useful.'
          },
          {
            title: 'Step 2 — Consumption',
            copy: 'Choose the input method for the information you have: average bill, average kWh consumption or a monthly consumption profile. If you know your effective AMD/kWh rate, it can be used for the financial calculation.',
            tip: 'Tip: actual kWh consumption is usually more useful than the bill amount alone.'
          },
          {
            title: 'Step 3 — Roof',
            copy: 'Outline the roof on the map or enter a measured roof section area. For a map outline, mark at least 3 points on the same roof. Confirm orientation, tilt and mounting method. Map-derived roof area is preliminary.',
            tip: 'Tip: a map outline does not replace physical measurement or a shading assessment.'
          },
          {
            title: 'Step 4 — Results',
            copy: 'Review the recommended system capacity, panel count, annual generation, consumption coverage, roof compatibility, preliminary equipment selection and, when available, financial estimates. From the results you can open Solar Passport, create the PDF report or send the calculation to an engineer.',
            tip: 'Tip: the result is preliminary; an engineer confirms final technical compatibility.'
          }
        ]
      },
      {
        id: 'consumption-input',
        category: 'calculator',
        icon: 'chart-bars',
        question: 'Which consumption data should I enter?',
        answer:
          'If actual kWh consumption is available, use it. If you only know the monthly bill amount, the calculator can derive a preliminary consumption estimate. Professional mode also supports a monthly profile. More accurate consumption data produces a more useful preliminary system sizing.'
      },
      {
        id: 'roof-map',
        category: 'calculator',
        icon: 'roof-measure',
        question: 'How should I mark the roof on the map?',
        answer:
          'Choose the roof-outline method and mark at least 3 points around the same roof section. Adjust the points if needed and review the resulting area. The map outline provides a preliminary projected area and does not replace physical measurement, shading assessment or structural verification.'
      },
      {
        id: 'calculator-results',
        category: 'calculator',
        icon: 'chart-bars',
        question: 'What do the calculator results mean?',
        answer:
          'Results include preliminary recommended capacity, panel count, expected generation, consumption coverage, roof constraints, preliminary equipment selection, environmental indicators and financial estimates when data are available. They are not a final engineering design or contractual offer.'
      },
      {
        id: 'solar-passport',
        category: 'solar-passport',
        icon: 'file',
        question: 'What is Solar Passport?',
        answer:
          'Solar Passport brings together the calculation inputs, results, data sources, preliminary equipment selection and modelling assumptions. It helps explain what the estimate is based on, but it does not replace a site survey, engineering design or commercial proposal.'
      },
      {
        id: 'solar-passport-pdf',
        category: 'solar-passport',
        icon: 'download',
        question: 'Can I save the calculation as a PDF?',
        answer:
          'Yes. Professional Calculator results provide a printable/PDF report containing a summary of the system, roof, generation, financial picture, data sources and major limitations.'
      }
    ]
  },
  finalCta: {
    title: 'Ready to discover your home’s potential?',
    copy: 'Start a preliminary analysis and see which information is confirmed, missing or still needs an engineer.',
    primary: 'Calculate my home',
    secondary: 'View Solar Passport',
    note: 'Free, with no obligation and no binding commercial offer.'
  },
  footer: {
    description:
      'Solar systems for homes and businesses: audit, design, installation, service and monitoring.',
    update: {
      message: 'A new site version is ready. Refresh to apply it.',
      action: 'Refresh'
    },
    columns: [
      {
        title: 'SOLUTIONS',
        links: [
          ['Calculator', '#calculator'],
          ['Projects', '#projects'],
          ['Equipment', '#equipment']
        ]
      },
      {
        title: 'COMPANY',
        links: [
          ['About Us', '#about'],
          ['How It Works', '#process'],
          ['Contacts', '#contacts']
        ]
      },
      {
        title: 'RESOURCES',
        links: [
          ['FAQ', '#faq'],
          ['Blog', '#blog']
        ]
      }
    ],
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    copyright: '© 2026 YOURENERGY. All rights reserved.',
    contacts: 'CONTACTS',
    developedBy: 'Developed by ScriptForge'
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
    mapFailed: 'The map is unavailable. A static fallback is shown instead.',
    monthTooltip: 'Generation in {month}: {value} kWh'
  }
};
