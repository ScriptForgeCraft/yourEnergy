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
    title: 'Solar calculator for homes in Armenia | YOURENERGY',
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
    whatsappHref: 'https://wa.me/37491095950',
    whatsappLabel: 'Chat with us on WhatsApp',
    phoneLabel: 'Call +374 91 095 950',
    address1: '48/14 Artashisyan St., Yerevan, Armenia',
    address2: '33, 26th Street, Zovuni, Kotayk Province, Armenia',
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
      title: 'PVGIS location reference',
      loading: 'Requesting PVGIS for the confirmed point…',
      annualYieldLabel: 'PVGIS reference yield',
      orientationLabel: 'Reference optimal direction',
      tiltLabel: 'Reference optimal tilt',
      source: 'Source: PVGIS · preliminary 14% system-loss assumption',
      disclosure:
        'PVGIS values describe the solar resource at this location for a reference 1 kWp fixed system. Your actual roof is analysed in Step 3.',
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
      copy: 'Enter your electricity usage to calculate the optimal system size.',
      modes: {
        bill: 'Average bill',
        usage: 'Average consumption',
        monthly: 'Monthly profile'
      },
      billLabel: 'Average electricity bill',
      billHelp: 'Enter the average monthly amount in AMD.',
      tariffLabel: 'Tariff from your bill',
      tariffHelp:
        'Optional for kWh. A bill in AMD needs the tariff to convert the amount to kWh; Solar Passport will mark it as user-provided.',
      tariffBillLabel: 'Tariff AMD/kWh — required to calculate consumption',
      tariffBillHelp: 'Enter the rate from your bill to convert AMD to kWh.',
      tariffOptionalLabel: 'Tariff AMD/kWh — optional',
      tariffOptionalHelp: 'Used to estimate your annual financial savings.',
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
      copy: 'Outline the usable roof area and enter the actual roof-face parameters for a preliminary estimate.',
      mapDisclosure:
        'The map helps place a point and an approximate outline. Without aerial imagery or a 3D model, it cannot automatically detect the roof, its pitch or shading.',
      fallback: 'The map is unavailable. Enter and manually confirm the property coordinates.',
      start: 'Start outline',
      addPointAtCenter: 'Add a point at the map centre',
      addPoint: 'Add point',
      undo: 'Undo last point',
      reset: 'Clear outline',
      finish: 'Finish outline',
      finishHelp:
        'Enter the roof-face parameters and consumption, then request a preliminary PVGIS calculation.',
      edit: 'Edit outline',
      pointsLabel: 'Points in outline: {count}',
      minimumPoints: 'Add at least 3 points to finish the outline.',
      areaLabel: 'Preliminary area from the outline',
      mountingModeLabel: 'Mounting approach',
      mountingModeHelp:
        'PVGIS calculates the entered plane as building-mounted for roof-parallel systems and free-standing for elevated systems. A PVGIS optimum remains a separate benchmark.',
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
        'Preliminary YOURENERGY price · {version} · not an offer: {p25}–{p75}; P50 {p50}. Valid until {validUntil}.'
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
        pricebook: 'Temporary YOURENERGY price list',
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
        PRELIMINARY_PANEL_FROM_EQUIPMENT_CATALOG:
          'Preliminary capacity uses a module from the equipment catalog; an engineer must confirm the final specification.',
        USER_PROVIDED_TARIFF:
          'The tariff was entered by the visitor from a bill and is not a tariff registry record.',
        TEMPORARY_PRICEBOOK_NOT_OFFER:
          'The temporary price list is a preliminary budget guide, not an offer or contractual price.',
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
    status: {
      geocodeUnavailable: 'The geocoding service is not connected or is temporarily unavailable.',
      analysisUnavailable:
        'The solar-analysis service is not connected or is temporarily unavailable.',
      outsideServiceArea:
        'This free preliminary calculator currently serves points in Armenia only.',
      roofAreaRequiresMeasured:
        'For a very steep roof, enter a measured roof-face area instead of a top-view area.',
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
      'First choose and confirm a point manually, then see its PVGIS potential. Roof and consumption data are only needed for the detailed estimate.',
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
        title: 'PVGIS data',
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
            value: 'Enter the roof-face direction',
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
        ],
        cta: 'Start my solar analysis'
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
    homeTitle: 'Answers to important questions',
    pageTitle: 'Solar system questions, answered',
    intro: 'Clear, concise answers to help you make a confident decision about a solar system.',
    answersEyebrow: 'All questions',
    answersTitle: 'Detailed answers',
    answersIntro:
      'The essentials on calculations, pricing, installation and how a solar system works.',
    allQuestions: 'All questions',
    notFound: 'Didn’t find an answer?',
    contactLink: 'Contact us',
    previewItems: [
      {
        question: 'How much does a solar system cost?',
        answer: 'The price depends on your consumption, property type and chosen equipment.',
        icon: 'faq-home'
      },
      {
        question: 'How much energy can I get?',
        answer:
          'Estimate the expected generation for your home in our calculator in a few minutes.',
        icon: 'zap'
      },
      {
        question: 'How does installation work?',
        answer: 'From system design to commissioning, our team coordinates every stage.',
        icon: 'faq-settings'
      },
      {
        question: 'Are permits required?',
        answer: 'We help with documents and requirements that apply to your property.',
        icon: 'shield-check'
      }
    ],
    meta: {
      title: 'Solar system FAQ in Armenia | YOURENERGY',
      description:
        'Answers to common questions about solar-system pricing, estimates, payback, installation and maintenance.',
      ogTitle: 'Solar system FAQ | YOURENERGY',
      ogDescription: 'Clear answers about solar-system calculations, installation and operation.'
    },
    items: [
      [
        'How much does a solar system cost?',
        'Start with your region and average bill or consumption. The first result is preliminary; an optional roof refinement and engineering review confirm the final system and price.'
      ],
      [
        'How is system capacity calculated?',
        'The first calculation uses the selected region and your consumption. You can then refine it with your roof area; detailed roof, shading and grid checks remain an engineering task.'
      ],
      [
        'What is the payback period?',
        'Payback is shown only after PVGIS analysis and a tariff entered by you. The model excludes tariff growth, degradation, maintenance, financing, discounting, taxes and export rules.'
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
        'Yes. The Energy Independence option includes an example with battery storage. Actual capacity is selected from the consumption profile and required backup time.'
      ],
      [
        'Can I finance a system?',
        'No verified financing programme is currently published on the website. Financing terms will be stated only when a specific partner and agreement are confirmed.'
      ],
      [
        'What is a Solar Passport?',
        'A preliminary Solar Passport keeps the current calculation inputs, sources and assumptions together. It is not an engineering design, bank document or binding offer; a permanent link and PDF are not currently generated.'
      ]
    ].map(([question, answer], index) => ({
      question,
      answer,
      icon: [
        'calculator',
        'zap',
        'satellite',
        'shield-check',
        'sun',
        'cycle',
        'file',
        'message-square'
      ][index]
    }))
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
    columns: [
      {
        title: 'For homes',
        links: [
          ['Calculator', '#calculator'],
          ['FAQ', '#faq']
        ]
      },
      {
        title: 'Company',
        links: [['How it works', '#process']]
      },
      {
        title: 'Information',
        links: [['Contact', '#contacts']]
      }
    ],
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
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
    mapFailed: 'The map is unavailable. A static fallback is shown instead.',
    monthTooltip: 'Generation in {month}: {value} kWh'
  }
};
