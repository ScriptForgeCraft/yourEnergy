import { calculatePreliminaryRoofCapacity } from '../../domain/roof-capacity.js';

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
  const numeric = asNumber(value);
  return numeric === null
    ? '—'
    : new Intl.NumberFormat(locale, { maximumFractionDigits }).format(numeric);
};

const displayDate = (value, locale) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const reportRow = ([label, value]) =>
  `<div class="report-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;

const reportSection = ({ title, rows, className = '' }) => {
  const populatedRows = rows.filter(
    ([, value]) => value !== null && value !== undefined && value !== ''
  );
  if (!populatedRows.length) return '';
  return `<section class="report-section ${className}"><h2>${escapeHtml(title)}</h2><dl>${populatedRows.map(reportRow).join('')}</dl></section>`;
};

const monthlyChart = ({ values, months, locale, title, unit }) => {
  const numericValues = values.map(asNumber);
  if (!numericValues.some((value) => value !== null && value > 0)) return '';
  const maximum = Math.max(...numericValues.map((value) => value ?? 0), 1);
  const width = 720;
  const chartHeight = 174;
  const baseline = 206;
  const gap = 8;
  const barWidth = (width - gap * (numericValues.length - 1)) / numericValues.length;
  const bars = numericValues
    .map((value, index) => {
      const height = ((value ?? 0) / maximum) * chartHeight;
      const x = index * (barWidth + gap);
      const label = months[index]?.short ?? String(index + 1);
      const formatted = displayNumber(value, locale);
      return `<g>
        <rect x="${x}" y="${baseline - height}" width="${barWidth}" height="${height}" rx="4" fill="#1686ed" />
        <text x="${x + barWidth / 2}" y="${baseline + 17}" text-anchor="middle">${escapeHtml(label)}</text>
        <title>${escapeHtml(`${label}: ${formatted} ${unit}`)}</title>
      </g>`;
    })
    .join('');
  return `<section class="report-section report-chart">
    <h2>${escapeHtml(title)}</h2>
    <svg viewBox="0 0 ${width} 234" role="img" aria-label="${escapeHtml(title)}">
      <line x1="0" y1="${baseline}" x2="${width}" y2="${baseline}" stroke="#c9d8e6" stroke-width="1" />
      ${bars}
    </svg>
    <p class="chart-note">${escapeHtml(unit)}</p>
  </section>`;
};

const financialChart = ({ timeline, locale, title, unit }) => {
  const points = timeline
    .map((entry) => ({ year: asNumber(entry?.year), value: asNumber(entry?.netAmd) }))
    .filter((entry) => entry.year !== null && entry.value !== null);
  if (points.length < 2) return '';
  const width = 720;
  const height = 230;
  const padding = { top: 18, right: 10, bottom: 38, left: 12 };
  const minValue = Math.min(...points.map((point) => point.value), 0);
  const maxValue = Math.max(...points.map((point) => point.value), 0);
  const range = maxValue - minValue || 1;
  const maxYear = Math.max(...points.map((point) => point.year), 1);
  const x = (year) => padding.left + (year / maxYear) * (width - padding.left - padding.right);
  const y = (value) =>
    padding.top + ((maxValue - value) / range) * (height - padding.top - padding.bottom);
  const line = points.map((point) => `${x(point.year)},${y(point.value)}`).join(' ');
  const zeroY = y(0);
  const labels = points
    .map(
      (point) => `<g>
        <circle cx="${x(point.year)}" cy="${y(point.value)}" r="4" fill="#0d7ce8" />
        <text x="${x(point.year)}" y="${height - 12}" text-anchor="middle">${escapeHtml(point.year)}</text>
        <title>${escapeHtml(`${point.year}: ${displayNumber(point.value, locale)} ${unit}`)}</title>
      </g>`
    )
    .join('');
  return `<section class="report-section report-chart">
    <h2>${escapeHtml(title)}</h2>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)}">
      <line x1="${padding.left}" y1="${zeroY}" x2="${width - padding.right}" y2="${zeroY}" stroke="#c9d8e6" stroke-width="1" />
      <polyline points="${line}" fill="none" stroke="#0d7ce8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      ${labels}
    </svg>
    <p class="chart-note">${escapeHtml(unit)}</p>
  </section>`;
};

const sourceRows = ({ analysis, copy }) =>
  (analysis.sourceLedger ?? []).map((entry) => {
    const source = entry?.source ?? {};
    const details = [source.provider, source.status, entry.reason].filter(Boolean).join(' · ');
    return [copy.sources?.[entry?.key] ?? entry?.key ?? '—', details || copy.unavailable];
  });

const equipmentRows = ({ analysis, scenario, copy, locale }) => {
  const recommendation = analysis.equipmentRecommendation ?? {};
  const module = recommendation.solarModule ?? analysis.equipment ?? scenario.system?.equipment;
  const inverter = recommendation.inverter ?? analysis.inverterRecommendation;
  const mounting = recommendation.mounting ?? analysis.mountingHardwareRecommendation;
  const storage = recommendation.storage ?? analysis.storageRecommendation;
  const rows = [];
  if (module?.panelBrand || module?.brand) {
    const name = [
      module.panelBrand ?? module.brand,
      module.panelModel ?? module.model ?? module.productName
    ]
      .filter(Boolean)
      .join(' ');
    rows.push([
      copy.module,
      `${name} · ${displayNumber(scenario.system?.panelCount ?? module.quantity, locale)} × ${displayNumber(scenario.system?.panelWatts ?? module.watts, locale)} W`
    ]);
  }
  if (inverter?.brand || inverter?.productName) {
    rows.push([
      copy.inverter,
      `${[inverter.brand, inverter.productName ?? inverter.model].filter(Boolean).join(' ')} · ${displayNumber(inverter.selectedAcPowerKw, locale, { maximumFractionDigits: 1 })} kW`
    ]);
  }
  if (mounting?.brand || mounting?.productName) {
    rows.push([
      copy.mounting,
      `${[mounting.brand, mounting.productName ?? mounting.model].filter(Boolean).join(' ')}${asNumber(mounting.practicalInclinationDeg) === null ? '' : ` · ${displayNumber(mounting.practicalInclinationDeg, locale, { maximumFractionDigits: 1 })}°`}`
    ]);
  }
  if (storage?.status === 'sized' && (storage.brand || storage.productName)) {
    rows.push([
      copy.storage,
      `${[storage.brand, storage.productName ?? storage.model].filter(Boolean).join(' ')} · ${displayNumber(storage.selectedUsableCapacityKwh, locale, { maximumFractionDigits: 2 })} kWh`
    ]);
  }
  return rows;
};

const reportStyles = `
  @page { size: A4; margin: 13mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #10284a; background: #ffffff; font-family: Inter, "Segoe UI", Arial, sans-serif; font-size: 10.5pt; line-height: 1.42; }
  .report { max-width: 190mm; margin: 0 auto; }
  .report-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; min-height: 130px; padding: 25px 28px; border-radius: 16px; color: #fff; background: linear-gradient(135deg, #071d39 0%, #0d4c83 64%, #1586e9 100%); }
  .brand { margin: 0 0 9px; color: #a9d9ff; font-size: 9pt; font-weight: 800; letter-spacing: .14em; }
  h1 { margin: 0; font-size: 25pt; letter-spacing: -.035em; line-height: 1.06; }
  .report-header p { max-width: 530px; margin: 11px 0 0; color: #e1f2ff; }
  .status { flex: 0 0 auto; margin: 0; border-radius: 99px; padding: 7px 10px; color: #6b4a00; background: #ffcf37; font-size: 8pt; font-weight: 800; letter-spacing: .07em; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 14px 2px 4px; color: #5b7190; font-size: 8.5pt; }
  .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 18px 0; }
  .metric { min-height: 92px; border: 1px solid #d9e6f1; border-radius: 11px; padding: 13px; background: linear-gradient(145deg, #f8fcff, #edf7fe); }
  .metric strong { display: block; margin: 4px 0 5px; color: #102a4f; font-size: 16pt; line-height: 1.1; }
  .metric span { color: #55708f; font-size: 8.5pt; }
  .report-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .report-section { break-inside: avoid; margin: 0 0 14px; border: 1px solid #dbe7f1; border-radius: 11px; padding: 15px 16px; background: #fff; }
  .report-section--wide { grid-column: 1 / -1; }
  .report-section h2 { margin: 0 0 10px; color: #123056; font-size: 12pt; }
  dl { margin: 0; }
  .report-row { display: grid; grid-template-columns: minmax(105px, .9fr) minmax(0, 1.3fr); gap: 12px; padding: 7px 0; border-top: 1px solid #edf2f7; }
  .report-row:first-child { border-top: 0; padding-top: 0; }
  .report-row:last-child { padding-bottom: 0; }
  dt { color: #607a98; font-size: 8.8pt; }
  dd { margin: 0; color: #193757; font-weight: 700; overflow-wrap: anywhere; }
  .report-chart svg { display: block; width: 100%; height: auto; overflow: visible; }
  .report-chart text { fill: #5b7491; font-family: Inter, "Segoe UI", Arial, sans-serif; font-size: 14px; }
  .chart-note { margin: 4px 0 0; color: #69819d; font-size: 8pt; }
  .notes { margin: 0; padding-left: 18px; color: #45627e; }
  .notes li + li { margin-top: 4px; }
  .report-footer { margin-top: 18px; border-top: 1px solid #dbe7f1; padding: 11px 2px 0; color: #6c8098; font-size: 8pt; }
  @media print { .report { max-width: none; } }
  @media screen and (max-width: 680px) { .metric-grid, .report-layout { grid-template-columns: 1fr 1fr; } .report-section--wide { grid-column: auto; } }
`;

/**
 * Opens an isolated print view so the browser can save the calculation as a
 * PDF without uploading a visitor's inputs or adding a server-side document.
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

  const copy = {
    title: wizard.pdfReport?.title ?? wizard.passportTitle ?? 'Solar report',
    subtitle: wizard.pdfReport?.subtitle ?? wizard.passportCopy ?? '',
    preliminary: wizard.pdfReport?.preliminary ?? 'PRELIMINARY',
    generated: wizard.pdfReport?.generated ?? 'Generated',
    reportId: wizard.pdfReport?.reportId ?? 'Report ID',
    inputs: wizard.pdfReport?.inputs ?? 'Your inputs',
    results: wizard.pdfReport?.results ?? 'Calculation results',
    equipment: wizard.pdfReport?.equipment ?? 'Recommended equipment',
    finance: wizard.pdfReport?.finance ?? 'Financial estimate',
    sources: wizard.pdfReport?.sourcesTitle ?? 'Sources and assumptions',
    monthly: wizard.pdfReport?.monthly ?? wizard.production ?? 'Monthly generation',
    monthlyLocationReference:
      wizard.pdfReport?.monthlyLocationReference ?? 'Monthly PVGIS reference yield',
    cashflow: wizard.pdfReport?.cashflow ?? 'Financial outlook',
    limitations: wizard.pdfReport?.limitations ?? 'Assumptions and limitations',
    property: wizard.pdfReport?.property ?? wizard.steps?.[0] ?? 'Property',
    coordinates:
      wizard.pdfReport?.coordinates ?? wizard.calculationBasis?.coordinates ?? 'Coordinates',
    consumption: wizard.pdfReport?.consumption ?? wizard.annualConsumption ?? 'Annual consumption',
    inputMethod: wizard.pdfReport?.inputMethod ?? 'Consumption input method',
    monthlyConsumption: wizard.pdfReport?.monthlyConsumption ?? 'Monthly consumption profile',
    tariff: wizard.pdfReport?.tariff ?? wizard.metrics?.tariff ?? 'Tariff',
    storageRequest:
      wizard.pdfReport?.storageRequest ?? wizard.storageRequestLabel ?? 'Storage review',
    yes: wizard.pdfReport?.yes ?? 'Yes',
    no: wizard.pdfReport?.no ?? 'No',
    roof: wizard.pdfReport?.roof ?? wizard.steps?.[2] ?? 'Roof',
    mounting: wizard.pdfReport?.mounting ?? 'Mounting',
    usableArea: wizard.pdfReport?.usableArea ?? 'Usable module area',
    physicalModuleLimit: wizard.pdfReport?.physicalModuleLimit ?? 'Physical module limit',
    physicalCapacity: wizard.pdfReport?.physicalCapacity ?? 'Physical DC capacity limit',
    pvgisReferenceYield: wizard.pdfReport?.pvgisReferenceYield ?? 'PVGIS reference yield',
    pvgisReferenceOrientation:
      wizard.pdfReport?.pvgisReferenceOrientation ?? 'PVGIS reference orientation / tilt',
    capacity: wizard.pdfReport?.capacity ?? 'System capacity',
    panels: wizard.pdfReport?.panels ?? wizard.metrics?.panels ?? 'Panels',
    annualProduction:
      wizard.pdfReport?.annualProduction ?? wizard.metrics?.annualGeneration ?? 'Annual generation',
    coverage: wizard.pdfReport?.coverage ?? wizard.metrics?.coverage ?? 'Coverage',
    coveredConsumption:
      wizard.pdfReport?.coveredConsumption ?? wizard.coveredConsumption ?? 'Covered consumption',
    surplus: wizard.pdfReport?.surplus ?? wizard.surplusEnergy ?? 'Surplus generation',
    annualSavings:
      wizard.pdfReport?.annualSavings ?? wizard.metrics?.annualSavings ?? 'Annual savings',
    payback: wizard.pdfReport?.payback ?? wizard.metrics?.payback ?? 'Payback',
    budget: wizard.pdfReport?.budget ?? wizard.budget ?? 'Budget',
    module: wizard.pdfReport?.module ?? wizard.moduleRecommendationTitle ?? 'Solar module',
    inverter: wizard.pdfReport?.inverter ?? wizard.inverterRecommendationTitle ?? 'Inverter',
    storage: wizard.pdfReport?.storage ?? wizard.storageRecommendationTitle ?? 'Storage',
    unavailable: wizard.pdfReport?.unavailable ?? 'Unavailable',
    sourcesByKey: product.ledger?.sources ?? {},
    assumptionsByKey: product.ledger?.assumptions ?? {}
  };

  const coordinates = analysis.property?.coordinates;
  const roof = analysis.roof ?? state.roof ?? {};
  const consumption = analysis.consumption ?? state.consumption ?? {};
  const tariff = analysis.financial?.tariff ?? state.userTariff ?? {};
  const financial = scenario.financial ?? {};
  const estimate = scenario.commercialEstimate ?? analysis.commercialEstimate ?? {};
  const referencePotential = state.sitePotential ?? null;
  const roofCapacity = calculatePreliminaryRoofCapacity({
    roofAreaSqm: roof.areaSqm,
    usableAreaRatio: roof.usableAreaRatio,
    panelAreaSqm: scenario.system?.panelAreaSqm,
    panelWatts: scenario.system?.panelWatts
  });
  const sourceCopy = { sources: copy.sourcesByKey, unavailable: copy.unavailable };
  const inputRows = [
    [copy.property, state.addressNote || null],
    [
      copy.coordinates,
      coordinates
        ? `${displayNumber(coordinates.lat, locale, { maximumFractionDigits: 5 })}, ${displayNumber(coordinates.lng, locale, { maximumFractionDigits: 5 })}`
        : null
    ],
    [copy.consumption, `${displayNumber(consumption.annualKwh, locale)} kWh`],
    [copy.inputMethod, consumption.mode ?? state.consumption?.mode ?? null],
    [
      copy.monthlyConsumption,
      Array.isArray(consumption.monthlyKwh)
        ? consumption.monthlyKwh.map((value) => displayNumber(value, locale)).join(' · ')
        : null
    ],
    [
      copy.tariff,
      asNumber(tariff.rateAmdPerKwh) === null
        ? null
        : `${displayNumber(tariff.rateAmdPerKwh, locale, { maximumFractionDigits: 2 })} AMD/kWh`
    ],
    [copy.storageRequest, state.storageRequired ? copy.yes : copy.no],
    [
      copy.pvgisReferenceYield,
      referencePotential
        ? `${displayNumber(referencePotential.annualYieldKwhPerKwp, locale)} kWh/kWp/year`
        : null
    ],
    [
      copy.pvgisReferenceOrientation,
      referencePotential
        ? `${displayNumber(referencePotential.orientation?.azimuthDegrees, locale, { maximumFractionDigits: 1 })}° / ${displayNumber(referencePotential.orientation?.tiltDegrees, locale, { maximumFractionDigits: 1 })}°`
        : null
    ],
    [
      copy.roof,
      `${displayNumber(roof.areaSqm, locale, { maximumFractionDigits: 1 })} m² · ${displayNumber(roof.orientationDegrees, locale, { maximumFractionDigits: 1 })}° · ${displayNumber(roof.tiltDegrees, locale, { maximumFractionDigits: 1 })}°`
    ],
    [
      copy.mounting,
      roof.mountingMode === 'elevated'
        ? (wizard.elevated ?? 'Elevated')
        : (wizard.parallel ?? 'Roof parallel')
    ],
    [
      copy.usableArea,
      roofCapacity
        ? `${displayNumber(roofCapacity.usableRoofAreaSqm, locale, { maximumFractionDigits: 1 })} m²`
        : null
    ],
    [
      copy.physicalModuleLimit,
      roofCapacity ? `${displayNumber(roofCapacity.maximumPanelCount, locale)} modules` : null
    ],
    [
      copy.physicalCapacity,
      roofCapacity
        ? `${displayNumber(roofCapacity.maximumCapacityKwp, locale, { maximumFractionDigits: 2 })} kWp`
        : null
    ]
  ];
  const resultRows = [
    [
      copy.capacity,
      `${displayNumber(scenario.system?.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp`
    ],
    [
      copy.panels,
      `${displayNumber(scenario.system?.panelCount, locale)} × ${displayNumber(scenario.system?.panelWatts, locale)} W`
    ],
    [copy.annualProduction, `${displayNumber(scenario.generation?.annualKwh, locale)} kWh`],
    [
      copy.coverage,
      `${displayNumber(scenario.coveragePercent, locale, { maximumFractionDigits: 0 })}%`
    ],
    [
      copy.coveredConsumption,
      `${displayNumber(scenario.energyBalance?.offsetEnergyKwh, locale)} kWh`
    ],
    [copy.surplus, `${displayNumber(scenario.energyBalance?.surplusEnergyKwh, locale)} kWh`],
    [
      wizard.remainingGridDemand ?? 'Remaining annual grid demand',
      `${displayNumber(
        Math.max(
          0,
          Number(scenario.energyBalance?.annualConsumptionKwh ?? 0) -
            Number(scenario.energyBalance?.annualGenerationKwh ?? 0)
        ),
        locale
      )} kWh`
    ]
  ];
  const financeRows = [
    [copy.annualSavings, `${displayNumber(financial.annualSavingsAmd, locale)} AMD`],
    [
      copy.payback,
      `${displayNumber(financial.paybackYears, locale, { maximumFractionDigits: 1 })} ${wizard.pdfReport?.years ?? 'years'}`
    ],
    [
      copy.budget,
      estimate.available
        ? `${displayNumber(estimate.rangeAmd?.p25, locale)} - ${displayNumber(estimate.primaryAmd, locale)} - ${displayNumber(estimate.rangeAmd?.p75, locale)} AMD`
        : null
    ],
    [
      wizard.pdfReport?.twentyFiveYears ?? '25 years',
      `${displayNumber(financial.grossSavings25YearsAmd, locale)} AMD`
    ]
  ];
  const metricCards = [
    [copy.annualProduction, `${displayNumber(scenario.generation?.annualKwh, locale)} kWh`],
    [
      copy.coverage,
      `${displayNumber(scenario.coveragePercent, locale, { maximumFractionDigits: 0 })}%`
    ],
    [copy.annualSavings, `${displayNumber(financial.annualSavingsAmd, locale)} AMD`],
    [
      wizard.pdfReport?.co2 ?? wizard.environmental?.co2 ?? 'CO₂',
      `${displayNumber(analysis.environmental?.avoidedCo2Tons, locale, { maximumFractionDigits: 1 })} t`
    ]
  ];
  const notes = [...(analysis.assumptions ?? []), ...(analysis.limitations ?? [])]
    .map((note) => copy.assumptionsByKey[note] ?? note)
    .filter(Boolean);
  const metricsHtml = metricCards
    .map(
      ([label, value]) =>
        `<article class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`
    )
    .join('');
  const titleSlug = new Date().toISOString().slice(0, 10);
  return `<!doctype html>
<html lang="${escapeHtml(locale)}"><head><meta charset="utf-8"><title>yourenergy-solar-report-${titleSlug}</title><style>${reportStyles}</style></head>
<body><main class="report">
  <header class="report-header"><div><p class="brand">YOURENERGY</p><h1>${escapeHtml(copy.title)}</h1><p>${escapeHtml(copy.subtitle)}</p></div><p class="status">${escapeHtml(copy.preliminary)}</p></header>
  <div class="meta"><span>${escapeHtml(copy.generated)}: ${escapeHtml(displayDate(passport?.createdAt, locale))}</span>${passport?.id ? `<span>${escapeHtml(copy.reportId)}: ${escapeHtml(passport.id)}</span>` : ''}</div>
  <section class="metric-grid">${metricsHtml}</section>
  <div class="report-layout">
    ${reportSection({ title: copy.inputs, rows: inputRows })}
    ${reportSection({ title: copy.results, rows: resultRows })}
    ${reportSection({ title: copy.equipment, rows: equipmentRows({ analysis, scenario, copy, locale }) })}
    ${reportSection({ title: copy.finance, rows: financeRows })}
    ${monthlyChart({ values: referencePotential?.monthlyYieldKwhPerKwp ?? [], months: product.passport?.months ?? [], locale, title: copy.monthlyLocationReference, unit: 'kWh/kWp' })}
    ${monthlyChart({ values: scenario.generation?.monthlyKwh ?? [], months: product.passport?.months ?? [], locale, title: copy.monthly, unit: 'kWh' })}
    ${financialChart({ timeline: financial.timeline ?? [], locale, title: copy.cashflow, unit: 'AMD' })}
    ${reportSection({ title: copy.sources, rows: sourceRows({ analysis, copy: sourceCopy }), className: 'report-section--wide' })}
    ${notes.length ? `<section class="report-section report-section--wide"><h2>${escapeHtml(copy.limitations)}</h2><ul class="notes">${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul></section>` : ''}
  </div>
  <footer class="report-footer">${escapeHtml(wizard.pdfReport?.footer ?? wizard.equipmentPreliminaryCopy ?? '')}</footer>
</main></body></html>`;
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
