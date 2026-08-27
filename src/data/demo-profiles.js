/**
 * Intentionally local, transparent example data. These values do not represent
 * a geocoded property, live tariff, quote, or production forecast.
 */
export const BASE_MONTHLY = Object.freeze([
  600, 750, 1050, 1350, 1600, 1750, 1850, 1750, 1450, 1100, 750, 600
]);

const baseTimeline = Object.freeze([
  { year: 0, net: -4_300_000 },
  { year: 5, net: -700_000 },
  { year: 6, net: 20_000 },
  { year: 10, net: 2_900_000 },
  { year: 25, net: 13_700_000 }
]);

export const BASE_PROFILE = Object.freeze({
  id: 'yerevan',
  keywords: [],
  location: { hy: 'Երևան · ստանդարտ դեմո պրոֆիլ', ru: 'Ереван · стандартный демо-профиль' },
  roof: {
    areaSqm: 124,
    orientation: 236,
    orientationLabel: { hy: 'Հարավ-արևմուտք (236°)', ru: 'Юго-запад (236°)' },
    tilt: 32
  },
  system: { panelCount: 17, panelWatts: 580, capacityKwp: 9.86 },
  annualGeneration: 14_600,
  monthlyGeneration: BASE_MONTHLY,
  capex: 4_300_000,
  annualSavings: 720_000,
  coverage: 92,
  timeline: baseTimeline
});

const createProfile = (profile) => Object.freeze(profile);

const DEMO_PROFILES = Object.freeze([
  BASE_PROFILE,
  createProfile({
    id: 'arabkir',
    keywords: ['arabkir', 'арабкир', 'արաբկիր'],
    location: { hy: 'Երևան, Արաբկիր · դեմո պրոֆիլ', ru: 'Ереван, Арабкир · демо-профиль' },
    roof: BASE_PROFILE.roof,
    system: BASE_PROFILE.system,
    annualGeneration: 14_600,
    monthlyGeneration: BASE_MONTHLY,
    capex: 4_300_000,
    annualSavings: 720_000,
    coverage: 92,
    timeline: baseTimeline
  }),
  createProfile({
    id: 'abovyan',
    keywords: ['abovyan', 'абовян', 'աբովյան'],
    location: { hy: 'Աբովյան · դեմո պրոֆիլ', ru: 'Абовян · демо-профиль' },
    roof: {
      areaSqm: 96,
      orientation: 212,
      orientationLabel: { hy: 'Հարավ (212°)', ru: 'Юг (212°)' },
      tilt: 29
    },
    system: { panelCount: 13, panelWatts: 580, capacityKwp: 7.54 },
    annualGeneration: 10_150,
    monthlyGeneration: [420, 520, 735, 940, 1115, 1215, 1285, 1215, 1005, 765, 520, 415],
    capex: 3_050_000,
    annualSavings: 515_000,
    coverage: 81,
    timeline: [
      { year: 0, net: -3_050_000 },
      { year: 5, net: -475_000 },
      { year: 6, net: 40_000 },
      { year: 10, net: 2_100_000 },
      { year: 25, net: 9_825_000 }
    ]
  }),
  createProfile({
    id: 'ararat',
    keywords: ['ararat', 'арарат', 'արարատ'],
    location: { hy: 'Արարատ · դեմո պրոֆիլ', ru: 'Арарат · демо-профиль' },
    roof: {
      areaSqm: 148,
      orientation: 222,
      orientationLabel: { hy: 'Հարավ-արևմուտք (222°)', ru: 'Юго-запад (222°)' },
      tilt: 30
    },
    system: { panelCount: 22, panelWatts: 580, capacityKwp: 12.76 },
    annualGeneration: 18_900,
    monthlyGeneration: [780, 970, 1340, 1750, 2070, 2270, 2400, 2270, 1880, 1420, 970, 780],
    capex: 6_750_000,
    annualSavings: 1_070_000,
    coverage: 98,
    timeline: [
      { year: 0, net: -6_750_000 },
      { year: 5, net: -1_400_000 },
      { year: 7, net: 90_000 },
      { year: 10, net: 3_950_000 },
      { year: 25, net: 20_000_000 }
    ]
  })
]);

const normalize = (value) =>
  String(value ?? '')
    .trim()
    .toLocaleLowerCase();

export const selectDemoProfile = (address) => {
  const normalized = normalize(address);
  return (
    DEMO_PROFILES.find((profile) =>
      profile.keywords.some((keyword) => normalized.includes(keyword))
    ) ?? BASE_PROFILE
  );
};

const roundedTimeline = (profile) => profile.timeline.map(({ year, net }) => ({ year, net }));

/**
 * Maps a transparent local profile into the public HomeAnalysis shape.
 */
export const buildAnalysis = (profile = BASE_PROFILE, { locale = 'ru' } = {}) => {
  const selected = profile ?? BASE_PROFILE;
  const paybackYears = selected.capex / selected.annualSavings;

  return {
    source: 'demo',
    profileId: selected.id,
    location: {
      label: selected.location[locale] ?? selected.location.ru,
      geocoded: false
    },
    roof: {
      areaSqm: selected.roof.areaSqm,
      orientation: selected.roof.orientation,
      orientationLabel: selected.roof.orientationLabel[locale] ?? selected.roof.orientationLabel.ru,
      tilt: selected.roof.tilt
    },
    system: {
      panelCount: selected.system.panelCount,
      panelWatts: selected.system.panelWatts,
      capacityKwp: selected.system.capacityKwp
    },
    annualGeneration: selected.annualGeneration,
    monthlyGeneration: [...selected.monthlyGeneration],
    savings: {
      annual: selected.annualSavings,
      gross25Years: selected.annualSavings * 25
    },
    coverage: selected.coverage,
    payback: {
      years: paybackYears,
      displayYears: Math.round(paybackYears * 10) / 10
    },
    timeline: roundedTimeline(selected),
    assumptions: [
      'No tariff escalation',
      'No degradation',
      'No maintenance, discounting, or credit included',
      'ENA and PVGIS are future integrations only'
    ]
  };
};
