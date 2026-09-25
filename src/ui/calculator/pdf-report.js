import { calculatePreliminaryRoofCapacity } from '../../domain/roof-capacity.js';

const PAGE_WIDTH_PT = 595.28;
const PAGE_HEIGHT_PT = 841.89;

const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const escapeHtml = (value) =>
  String(value ?? '—').replace(/[&<>"']/gu, (character) => {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return entities[character];
  });

const displayNumber = (value, locale, { maximumFractionDigits = 0 } = {}) => {
  void locale;
  const numeric = asNumber(value);
  return numeric === null
    ? '—'
    : new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(numeric);
};

const displayDate = (value, locale) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const interpolate = (template, values = {}) =>
  String(template ?? '').replace(/\{([a-zA-Z0-9_]+)\}/gu, (_match, key) =>
    values[key] === null || values[key] === undefined ? '' : String(values[key])
  );

const isInternalCode = (value) => /^[A-Z0-9_]{5,}$/u.test(String(value ?? '').trim());

const safeText = (value) => (isInternalCode(value) ? null : value);

const shortReportId = (value) => {
  const id = String(value ?? '').trim();
  if (!id) return '';
  return id.slice(-8);
};

const reportStyles = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f2f5f8; }
  body {
    color: #17324D;
    font-family: "DejaVu Sans", "Segoe UI", Arial, sans-serif;
    font-size: 9pt;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .pdf-report { margin: 0; padding: 0; }
  .pdf-page {
    position: relative;
    width: ${PAGE_WIDTH_PT}pt;
    height: ${PAGE_HEIGHT_PT}pt;
    margin: 0 auto 18pt;
    overflow: hidden;
    color: #17324D;
    background: #FFFFFF;
    break-after: page;
    page-break-after: always;
  }
  .pdf-page:last-child { break-after: auto; page-break-after: auto; }
  .pdf-card { background: #FFFFFF; border: .85pt solid #D9E5F1; border-radius: 12pt; break-inside: avoid; }
  .pdf-muted { color: #65798E; }
  .pdf-brand {
    position: absolute;
    top: 29.5pt;
    left: 40pt;
    display: inline-flex;
    align-items: center;
    gap: 4pt;
    height: 14pt;
    font-size: 8.5pt;
    font-weight: 700;
    letter-spacing: .02em;
  }
  .pdf-brand__sun { width: 14pt; height: 14pt; flex: 0 0 auto; }
  .pdf-brand__your { color: #0E2F57; }
  .pdf-brand__energy { color: #F5B82E; }
  .pdf-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 19pt;
    padding: 0 10pt;
    border-radius: 10pt;
    color: #9A6A00;
    background: #FFF6D9;
    font-size: 7.2pt;
    font-weight: 700;
    letter-spacing: .04em;
    white-space: nowrap;
  }
  .pdf-page-heading {
    position: absolute;
    top: 54pt;
    left: 40pt;
    width: 515.28pt;
  }
  .pdf-page-title {
    margin: 0;
    color: #0E2F57;
    font-size: 18pt;
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -.02em;
  }
  .pdf-page-subtitle {
    margin: 6pt 0 0;
    color: #65798E;
    font-size: 9.5pt;
    line-height: 1.35;
  }
  .pdf-footer {
    position: absolute;
    right: 38pt;
    bottom: 14pt;
    left: 38pt;
    height: 16pt;
    border-top: .6pt solid #D9E5F1;
    color: #65798E;
    font-size: 7.2pt;
  }
  .pdf-footer__left { position: absolute; top: 5.5pt; left: 0; }
  .pdf-footer__right { position: absolute; top: 5.5pt; right: 0; }
  .pdf-kicker { color: #65798E; font-size: 8.2pt; font-weight: 700; }
  .pdf-value { color: #17324D; font-weight: 700; }
  .pdf-divider { height: .6pt; background: #D9E5F1; }
  .pdf-row {
    display: grid;
    grid-template-columns: 46% 54%;
    align-items: start;
    min-height: 29pt;
    padding: 7pt 0 5pt;
    border-bottom: .45pt solid #D9E5F1;
  }
  .pdf-row:last-child { border-bottom: 0; }
  .pdf-row__label { color: #65798E; font-size: 8.2pt; line-height: 1.25; }
  .pdf-row__value { color: #17324D; font-size: 8.6pt; font-weight: 700; line-height: 1.25; overflow-wrap: anywhere; }
  .metric-card {
    position: absolute;
    height: 82pt;
    overflow: hidden;
    border: .85pt solid #D9E5F1;
    border-radius: 10pt;
    background: #FFFFFF;
    padding: 13pt 14pt 12pt;
  }
  .metric-card::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 4pt;
    border-radius: 2pt;
    background: var(--accent, #1F7AE0);
    content: "";
  }
  .metric-card__label { color: #65798E; font-size: 8.5pt; line-height: 1.3; }
  .metric-card__value { margin-top: 8pt; color: #0E2F57; font-size: 16pt; font-weight: 700; line-height: 1.05; }
  .metric-card__unit { margin-top: 4pt; color: #65798E; font-size: 7.7pt; }
  .bar-track { height: 14pt; overflow: hidden; border-radius: 7pt; background: #F5F8FC; }
  .bar-fill { height: 100%; border-radius: inherit; }
  .bar-fill--blue { background: #1F7AE0; }
  .bar-fill--navy { background: #0E2F57; }
  .month-chart { position: absolute; left: 16pt; right: 16pt; bottom: 22pt; height: 112pt; }
  .month-chart__bars {
    position: absolute;
    right: 0;
    bottom: 20pt;
    left: 0;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 5pt;
    align-items: end;
    height: 82pt;
    border-bottom: .5pt solid #D9E5F1;
  }
  .month-chart__item { position: relative; min-width: 0; height: 100%; }
  .month-chart__bar {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: var(--bar-height);
    min-height: 2pt;
    border-radius: 2pt 2pt 0 0;
    background: var(--bar-color, #1F7AE0);
  }
  .month-chart__label {
    position: absolute;
    top: calc(100% + 5pt);
    left: 50%;
    color: #65798E;
    font-size: 6.3pt;
    white-space: nowrap;
    transform: translateX(-50%);
  }
  .month-chart__unit { position: absolute; right: 0; bottom: -1pt; color: #65798E; font-size: 6.6pt; }
  .assumption-card {
    position: absolute;
    width: 252.6pt;
    height: 112pt;
    border: .85pt solid #D9E5F1;
    border-radius: 11pt;
    background: #FFFFFF;
    padding: 44pt 16pt 12pt;
  }
  .assumption-card__title {
    position: absolute;
    top: 14pt;
    left: 14pt;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 132pt;
    min-height: 21pt;
    padding: 0 10pt;
    border-radius: 11pt;
    color: #0E2F57;
    background: #EAF4FF;
    font-size: 7.7pt;
    font-weight: 700;
    text-align: center;
  }
  .assumption-card__body { color: #17324D; font-size: 7.4pt; line-height: 1.34; }
  .source-status { min-width: 0; }
  .source-status__label { min-height: 25pt; color: #65798E; font-size: 7.1pt; line-height: 1.2; }
  .source-status__state { display: flex; align-items: center; gap: 7pt; color: #17324D; font-size: 7.1pt; font-weight: 700; }
  .source-status__dot { width: 6pt; height: 6pt; flex: 0 0 auto; border-radius: 50%; background: var(--dot, #65798E); }
  @media screen {
    .pdf-page { box-shadow: 0 8pt 26pt rgba(14, 47, 87, .12); }
  }
  @media print {
    html, body { background: #FFFFFF; }
    .pdf-page { margin: 0; box-shadow: none; }
  }
`;

const brand = () => `<div class="pdf-brand" aria-label="YOURENERGY">
  <svg class="pdf-brand__sun" viewBox="0 0 20 20" aria-hidden="true">
    <g fill="none" stroke="#F5B82E" stroke-width="1.4" stroke-linecap="round">
      <path d="M10 1.3v2.2M10 16.5v2.2M1.3 10h2.2M16.5 10h2.2M3.85 3.85l1.55 1.55M14.6 14.6l1.55 1.55M16.15 3.85L14.6 5.4M5.4 14.6l-1.55 1.55"/>
    </g>
    <circle cx="10" cy="10" r="3.2" fill="#F5B82E"/>
  </svg>
  <span><span class="pdf-brand__your">YOUR</span><span class="pdf-brand__energy">ENERGY</span></span>
</div>`;

const reportFooter = ({ page, total, label, reportId }) => `<footer class="pdf-footer">
  <span class="pdf-footer__left">${escapeHtml(`YOURENERGY · ${label}`)}</span>
  <span class="pdf-footer__right">${escapeHtml(`${page}/${total}${reportId ? ` · ${shortReportId(reportId)}` : ''}`)}</span>
</footer>`;

const reportPage = ({ page, copy, reportId, content }) => `<section class="pdf-page pdf-page--${page}" data-pdf-page="${page}">
  ${brand()}
  ${content}
  ${reportFooter({ page, total: 4, label: copy.footerLabel, reportId })}
</section>`;

const statusBadge = (label, className = '') =>
  `<span class="pdf-badge ${className}">${escapeHtml(label)}</span>`;

const metricCard = ({ x, width, top, label, value, unit = '', accent, valueSize = 16 }) => `<article class="metric-card" style="left:${x}pt;top:${top}pt;width:${width}pt;--accent:${accent}">
  <div class="metric-card__label">${escapeHtml(label)}</div>
  <div class="metric-card__value" style="font-size:${valueSize}pt">${escapeHtml(value)}</div>
  ${unit ? `<div class="metric-card__unit">${escapeHtml(unit)}</div>` : ''}
</article>`;

const dataRows = (rows) =>
  rows
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(
      ([label, value]) => `<div class="pdf-row">
        <div class="pdf-row__label">${escapeHtml(label)}</div>
        <div class="pdf-row__value">${escapeHtml(value)}</div>
      </div>`
    )
    .join('');

const monthlyBarChart = ({ values, months, unit, kind }) => {
  const numericValues = Array.from({ length: 12 }, (_unused, index) => asNumber(values?.[index]) ?? 0);
  const maximum = Math.max(...numericValues, 1) * 1.15;
  const bars = numericValues
    .map((value, index) => {
      const height = Math.max(0, Math.min(100, (value / maximum) * 100));
      const color = index >= 5 && index <= 7 ? '#0E2F57' : '#1F7AE0';
      const label = months?.[index]?.short ?? String(index + 1);
      return `<div class="month-chart__item">
        <div class="month-chart__bar" data-monthly-bar="${index + 1}" style="--bar-height:${height.toFixed(2)}%;--bar-color:${color}" title="${escapeHtml(`${label}: ${value} ${unit}`)}"></div>
        <span class="month-chart__label">${escapeHtml(label)}</span>
      </div>`;
    })
    .join('');
  return `<div class="month-chart" data-monthly-chart="${escapeHtml(kind ?? 'chart')}" role="img" aria-label="${escapeHtml(unit)}"><div class="month-chart__bars">${bars}</div><span class="month-chart__unit">${escapeHtml(unit)}</span></div>`;
};

const comparisonBar = ({ label, value, max, tone = 'blue', unit }) => {
  const numeric = asNumber(value) ?? 0;
  const safeMax = Math.max(asNumber(max) ?? 1, 1);
  const width = Math.max(0, Math.min(100, (numeric / safeMax) * 100));
  return `<div style="display:grid;grid-template-columns:120pt 1fr;gap:10pt;align-items:center;margin-top:12pt">
    <div style="color:#65798E;font-size:8.2pt">${escapeHtml(label)}</div>
    <div>
      <div style="display:flex;align-items:center;gap:8pt">
        <div class="bar-track" style="flex:1;background:#FFFFFF"><div class="bar-fill bar-fill--${tone}" style="width:${width.toFixed(2)}%"></div></div>
        <strong style="min-width:112pt;text-align:right;color:#17324D;font-size:8.4pt">${escapeHtml(`${displayNumber(numeric, 'en-US')} ${unit}`)}</strong>
      </div>
    </div>
  </div>`;
};

const sourceStatus = ({ label, status, color }) => `<div class="source-status">
  <div class="source-status__label">${escapeHtml(label)}</div>
  <div class="source-status__state"><span class="source-status__dot" style="--dot:${color}"></span><span>${escapeHtml(status)}</span></div>
</div>`;

const assumptionCard = ({ x, top, title, body }) => `<article class="assumption-card" style="left:${x}pt;top:${top}pt">
  <div class="assumption-card__title">${escapeHtml(title)}</div>
  <div class="assumption-card__body">${escapeHtml(body)}</div>
</article>`;

const equipmentDetails = ({ analysis, scenario, copy, locale }) => {
  const recommendation = analysis.equipmentRecommendation ?? {};
  const module = recommendation.solarModule ?? analysis.equipment ?? scenario.system?.equipment ?? {};
  const inverter = recommendation.inverter ?? analysis.inverterRecommendation ?? {};
  const moduleBrand = module.panelBrand ?? module.brand;
  const moduleModel = module.panelModel ?? module.model ?? module.productName;
  const moduleName = [moduleBrand, moduleModel].filter(Boolean).join(' ');
  const moduleWatts = asNumber(scenario.system?.panelWatts ?? module.watts);
  const inverterName = [inverter.brand, inverter.productName ?? inverter.model].filter(Boolean).join(' ');
  const inverterKw = asNumber(inverter.selectedAcPowerKw ?? inverter.acPowerKw);
  return {
    module: moduleName
      ? `${moduleName}${moduleWatts === null ? '' : ` · ${displayNumber(moduleWatts, locale)} W`}`
      : copy.unavailable,
    inverter: inverterName
      ? `${inverterName}${inverterKw === null ? '' : ` · ${displayNumber(inverterKw, locale, { maximumFractionDigits: 1 })} kW`}`
      : copy.unavailable
  };
};

const createCopy = ({ wizard, product }) => {
  const pdf = wizard.pdfReport ?? {};
  return {
    title: pdf.title ?? 'Preliminary solar system report',
    subtitle: pdf.subtitle ?? '',
    preliminary: pdf.preliminary ?? 'PRELIMINARY',
    generated: pdf.generated ?? 'Generated',
    reportId: pdf.reportId ?? 'Report ID',
    footerLabel: pdf.footerLabel ?? pdf.title ?? 'Preliminary solar report',
    page2Title: pdf.page2Title ?? 'System, roof and energy balance',
    page2Subtitle: pdf.page2Subtitle ?? '',
    page3Title: pdf.page3Title ?? 'Production and financial overview',
    page3Subtitle: pdf.page3Subtitle ?? '',
    page4Title: pdf.page4Title ?? 'Inputs, sources and limitations',
    page4Subtitle: pdf.page4Subtitle ?? '',
    recommendedSystem: pdf.recommendedSystem ?? wizard.recommendedSystemTitle ?? 'Recommended system',
    annualProduction: pdf.annualProduction ?? wizard.metrics?.annualGeneration ?? 'Annual generation',
    annualCoverage: pdf.annualCoverage ?? wizard.annualCoverage ?? 'Annual consumption coverage',
    coverageSentence: pdf.coverageSentence ?? '{value}% annual consumption coverage',
    annualSavings: pdf.annualSavings ?? wizard.metrics?.annualSavings ?? 'Annual savings',
    remainingGridDemand: pdf.remainingGridDemand ?? wizard.remainingGridDemand ?? 'Remaining annual grid demand',
    co2: pdf.co2 ?? wizard.environmental?.co2 ?? 'CO₂ reduction',
    perYear: pdf.perYear ?? 'per year',
    projectSummary: pdf.projectSummary ?? wizard.projectSummaryTitle ?? 'Your project summary',
    property: pdf.property ?? wizard.projectLocation ?? 'Property',
    consumption: pdf.consumption ?? wizard.annualConsumption ?? 'Annual consumption',
    roof: pdf.roof ?? wizard.roofSummary ?? 'Roof',
    pvgisReferenceYield: pdf.pvgisReferenceYield ?? wizard.pvgisReferenceYield ?? 'PVGIS reference yield',
    usableArea: pdf.usableArea ?? wizard.preliminaryUsableRoofArea ?? 'Usable module area',
    mounting: pdf.mounting ?? 'Mounting approach',
    disclaimer: pdf.disclaimer ?? pdf.footer ?? '',
    solarModule: pdf.module ?? wizard.moduleRecommendationTitle ?? 'Solar module',
    inverter: pdf.inverter ?? wizard.inverterRecommendationTitle ?? 'Inverter',
    whyPanels: pdf.whyPanels ?? 'Why {count} modules',
    sizingExplanation: pdf.sizingExplanation ?? 'The system is sized for consumption, not to fill the whole roof.',
    roofCapacityTitle: pdf.roofCapacityTitle ?? wizard.roofCapacityTitle ?? 'Physical roof capacity',
    roofArea: pdf.roofArea ?? wizard.roofAreaForSizing ?? 'Roof area',
    physicalModuleLimit: pdf.physicalModuleLimit ?? wizard.maximumPanelsForRoof ?? 'Physical module limit',
    physicalCapacity: pdf.physicalCapacity ?? wizard.physicalDcCapacityLimit ?? 'Physical DC capacity limit',
    roofNotLimiting: pdf.roofNotLimiting ?? wizard.roofCapacityNotLimiting ?? 'Roof capacity is not a limiting factor.',
    roofLimiting: pdf.roofLimiting ?? wizard.roofCapacityLimiting ?? 'Roof capacity limits the recommended system.',
    energyBalanceTitle: pdf.energyBalanceTitle ?? wizard.energyBalanceTitle ?? 'Annual energy balance',
    solarProduction: pdf.solarProduction ?? 'Solar production',
    roofReferenceTitle: pdf.roofReferenceTitle ?? wizard.roofReferenceComparison ?? 'PVGIS reference and roof estimate',
    roofSpecificYield: pdf.roofSpecificYield ?? wizard.roofSystemYield ?? 'Estimated specific yield for the roof',
    roofYieldExplanation: pdf.roofYieldExplanation ?? wizard.roofYieldExplanation ?? '',
    payback: pdf.payback ?? wizard.metrics?.payback ?? 'Payback period',
    twentyFiveYears: pdf.twentyFiveYears ?? 'Over 25 years',
    budgetRange: pdf.budgetRange ?? pdf.budget ?? 'Preliminary budget range',
    centralEstimate: pdf.centralEstimate ?? 'Central estimate: {value}',
    budgetDisclaimer: pdf.budgetDisclaimer ?? '',
    monthlyProductionTitle: pdf.monthlyProductionTitle ?? pdf.monthly ?? wizard.production ?? 'Monthly solar production',
    monthlyProductionNote: pdf.monthlyProductionNote ?? 'Annual total: {value} kWh · Monthly values are rounded.',
    pvgisMonthlyTitle: pdf.pvgisMonthlyTitle ?? pdf.monthlyLocationReference ?? 'Monthly PVGIS reference yield',
    pvgisMonthlyNote: pdf.pvgisMonthlyNote ?? 'Reference total: {value} kWh/kWp/year · preliminary 14% system-loss assumption.',
    inputsTitle: pdf.inputsTitle ?? pdf.inputs ?? 'Your inputs',
    coordinates: pdf.coordinates ?? wizard.calculationBasis?.coordinates ?? 'Coordinates',
    inputMethod: pdf.inputMethod ?? 'Consumption input method',
    tariff: pdf.tariff ?? wizard.metrics?.tariff ?? 'Tariff',
    storageRequest: pdf.storageRequest ?? wizard.storageRequestLabel ?? 'Storage review',
    yes: pdf.yes ?? 'Yes',
    no: pdf.no ?? 'No',
    calculationBasisTitle: pdf.calculationBasisTitle ?? wizard.calculationBasisTitle ?? 'Calculation basis',
    pvgisReferenceOrientation: pdf.pvgisReferenceOrientation ?? 'PVGIS reference direction / tilt',
    sourcesTitle: pdf.sourcesTitle ?? 'Sources',
    sourcePvgis: pdf.sourcePvgis ?? 'PVGIS solar data',
    sourceTariff: pdf.sourceTariff ?? 'Tariff',
    sourceEquipment: pdf.sourceEquipment ?? 'Equipment catalogue',
    sourcePricebook: pdf.sourcePricebook ?? 'Price book',
    sourceConfirmed: pdf.sourceConfirmed ?? 'confirmed',
    sourceUserProvided: pdf.sourceUserProvided ?? 'user-provided',
    sourcePreliminary: pdf.sourcePreliminary ?? 'preliminary',
    sourceUnavailable: pdf.sourceUnavailable ?? 'unavailable',
    assumptionsTitle: pdf.assumptionsTitle ?? 'Main assumptions and limitations',
    assumptionSolarTitle: pdf.assumptionSolarTitle ?? 'Solar model',
    assumptionSolarText: pdf.assumptionSolarText ?? '',
    assumptionRoofTitle: pdf.assumptionRoofTitle ?? 'Roof and installation',
    assumptionRoofText: pdf.assumptionRoofText ?? '',
    assumptionFinanceTitle: pdf.assumptionFinanceTitle ?? 'Finance',
    assumptionFinanceText: pdf.assumptionFinanceText ?? '',
    assumptionEngineeringTitle: pdf.assumptionEngineeringTitle ?? 'Engineering review',
    assumptionEngineeringText: pdf.assumptionEngineeringText ?? '',
    inputModes: pdf.inputModes ?? { bill: 'Average bill', usage: 'Average consumption', monthly: 'Monthly profile', upload: 'Attached bill' },
    unavailable: pdf.unavailable ?? 'Unavailable',
    years: pdf.years ?? 'years',
    kwhPerYear: pdf.kwhPerYear ?? 'kWh/year',
    yieldPerYear: pdf.yieldPerYear ?? 'kWh/kWp/year',
    amdPerYear: pdf.amdPerYear ?? 'AMD/year',
    modulesWord: pdf.modulesWord ?? 'modules',
    footer: pdf.footer ?? '',
    months: product.passport?.months ?? []
  };
};

const pageHeader = ({ title, subtitle }) => `<div class="pdf-page-heading"><h1 class="pdf-page-title">${escapeHtml(title)}</h1><p class="pdf-page-subtitle">${escapeHtml(subtitle)}</p></div>`;

const pageOne = ({ copy, passport, locale, values }) => {
  const {
    capacityKwp,
    panelCount,
    panelWatts,
    annualGeneration,
    coverage,
    annualSavings,
    remainingGridDemand,
    co2,
    coordinates,
    annualConsumption,
    roofArea,
    roofOrientation,
    roofTilt,
    referenceYield,
    usableArea,
    mounting
  } = values;
  const summaryWidth = 515.28;
  const metricWidth = 165.76;
  return reportPage({
    page: 1,
    copy,
    reportId: passport?.id,
    content: `
      <div style="position:absolute;top:42pt;right:40pt">${statusBadge(copy.preliminary)}</div>
      <div style="position:absolute;top:75pt;left:420.3pt;width:135pt;height:100pt;border-radius:18pt;background:#EAF4FF">
        <div style="position:absolute;left:13pt;bottom:15pt;display:grid;grid-template-columns:repeat(5,18pt);grid-template-rows:repeat(3,16pt);gap:6pt 4pt">
          ${Array.from({ length: 15 }, () => '<span style="display:block;width:18pt;height:16pt;border:1pt solid #3B8EF3;background:#FFFFFF"></span>').join('')}
        </div>
        <span style="position:absolute;top:0;right:16pt;width:32pt;height:32pt;border-radius:50%;background:#F5B82E"></span>
      </div>
      <h1 style="position:absolute;top:91pt;left:40pt;width:360pt;margin:0;color:#0E2F57;font-size:25pt;font-weight:700;line-height:1.12;letter-spacing:-.025em">${escapeHtml(copy.title)}</h1>
      <p style="position:absolute;top:184pt;left:40pt;width:370pt;margin:0;color:#65798E;font-size:10pt;line-height:1.42">${escapeHtml(copy.subtitle)}</p>
      <div style="position:absolute;top:238pt;left:40pt;width:515.28pt;display:flex;justify-content:space-between;gap:16pt;color:#65798E;font-size:7.6pt">
        <span>${escapeHtml(`${copy.generated}: ${displayDate(passport?.createdAt, locale)}`)}</span>
        ${passport?.id ? `<span style="text-align:right">${escapeHtml(`${copy.reportId}: ${passport.id}`)}</span>` : ''}
      </div>
      <section style="position:absolute;top:268pt;left:40pt;width:${summaryWidth}pt;height:112pt;border-radius:12pt;background:#0E2F57;color:#FFFFFF">
        <div style="position:absolute;top:27pt;left:18pt;width:210pt">
          <div style="color:#BFD8F4;font-size:9.2pt;font-weight:700">${escapeHtml(copy.recommendedSystem)}</div>
          <div style="margin-top:8pt;color:#FFFFFF;font-size:27pt;font-weight:700;line-height:1">${escapeHtml(`${displayNumber(capacityKwp, locale, { maximumFractionDigits: 1 })} kWp`)}</div>
          <div style="margin-top:9pt;color:#FFFFFF;font-size:9.7pt;font-weight:700">${escapeHtml(`${displayNumber(panelCount, locale)} × ${displayNumber(panelWatts, locale)} W ${copy.solarModule.toLowerCase()}`)}</div>
        </div>
        <div style="position:absolute;top:22pt;left:260pt;width:240pt;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:34pt 34pt;gap:12pt 18pt">
          <div><div style="color:#BFD8F4;font-size:7.8pt;line-height:1.18">${escapeHtml(copy.annualProduction)}</div><div style="margin-top:4pt;font-size:15.5pt;font-weight:700;white-space:nowrap">${escapeHtml(`${displayNumber(annualGeneration, locale)} kWh`)}</div></div>
          <div><div style="color:#BFD8F4;font-size:7.8pt;line-height:1.18">${escapeHtml(copy.annualCoverage)}</div><div style="margin-top:4pt;font-size:15.5pt;font-weight:700">${escapeHtml(`${displayNumber(coverage, locale)}%`)}</div></div>
          <div><div style="color:#BFD8F4;font-size:7.8pt;line-height:1.18">${escapeHtml(copy.annualSavings)}</div><div style="margin-top:4pt;font-size:13.5pt;font-weight:700;white-space:nowrap">${escapeHtml(`${displayNumber(annualSavings, locale)} AMD`)}</div></div>
          <div><div style="color:#BFD8F4;font-size:7.8pt;line-height:1.18">${escapeHtml(copy.remainingGridDemand)}</div><div style="margin-top:4pt;font-size:13.5pt;font-weight:700;white-space:nowrap">${escapeHtml(`${displayNumber(remainingGridDemand, locale)} kWh`)}</div></div>
        </div>
      </section>
      ${metricCard({ x: 40, top: 396, width: metricWidth, label: copy.annualProduction, value: `${displayNumber(annualGeneration, locale)} kWh`, accent: '#1F7AE0' })}
      ${metricCard({ x: 214.76, top: 396, width: metricWidth, label: copy.annualCoverage, value: `${displayNumber(coverage, locale)}%`, accent: '#1F8F6A' })}
      ${metricCard({ x: 389.52, top: 396, width: metricWidth, label: copy.co2, value: `${displayNumber(co2, locale, { maximumFractionDigits: 2 })} t`, unit: copy.perYear, accent: '#F5B82E' })}
      <section class="pdf-card" style="position:absolute;top:506pt;left:40pt;width:515.28pt;height:190pt;padding:18pt 16pt">
        <h2 style="margin:0;color:#0E2F57;font-size:13pt;font-weight:700">${escapeHtml(copy.projectSummary)}</h2>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24pt 20pt;margin-top:23pt">
          ${[
            [copy.property, coordinates],
            [copy.consumption, `${displayNumber(annualConsumption, locale)} ${copy.kwhPerYear}`],
            [copy.roof, `${displayNumber(roofArea, locale, { maximumFractionDigits: 1 })} m² · ${displayNumber(roofOrientation, locale, { maximumFractionDigits: 0 })}° · ${displayNumber(roofTilt, locale, { maximumFractionDigits: 0 })}°`],
            [copy.pvgisReferenceYield, `${displayNumber(referenceYield, locale)} ${copy.yieldPerYear}`],
            [copy.usableArea, `${displayNumber(usableArea, locale, { maximumFractionDigits: 1 })} m²`],
            [copy.mounting, mounting]
          ]
            .map(
              ([label, value]) => `<div style="min-width:0"><div style="color:#65798E;font-size:8pt;font-weight:700">${escapeHtml(label)}</div><div style="margin-top:7pt;color:#17324D;font-size:9.6pt;font-weight:700;line-height:1.25;overflow-wrap:anywhere">${escapeHtml(value)}</div></div>`
            )
            .join('')}
        </div>
      </section>
      <p style="position:absolute;top:746pt;left:40pt;width:515.28pt;margin:0;color:#65798E;font-size:7.4pt;line-height:1.35">${escapeHtml(copy.disclaimer)}</p>
    `
  });
};

const pageTwo = ({ copy, passport, locale, values, equipment }) => {
  const {
    capacityKwp,
    panelCount,
    panelWatts,
    roofArea,
    usableArea,
    physicalModuleLimit,
    physicalCapacity,
    annualConsumption,
    annualGeneration,
    coverage,
    remainingGridDemand,
    referenceYield,
    roofYield,
    roofLimited
  } = values;
  const energyMax = Math.max(annualConsumption ?? 0, annualGeneration ?? 0, 1) * 1.08;
  const consumptionWidth = Math.max(0, Math.min(100, ((annualConsumption ?? 0) / energyMax) * 100));
  const generationWidth = Math.max(0, Math.min(100, ((annualGeneration ?? 0) / energyMax) * 100));
  const yieldMax = Math.max(200, Math.ceil(Math.max(referenceYield ?? 0, roofYield ?? 0, 1) / 200) * 200);
  return reportPage({
    page: 2,
    copy,
    reportId: passport?.id,
    content: `
      ${pageHeader({ title: copy.page2Title, subtitle: copy.page2Subtitle })}
      <section class="pdf-card" style="position:absolute;top:125pt;left:40pt;width:515.28pt;height:160pt;padding:23pt 16pt">
        <h2 style="margin:0;color:#0E2F57;font-size:13pt">${escapeHtml(copy.recommendedSystem)}</h2>
        <div style="position:absolute;top:56pt;left:16pt;width:165pt;color:#0E2F57;font-size:24pt;font-weight:700">${escapeHtml(`${displayNumber(capacityKwp, locale, { maximumFractionDigits: 1 })} kWp`)}</div>
        <div style="position:absolute;top:93pt;left:16pt;width:165pt;color:#17324D;font-size:9.4pt;font-weight:700">${escapeHtml(`${displayNumber(panelCount, locale)} × ${displayNumber(panelWatts, locale)} W ${copy.modulesWord}`)}</div>
        <div style="position:absolute;top:53pt;left:205pt;width:205pt">
          <div style="color:#65798E;font-size:8pt;font-weight:700">${escapeHtml(copy.solarModule)}</div>
          <div style="margin-top:5pt;color:#17324D;font-size:9.2pt;font-weight:700;line-height:1.25">${escapeHtml(equipment.module)}</div>
          <div style="margin-top:15pt;color:#65798E;font-size:8pt;font-weight:700">${escapeHtml(copy.inverter)}</div>
          <div style="margin-top:5pt;color:#17324D;font-size:9.2pt;font-weight:700;line-height:1.25">${escapeHtml(equipment.inverter)}</div>
        </div>
        <div style="position:absolute;top:18pt;right:14pt">${statusBadge(copy.preliminary)}</div>
        <div style="position:absolute;top:78pt;right:14pt;width:108pt;height:68pt;border-radius:9pt;background:#EAF4FF;padding:9pt 10pt">
          <div style="color:#0E2F57;font-size:8.5pt;font-weight:700">${escapeHtml(interpolate(copy.whyPanels, { count: displayNumber(panelCount, locale) }))}</div>
          <div style="margin-top:5pt;color:#65798E;font-size:7.1pt;line-height:1.24">${escapeHtml(copy.sizingExplanation)}</div>
        </div>
      </section>
      <section class="pdf-card" style="position:absolute;top:305pt;left:40pt;width:242pt;height:205pt;padding:18pt 16pt">
        <h2 style="margin:0 0 9pt;color:#0E2F57;font-size:12pt">${escapeHtml(copy.roofCapacityTitle)}</h2>
        ${dataRows([
          [copy.roofArea, `${displayNumber(roofArea, locale, { maximumFractionDigits: 1 })} m²`],
          [copy.usableArea, `${displayNumber(usableArea, locale, { maximumFractionDigits: 1 })} m²`],
          [copy.physicalModuleLimit, `${displayNumber(physicalModuleLimit, locale)} ${copy.modulesWord}`],
          [copy.physicalCapacity, `${displayNumber(physicalCapacity, locale, { maximumFractionDigits: 1 })} kWp`]
        ])}
        <div style="position:absolute;left:16pt;bottom:17pt;max-width:190pt;padding:5pt 10pt;border-radius:10pt;color:${roofLimited ? '#9A6A00' : '#1F8F6A'};background:${roofLimited ? '#FFF6D9' : '#EAF8F2'};font-size:7.2pt;font-weight:700">${escapeHtml(roofLimited ? copy.roofLimiting : copy.roofNotLimiting)}</div>
      </section>
      <section class="pdf-card" style="position:absolute;top:305pt;left:313pt;width:242.28pt;height:205pt;padding:18pt 16pt">
        <h2 style="margin:0;color:#0E2F57;font-size:12pt">${escapeHtml(copy.energyBalanceTitle)}</h2>
        <div style="margin-top:18pt">
          <div style="display:grid;grid-template-columns:76pt 1fr;gap:8pt;align-items:center"><span style="color:#65798E;font-size:8pt">${escapeHtml(copy.consumption)}</span><div><div style="display:flex;justify-content:flex-end;color:#17324D;font-size:8.2pt;font-weight:700">${escapeHtml(`${displayNumber(annualConsumption, locale)} kWh`)}</div><div class="bar-track" style="margin-top:4pt"><div class="bar-fill bar-fill--blue" style="width:${consumptionWidth.toFixed(2)}%"></div></div></div></div>
          <div style="display:grid;grid-template-columns:76pt 1fr;gap:8pt;align-items:center;margin-top:14pt"><span style="color:#65798E;font-size:8pt">${escapeHtml(copy.solarProduction)}</span><div><div style="display:flex;justify-content:flex-end;color:#17324D;font-size:8.2pt;font-weight:700">${escapeHtml(`${displayNumber(annualGeneration, locale)} kWh`)}</div><div class="bar-track" style="margin-top:4pt"><div class="bar-fill bar-fill--navy" style="width:${generationWidth.toFixed(2)}%"></div></div></div></div>
        </div>
        <div style="margin-top:18pt;color:#17324D;font-size:9.2pt;font-weight:700">${escapeHtml(interpolate(copy.coverageSentence, { value: displayNumber(coverage, locale) }))}</div>
        <div style="margin-top:10pt;color:#65798E;font-size:8.2pt;line-height:1.35">${escapeHtml(`${copy.remainingGridDemand}: ${displayNumber(remainingGridDemand, locale)} kWh`)}</div>
      </section>
      <section class="pdf-card" style="position:absolute;top:540pt;left:40pt;width:515.28pt;height:150pt;padding:17pt 14pt;background:#F5F8FC">
        <h2 style="margin:0;color:#0E2F57;font-size:10pt">${escapeHtml(copy.roofReferenceTitle)}</h2>
        ${comparisonBar({ label: copy.pvgisReferenceYield, value: referenceYield, max: yieldMax, tone: 'blue', unit: copy.yieldPerYear })}
        ${comparisonBar({ label: copy.roofSpecificYield, value: roofYield, max: yieldMax, tone: 'navy', unit: copy.yieldPerYear })}
        <p style="position:absolute;right:14pt;bottom:9pt;left:14pt;margin:0;color:#65798E;font-size:7.4pt;line-height:1.3">${escapeHtml(copy.roofYieldExplanation)}</p>
      </section>
    `
  });
};

const pageThree = ({ copy, passport, locale, values }) => {
  const {
    annualSavings,
    payback,
    savings25,
    budgetMin,
    budgetMid,
    budgetMax,
    monthlyGeneration,
    annualGeneration,
    monthlyReference,
    referenceYield
  } = values;
  const metricWidth = 166.43;
  return reportPage({
    page: 3,
    copy,
    reportId: passport?.id,
    content: `
      ${pageHeader({ title: copy.page3Title, subtitle: copy.page3Subtitle })}
      ${metricCard({ x: 40, top: 135, width: metricWidth, label: copy.annualSavings, value: `${displayNumber(annualSavings, locale)} AMD`, accent: '#1F8F6A' })}
      ${metricCard({ x: 214.43, top: 135, width: metricWidth, label: copy.payback, value: `${displayNumber(payback, locale, { maximumFractionDigits: 1 })} ${copy.years}`, accent: '#F5B82E' })}
      ${metricCard({ x: 388.86, top: 135, width: metricWidth, label: copy.twentyFiveYears, value: `${displayNumber(savings25, locale)} AMD`, accent: '#1F7AE0', valueSize: 14.2 })}
      <section class="pdf-card" style="position:absolute;top:261pt;left:40pt;width:515.28pt;height:84pt;padding:18pt 16pt;background:#F5F8FC">
        <div style="width:250pt">
          <div style="color:#0E2F57;font-size:10pt;font-weight:700">${escapeHtml(copy.budgetRange)}</div>
          <div style="margin-top:9pt;color:#0E2F57;font-size:18pt;font-weight:700">${escapeHtml(`${displayNumber(budgetMin, locale)} - ${displayNumber(budgetMax, locale)} AMD`)}</div>
        </div>
        <div style="position:absolute;top:18pt;right:16pt;width:210pt;color:#65798E;font-size:8.3pt;line-height:1.35">
          <div>${escapeHtml(interpolate(copy.centralEstimate, { value: `${displayNumber(budgetMid, locale)} AMD` }))}</div>
          <div style="margin-top:8pt;font-size:7.3pt">${escapeHtml(copy.budgetDisclaimer)}</div>
        </div>
      </section>
      <section class="pdf-card" style="position:absolute;top:375pt;left:40pt;width:515.28pt;height:190pt;padding:17pt 16pt">
        <h2 style="margin:0;color:#0E2F57;font-size:9.5pt">${escapeHtml(copy.monthlyProductionTitle)}</h2>
        ${monthlyBarChart({ values: monthlyGeneration, months: copy.months, unit: 'kWh', kind: 'production' })}
        <p style="position:absolute;left:16pt;bottom:8pt;margin:0;color:#65798E;font-size:7.4pt">${escapeHtml(interpolate(copy.monthlyProductionNote, { value: displayNumber(annualGeneration, locale) }))}</p>
      </section>
      <section class="pdf-card" style="position:absolute;top:600pt;left:40pt;width:515.28pt;height:175pt;padding:17pt 16pt">
        <h2 style="margin:0;color:#0E2F57;font-size:10pt">${escapeHtml(copy.pvgisMonthlyTitle)}</h2>
        ${monthlyBarChart({ values: monthlyReference, months: copy.months, unit: 'kWh/kWp', kind: 'pvgis' })}
        <p style="position:absolute;left:16pt;bottom:8pt;width:465pt;margin:0;color:#65798E;font-size:7.2pt;line-height:1.25">${escapeHtml(interpolate(copy.pvgisMonthlyNote, { value: displayNumber(referenceYield, locale) }))}</p>
      </section>
    `
  });
};

const pageFour = ({ copy, passport, locale, values, equipment }) => {
  const {
    coordinates,
    annualConsumption,
    inputMode,
    tariffRate,
    storageRequested,
    roofArea,
    roofOrientation,
    roofTilt,
    mounting,
    referenceYield,
    referenceAzimuth,
    referenceTilt,
    roofYield,
    usableArea,
    physicalModuleLimit,
    physicalCapacity,
    hasPvgis,
    hasTariff,
    hasEquipment,
    hasPricebook
  } = values;
  const modeLabel = safeText(copy.inputModes?.[inputMode]) ?? copy.unavailable;
  const sourceItems = [
    sourceStatus({ label: copy.sourcePvgis, status: hasPvgis ? copy.sourceConfirmed : copy.sourceUnavailable, color: hasPvgis ? '#1F8F6A' : '#65798E' }),
    sourceStatus({ label: copy.sourceTariff, status: hasTariff ? copy.sourceUserProvided : copy.sourceUnavailable, color: hasTariff ? '#1F7AE0' : '#65798E' }),
    sourceStatus({ label: copy.sourceEquipment, status: hasEquipment ? copy.sourceConfirmed : copy.sourceUnavailable, color: hasEquipment ? '#1F8F6A' : '#65798E' }),
    sourceStatus({ label: copy.sourcePricebook, status: hasPricebook ? copy.sourcePreliminary : copy.sourceUnavailable, color: hasPricebook ? '#F5B82E' : '#65798E' })
  ].join('');
  return reportPage({
    page: 4,
    copy,
    reportId: passport?.id,
    content: `
      ${pageHeader({ title: copy.page4Title, subtitle: copy.page4Subtitle })}
      <section class="pdf-card" style="position:absolute;top:125pt;left:40pt;width:252.64pt;height:260pt;padding:18pt 16pt">
        <h2 style="margin:0 0 8pt;color:#0E2F57;font-size:12pt">${escapeHtml(copy.inputsTitle)}</h2>
        ${dataRows([
          [copy.coordinates, coordinates],
          [copy.consumption, `${displayNumber(annualConsumption, locale)} kWh`],
          [copy.inputMethod, modeLabel],
          [copy.tariff, tariffRate === null ? copy.unavailable : `${displayNumber(tariffRate, locale, { maximumFractionDigits: 2 })} AMD/kWh`],
          [copy.storageRequest, storageRequested ? copy.yes : copy.no],
          [copy.roof, `${displayNumber(roofArea, locale, { maximumFractionDigits: 1 })} m² · ${displayNumber(roofOrientation, locale, { maximumFractionDigits: 0 })}° · ${displayNumber(roofTilt, locale, { maximumFractionDigits: 0 })}°`],
          [copy.mounting, mounting]
        ])}
      </section>
      <section class="pdf-card" style="position:absolute;top:125pt;left:302.64pt;width:252.64pt;height:260pt;padding:18pt 16pt">
        <h2 style="margin:0 0 8pt;color:#0E2F57;font-size:12pt">${escapeHtml(copy.calculationBasisTitle)}</h2>
        ${dataRows([
          [copy.pvgisReferenceYield, `${displayNumber(referenceYield, locale)} ${copy.yieldPerYear}`],
          [copy.pvgisReferenceOrientation, `${displayNumber(referenceAzimuth, locale, { maximumFractionDigits: 0 })}° / ${displayNumber(referenceTilt, locale, { maximumFractionDigits: 0 })}°`],
          [copy.roofSpecificYield, `${displayNumber(roofYield, locale)} ${copy.yieldPerYear}`],
          [copy.usableArea, `${displayNumber(usableArea, locale, { maximumFractionDigits: 1 })} m²`],
          [copy.physicalModuleLimit, `${displayNumber(physicalModuleLimit, locale)} ${copy.modulesWord} / ${displayNumber(physicalCapacity, locale, { maximumFractionDigits: 1 })} kWp`],
          [copy.solarModule, equipment.module],
          [copy.inverter, equipment.inverter]
        ])}
      </section>
      <section class="pdf-card" style="position:absolute;top:367pt;left:40pt;width:515.28pt;height:88pt;padding:17pt 16pt;background:#F5F8FC">
        <h2 style="position:absolute;top:18pt;left:16pt;margin:0;color:#0E2F57;font-size:10pt">${escapeHtml(copy.sourcesTitle)}</h2>
        <div style="position:absolute;top:17pt;left:98pt;right:16pt;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14pt">${sourceItems}</div>
      </section>
      <h2 style="position:absolute;top:510pt;left:40pt;width:515.28pt;margin:0;color:#0E2F57;font-size:12pt">${escapeHtml(copy.assumptionsTitle)}</h2>
      ${assumptionCard({ x: 40, top: 569, title: copy.assumptionSolarTitle, body: copy.assumptionSolarText })}
      ${assumptionCard({ x: 302.64, top: 569, title: copy.assumptionRoofTitle, body: copy.assumptionRoofText })}
      ${assumptionCard({ x: 40, top: 696, title: copy.assumptionFinanceTitle, body: copy.assumptionFinanceText })}
      ${assumptionCard({ x: 302.64, top: 696, title: copy.assumptionEngineeringTitle, body: copy.assumptionEngineeringText })}
    `
  });
};

/**
 * Creates a four-page, self-contained A4 calculation report. The report stays
 * entirely client-side and contains no scripts or external assets.
 */
export const createCalculatorPdfReportHtml = ({
  analysis,
  passport,
  state,
  wizard,
  product,
  locale
}) => {
  const scenario = analysis?.selectedScenario;
  if (!analysis || !scenario) return null;

  const copy = createCopy({ wizard, product });
  const coordinatesObject = analysis.property?.coordinates;
  const roof = analysis.roof ?? state.roof ?? {};
  const consumption = analysis.consumption ?? state.consumption ?? {};
  const tariff = analysis.financial?.tariff ?? state.userTariff ?? {};
  const financial = scenario.financial ?? {};
  const estimate = scenario.commercialEstimate ?? analysis.commercialEstimate ?? {};
  const referencePotential = state.sitePotential ?? null;
  const annualConsumption =
    asNumber(scenario.energyBalance?.annualConsumptionKwh) ?? asNumber(consumption.annualKwh);
  const annualGeneration = asNumber(scenario.generation?.annualKwh);
  const remainingGridDemand = Math.max(0, (annualConsumption ?? 0) - (annualGeneration ?? 0));
  const roofCapacity = calculatePreliminaryRoofCapacity({
    roofAreaSqm: roof.areaSqm,
    usableAreaRatio: roof.usableAreaRatio,
    panelAreaSqm: scenario.system?.panelAreaSqm,
    panelWatts: scenario.system?.panelWatts
  });
  const equipment = equipmentDetails({ analysis, scenario, copy, locale });
  const roofLimited = Boolean(scenario.limitations?.includes?.('ROOF_CAPACITY_LIMIT'));
  const coordinates = coordinatesObject
    ? `${displayNumber(coordinatesObject.lat, locale, { maximumFractionDigits: 5 })}, ${displayNumber(coordinatesObject.lng, locale, { maximumFractionDigits: 5 })}`
    : copy.unavailable;
  const mounting =
    roof.mountingMode === 'elevated'
      ? (wizard.elevated ?? copy.unavailable)
      : (wizard.parallel ?? copy.unavailable);

  const values = {
    capacityKwp: asNumber(scenario.system?.capacityKwp),
    panelCount: asNumber(scenario.system?.panelCount),
    panelWatts: asNumber(scenario.system?.panelWatts),
    annualGeneration,
    annualConsumption,
    coverage: asNumber(scenario.coveragePercent),
    annualSavings: asNumber(financial.annualSavingsAmd),
    remainingGridDemand,
    co2: asNumber(analysis.environmental?.avoidedCo2Tons),
    coordinates,
    inputMode: consumption.mode ?? state.consumption?.mode ?? null,
    tariffRate: asNumber(tariff.rateAmdPerKwh),
    storageRequested: Boolean(state.storageRequired),
    roofArea: asNumber(roof.areaSqm),
    roofOrientation: asNumber(roof.orientationDegrees),
    roofTilt: asNumber(roof.tiltDegrees),
    usableArea: asNumber(roofCapacity?.usableRoofAreaSqm),
    physicalModuleLimit: asNumber(roofCapacity?.maximumPanelCount),
    physicalCapacity: asNumber(roofCapacity?.maximumCapacityKwp),
    mounting,
    roofLimited,
    referenceYield: asNumber(referencePotential?.annualYieldKwhPerKwp),
    referenceAzimuth: asNumber(referencePotential?.orientation?.azimuthDegrees),
    referenceTilt: asNumber(referencePotential?.orientation?.tiltDegrees),
    roofYield: asNumber(analysis.production?.annualYieldKwhPerKwp),
    payback: asNumber(financial.paybackYears),
    savings25: asNumber(financial.grossSavings25YearsAmd),
    budgetMin: asNumber(estimate.rangeAmd?.p25),
    budgetMid: asNumber(estimate.primaryAmd),
    budgetMax: asNumber(estimate.rangeAmd?.p75),
    monthlyGeneration: scenario.generation?.monthlyKwh ?? [],
    monthlyReference: referencePotential?.monthlyYieldKwhPerKwp ?? [],
    hasPvgis: Boolean(referencePotential?.annualYieldKwhPerKwp),
    hasTariff: asNumber(tariff.rateAmdPerKwh) !== null,
    hasEquipment: equipment.module !== copy.unavailable || equipment.inverter !== copy.unavailable,
    hasPricebook: Boolean(estimate.available || asNumber(estimate.primaryAmd) !== null)
  };

  const titleSlug = new Date().toISOString().slice(0, 10);
  const pages = [
    pageOne({ copy, passport, locale, values }),
    pageTwo({ copy, passport, locale, values, equipment }),
    pageThree({ copy, passport, locale, values }),
    pageFour({ copy, passport, locale, values, equipment })
  ].join('');

  return `<!doctype html>
<html lang="${escapeHtml(locale)}"><head><meta charset="utf-8"><meta name="color-scheme" content="light"><title>yourenergy-solar-report-${titleSlug}</title><style>${reportStyles}</style></head>
<body><main class="pdf-report">${pages}</main></body></html>`;
};

export const openCalculatorPdfReport = (options) => {
  const reportHtml = createCalculatorPdfReportHtml(options);
  if (!reportHtml || typeof window === 'undefined') return false;
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) return false;
  try {
    reportWindow.opener = null;
  } catch {
    // Some embedded browser contexts make opener read-only. The report still
    // contains only locally generated markup and has no external navigation.
  }
  reportWindow.document.open();
  reportWindow.document.write(reportHtml);
  reportWindow.document.close();
  reportWindow.focus();
  window.setTimeout(() => reportWindow.print(), 200);
  return true;
};
