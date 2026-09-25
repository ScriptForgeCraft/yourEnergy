import { calculatePreliminaryRoofCapacity } from '../../domain/roof-capacity.js';
import { number, format, text, element, localeCode } from './view-helpers.js';

const inverterTechnology = (technology, wizard) =>
  technology === 'hybrid'
    ? (wizard.hybridInverter ?? 'Hybrid inverter')
    : (wizard.gridTiedInverter ?? 'Grid-tied inverter');

const inverterReason = (reason, wizard) =>
  reason === 'EXACT_CATALOG_AC_VARIANT_FOR_CALCULATED_PV_DC_CAPACITY'
    ? (wizard.inverterExactVariantReason ??
      'The selected AC variant exactly matches the calculated PV DC capacity.')
    : reason === 'SMALLEST_CATALOG_AC_VARIANT_NOT_BELOW_CALCULATED_PV_DC_CAPACITY'
      ? (wizard.inverterNextVariantReason ??
        'The smallest available catalog AC variant not below the calculated PV DC capacity was selected.')
      : (wizard.inverterRecommendationCopy ??
        'Selected for the calculated PV DC capacity. Final compatibility is confirmed during engineering.');

export const equipmentProductHref = (productId, locale) => {
  if (typeof productId !== 'string' || !productId.trim()) return null;
  const language = localeCode(locale);
  const route = language === 'hy' ? '/equipment/' : `/${language}/equipment/`;
  return `${route}?product=${encodeURIComponent(productId)}`;
};

// Rendering reads the controller's single state object; it owns no session or requests.
export const createCalculatorResultsView = ({
  wizard,
  product,
  locale,
  displayProductsById,
  resultDashboard,
  resultSummary,
  financeEmpty,
  financeResult,
  financeValues,
  passportContent,
  renderBars,
  state
}) => {
  const dashboardMetric = (label, value, kind = '') => {
    const wrapper = element('div', `result-metric${kind ? ` result-metric--${kind}` : ''}`);
    wrapper.append(element('dt', '', label), element('dd', '', value));
    return wrapper;
  };

  const resultIcon = (name) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `/icons.svg#${name}`);
    svg.append(use);
    return svg;
  };

  const overviewMetric = ({ label, value, icon, kind }) => {
    const wrapper = element('div', `result-overview__metric result-overview__metric--${kind}`);
    const symbol = element('span', 'result-overview__icon');
    symbol.append(resultIcon(icon));
    wrapper.append(symbol, element('dt', '', label), element('dd', '', value));
    return wrapper;
  };

  const monthlyComparisonChart = ({ consumption, generation, months }) => {
    const chart = element('figure', 'wizard-chart monthly-comparison-chart');
    chart.append(
      element(
        'figcaption',
        '',
        wizard.results?.monthlyComparison ?? 'Monthly consumption vs solar production'
      )
    );
    const legend = element('p', 'monthly-comparison-chart__legend');
    legend.append(
      element('span', 'monthly-comparison-chart__legend-consumption', wizard.monthlyConsumption ?? 'Consumption'),
      element('span', 'monthly-comparison-chart__legend-generation', wizard.production ?? 'Solar production')
    );
    const values = [...consumption, ...generation].map((value) => number(value, 0) ?? 0);
    const maximum = Math.max(...values, 1);
    const bars = element('div', 'monthly-comparison-chart__bars');
    months.forEach((month, index) => {
      const item = element('div', 'monthly-comparison-chart__item');
      const pair = element('div', 'monthly-comparison-chart__pair');
      const consumptionValue = number(consumption[index], 0) ?? 0;
      const generationValue = number(generation[index], 0) ?? 0;
      const consumptionBar = element('span', 'monthly-comparison-chart__bar monthly-comparison-chart__bar--consumption');
      consumptionBar.style.setProperty('--chart-height', `${(consumptionValue / maximum) * 100}%`);
      consumptionBar.setAttribute('title', `${month?.name ?? index + 1}: ${format(consumptionValue, locale)} kWh`);
      const generationBar = element('span', 'monthly-comparison-chart__bar monthly-comparison-chart__bar--generation');
      generationBar.style.setProperty('--chart-height', `${(generationValue / maximum) * 100}%`);
      generationBar.setAttribute('title', `${month?.name ?? index + 1}: ${format(generationValue, locale)} kWh`);
      pair.append(consumptionBar, generationBar);
      item.append(pair, element('small', '', month?.short ?? String(index + 1)));
      bars.append(item);
    });
    chart.append(legend, bars);
    return chart;
  };

  const calculationBasisDetail = (basis) => {
    if (!basis) return null;
    const basisCopy = wizard.calculationBasis ?? {};
    const sourceType = (type) => basisCopy.sourceTypes?.[type] ?? type ?? '';
    const withSource = (value, type) => `${value} · ${sourceType(type)}`.replace(/\s*·\s*$/u, '');
    const detail = element('details', 'wizard-details calculation-basis');
    detail.append(element('summary', '', wizard.calculationBasisTitle ?? 'Calculation basis'));
    const list = element('dl', 'passport-ledger');
    const add = (label, value, type) => {
      if (!value) return;
      list.append(dashboardMetric(label, withSource(value, type)));
    };
    const coordinates = basis.coordinates;
    if (coordinates) {
      const label =
        coordinates.sourceType === 'regional-reference'
          ? (basisCopy.regionalCoordinates ?? 'Regional reference point')
          : (basisCopy.coordinates ?? 'Coordinates');
      const region = coordinates.regionId ? ` · ${coordinates.regionId}` : '';
      add(
        label,
        `${format(coordinates.latitude, locale, { maximumFractionDigits: 5 })}, ${format(coordinates.longitude, locale, { maximumFractionDigits: 5 })}${region}`,
        coordinates.sourceType
      );
    }
    if (basis.consumption) {
      add(
        wizard.annualConsumption ?? 'Annual consumption',
        `${format(basis.consumption.annualKwh, locale)} kWh`,
        basis.consumption.sourceType
      );
    }
    const solarYield = basis.solarYield;
    if (solarYield) {
      const loss = solarYield.configuration?.systemLossPercent;
      const lossCopy =
        loss === null || loss === undefined
          ? ''
          : ` · ${basisCopy.systemLoss ?? 'System loss'}: ${format(loss, locale, { maximumFractionDigits: 1 })}%`;
      add(
        basisCopy.solarYield ?? 'Solar yield',
        `${solarYield.source?.provider ?? 'PVGIS'} · ${format(solarYield.annualYieldKwhPerKwp, locale)} kWh/kWp${lossCopy}`,
        solarYield.sourceType
      );
    }
    const roof = basis.roof;
    if (roof) {
      const mountingMode =
        roof.mountingMode === 'elevated'
          ? (wizard.elevated ?? 'Elevated structure')
          : roof.mountingMode === 'roof-parallel'
            ? (wizard.parallel ?? 'Parallel to roof')
            : '—';
      add(
        basisCopy.roof ?? 'Roof data',
        `${format(roof.areaSqm, locale, { maximumFractionDigits: 1 })} m² · ${format(roof.orientationDegrees, locale, { maximumFractionDigits: 1 })}° · ${format(roof.tiltDegrees, locale, { maximumFractionDigits: 1 })}° · ${mountingMode}`,
        roof.sourceType
      );
    }
    if (basis.usableRoofRatio) {
      add(
        basisCopy.usableRoofRatio ?? 'Usable roof ratio',
        `${format(basis.usableRoofRatio.ratio * 100, locale, { maximumFractionDigits: 0 })}%`,
        basis.usableRoofRatio.sourceType
      );
    }
    const solarModule = basis.solarModule;
    if (solarModule) {
      add(
        basisCopy.solarModule ?? 'Calculation solar module',
        `${solarModule.brand ?? ''} ${solarModule.model ?? ''} · ${format(solarModule.panelWatts, locale)} W · ${format(solarModule.panelAreaSqm, locale, { maximumFractionDigits: 2 })} m² · ${solarModule.productId}`.trim(),
        solarModule.sourceType
      );
    }
    const inverter = basis.inverter;
    if (inverter) {
      add(
        basisCopy.inverter ?? 'Recommended inverter',
        `${inverter.brand ?? ''} ${inverter.productName ?? inverter.model ?? ''} · ${format(inverter.selectedAcPowerKw, locale, { maximumFractionDigits: 1 })} kW · ${inverter.productId}`.trim(),
        inverter.sourceType
      );
    }
    const storage = basis.storage;
    if (storage) {
      add(
        basisCopy.storage ?? 'Storage option',
        `${storage.brand ?? ''} ${storage.productName ?? storage.model ?? ''}${storage.selectedUsableCapacityKwh ? ` · ${format(storage.selectedUsableCapacityKwh, locale, { maximumFractionDigits: 2 })} kWh` : ''} · ${storage.productId}`.trim(),
        storage.sourceType
      );
    }
    const mounting = basis.mounting;
    if (mounting) {
      add(
        basisCopy.mounting ?? 'Mounting option',
        `${mounting.brand ?? ''} ${mounting.productName ?? mounting.model ?? ''}${mounting.practicalInclinationDeg === null ? '' : ` · ${format(mounting.practicalInclinationDeg, locale, { maximumFractionDigits: 1 })}°`} · ${mounting.productId}`.trim(),
        mounting.sourceType
      );
    }
    const tariff = basis.tariff;
    if (tariff?.rateAmdPerKwh !== null && tariff?.rateAmdPerKwh !== undefined) {
      const identity = [tariff.tariffId, tariff.revision, tariff.period]
        .filter(Boolean)
        .join(' · ');
      add(
        basisCopy.tariff ?? 'Electricity tariff',
        `${identity ? `${identity} · ` : ''}${format(tariff.rateAmdPerKwh, locale, { maximumFractionDigits: 2 })} AMD/kWh`,
        tariff.sourceType
      );
    } else {
      add(
        basisCopy.tariff ?? 'Electricity tariff',
        basisCopy.noTariff ?? 'No tariff selected',
        tariff?.sourceType
      );
    }
    const surplus = basis.surplusCompensation;
    if (surplus?.rateAmdPerKwh !== null && surplus?.rateAmdPerKwh !== undefined) {
      const identity = [surplus.id, surplus.revision].filter(Boolean).join(' · ');
      add(
        basisCopy.surplusCompensation ?? 'Surplus compensation',
        `${identity ? `${identity} · ` : ''}${format(surplus.rateAmdPerKwh, locale, { maximumFractionDigits: 2 })} AMD/kWh`,
        surplus.sourceType
      );
    } else {
      add(
        basisCopy.surplusCompensation ?? 'Surplus compensation',
        basisCopy.noSurplusCompensation ?? 'No verified compensation rate is configured',
        surplus?.sourceType
      );
    }
    detail.append(list);
    return detail;
  };

  const equipmentCard = ({ title, recommendation, value, reason }) => {
    const productId = recommendation?.productId;
    if (typeof productId !== 'string' || !productId) return null;
    const displayProduct = displayProductsById.get(productId) ?? null;
    const card = document.createElement(displayProduct ? 'a' : 'article');
    card.className = 'result-equipment-card';
    card.dataset.recommendedProduct = productId;
    if (displayProduct) {
      card.href = equipmentProductHref(productId, locale);
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    } else {
      card.classList.add('result-equipment-card--unlinked');
    }

    const displayName = displayProduct?.name ?? recommendation.productName ?? '';
    const displayModel = displayProduct?.model ?? recommendation.model ?? '';
    const displayBrand = displayProduct?.brand ?? recommendation.brand ?? '';
    const media = element('div', 'result-equipment-card__media');
    const imageUnavailable = element(
      'span',
      'result-equipment-card__image-unavailable',
      wizard.equipmentImageUnavailable ?? 'Product image unavailable'
    );
    if (displayProduct?.image) {
      const image = document.createElement('img');
      image.src = displayProduct.image;
      image.alt = [displayBrand, displayName, displayModel].filter(Boolean).join(' · ');
      image.loading = 'lazy';
      image.decoding = 'async';
      imageUnavailable.hidden = true;
      image.addEventListener('error', () => {
        image.hidden = true;
        imageUnavailable.hidden = false;
      });
      media.append(image, imageUnavailable);
    } else {
      media.append(imageUnavailable);
    }

    const content = element('div', 'result-equipment-card__content');
    content.append(
      element('p', 'result-equipment-card__label', title),
      element('p', 'result-equipment-card__brand', displayBrand),
      element('h4', '', displayName),
      element('p', 'result-equipment-card__model', displayModel),
      element('p', 'result-equipment-card__value', value),
      element('p', 'result-equipment-card__reason', reason),
      element(
        'p',
        'result-equipment-card__status',
        wizard.recommendationPreliminary ?? 'Preliminary recommendation'
      )
    );
    if (displayProduct)
      content.append(
        element('span', 'result-equipment-card__cta', wizard.viewProduct ?? 'View product')
      );
    card.append(media, content);
    return card;
  };

  const equipmentRecommendationCards = (recommendation) => {
    const cards = [];
    const solarModule = recommendation?.solarModule;
    if (solarModule?.productId) {
      cards.push(
        equipmentCard({
          title: wizard.moduleRecommendationTitle ?? 'Recommended solar module',
          recommendation: solarModule,
          value: `${format(solarModule.quantity, locale)} × ${format(solarModule.watts, locale)} W · ${format(solarModule.totalDcCapacityKwp, locale, { maximumFractionDigits: 2 })} kWp DC`,
          reason:
            wizard.moduleRecommendationReason ??
            'The catalog module count and rating produce the calculated DC capacity.'
        })
      );
    }
    const inverter = recommendation?.inverter;
    if (inverter?.productId && Number.isFinite(Number(inverter.selectedAcPowerKw))) {
      cards.push(
        equipmentCard({
          title: wizard.inverterRecommendationTitle ?? 'Recommended inverter',
          recommendation: inverter,
          value: `${format(inverter.selectedAcPowerKw, locale, { maximumFractionDigits: 1 })} kW AC · ${inverterTechnology(inverter.technology, wizard)}`,
          reason: inverterReason(inverter.reason, wizard)
        })
      );
    }
    const mounting = recommendation?.mounting;
    if (mounting?.productId) {
      cards.push(
        equipmentCard({
          title: wizard.mountingHardwareTitle ?? 'Mounting recommendation',
          recommendation: mounting,
          value: `${format(mounting.practicalInclinationDeg, locale, { maximumFractionDigits: 1 })}° · ${mounting.installationType === 'elevated' ? (wizard.elevated ?? 'Elevated structure') : (wizard.parallel ?? 'Parallel to roof')}`,
          reason:
            wizard.mountingHardwareReason ??
            'The catalog-supported inclination nearest the PVGIS optimum was selected.'
        })
      );
    }
    const storage = recommendation?.storage;
    if (storage?.status === 'sized' && storage.productId) {
      cards.push(
        equipmentCard({
          title: wizard.storageRecommendationTitle ?? 'Battery / storage option',
          recommendation: storage,
          value: `${format(storage.selectedUsableCapacityKwh, locale, { maximumFractionDigits: 2 })} kWh · ${format(storage.moduleCount, locale)} ${wizard.storageModules ?? 'modules'}`,
          reason:
            wizard.storageSizingReason ??
            'A whole module count was rounded up to cover the required usable capacity.'
        })
      );
    }

    const availableCards = cards.filter(Boolean);
    if (!availableCards.length) return null;
    const section = element('section', 'result-equipment');
    section.append(
      element('h3', '', wizard.recommendedSystemTitle ?? 'Recommended system'),
      ...availableCards,
      element(
        'p',
        'result-equipment__engineering-note',
        wizard.equipmentPreliminaryCopy ??
          'This selection is preliminary; an engineer confirms string design, electrical compatibility and site implementation.'
      )
    );
    return section;
  };

  const renderResult = (analysis) => {
    const scenario = analysis.selectedScenario;
    if (!scenario || !resultDashboard) return;
    const monthly = scenario.generation?.monthlyKwh ?? [];
    const annualSavings = scenario.financial?.annualSavingsAmd;
    const annualConsumptionKwh = number(scenario.energyBalance?.annualConsumptionKwh, 0);
    const annualGenerationKwh = number(scenario.generation?.annualKwh, 0);
    const surplusEnergyKwh = number(scenario.energyBalance?.surplusEnergyKwh, 0);
    const retailOffsetValueAmd = number(scenario.financial?.retailOffsetValueAmd, 0);
    const surplusCompensationValueAmd = number(scenario.financial?.surplusCompensationValueAmd, 0);
    const displayedSavings = number(annualSavings, 0) ?? retailOffsetValueAmd;
    const savingsAreOffsetOnly = number(annualSavings, 0) === null && retailOffsetValueAmd !== null;
    const remainingGridDemandKwh =
      annualConsumptionKwh === null || annualGenerationKwh === null
        ? null
        : Math.max(annualConsumptionKwh - annualGenerationKwh, 0);
    resultDashboard.replaceChildren();
    const resultsCopy = wizard.results ?? {};
    const overview = element('section', 'result-overview');
    const overviewHeading = element('div', 'result-overview__heading');
    overviewHeading.append(
      element(
        'p',
        'result-overview__eyebrow',
        resultsCopy.overviewEyebrow ?? 'Recommended solar system'
      ),
      element('h3', '', resultsCopy.overviewTitle ?? 'Recommended solar system'),
      element(
        'p',
        'result-overview__copy',
        resultsCopy.overviewCopy ??
          'Sized from your location, annual consumption and actual roof inputs.'
      )
    );
    const primaryMetrics = element('dl', 'wizard-kpis result-kpis');
    primaryMetrics.append(
      overviewMetric({
        label: resultsCopy.metrics?.recommendedPower ?? 'Recommended power',
        value: `${format(scenario.system?.capacityKwp, locale, {
          maximumFractionDigits: 2
        })} kWp`,
        icon: 'zap',
        kind: 'power'
      }),
      overviewMetric({
        label: resultsCopy.metrics?.panelCount ?? 'Panel count',
        value: `${format(scenario.system?.panelCount, locale)} × ${format(
          scenario.system?.panelWatts,
          locale
        )} W`,
        icon: 'solar-mount',
        kind: 'panels'
      }),
      overviewMetric({
        label:
          resultsCopy.metrics?.annualProduction ?? wizard.metrics?.annualGeneration ?? 'kWh/year',
        value: `${format(scenario.generation?.annualKwh, locale)} ${
          resultsCopy.annualGenerationUnit ?? 'kWh/year'
        }`,
        icon: 'chart-bars',
        kind: 'production'
      }),
      overviewMetric({
        label:
          resultsCopy.metrics?.annualCoverage ??
          wizard.annualCoverage ??
          'Annual consumption coverage',
        value: `≈ ${format(scenario.coveragePercent, locale, { maximumFractionDigits: 0 })}%`,
        icon: 'faq-home',
        kind: 'coverage'
      }),
      overviewMetric({
        label: savingsAreOffsetOnly
          ? (wizard.retailOffsetSavings ?? 'Savings from covered consumption')
          : (resultsCopy.metrics?.annualSavings ??
            wizard.metrics?.annualSavings ??
            'Annual savings'),
        value: displayedSavings === null ? '—' : `≈ ${format(displayedSavings, locale)} ֏`,
        icon: 'calculator',
        kind: 'savings'
      })
    );
    overview.append(overviewHeading, primaryMetrics);
    resultDashboard.append(overview);
    if (annualConsumptionKwh !== null || annualGenerationKwh !== null) {
      const balance = element('section', 'result-notice result-energy-balance');
      balance.append(element('h3', '', wizard.energyBalanceTitle ?? 'Energy balance'));
      const values = element('dl', 'wizard-kpis');
      values.append(
        dashboardMetric(
          wizard.annualConsumption ?? 'Annual consumption',
          annualConsumptionKwh === null ? '—' : `${format(annualConsumptionKwh, locale)} kWh`
        ),
        dashboardMetric(
          wizard.results?.metrics?.annualProduction ??
            wizard.metrics?.annualGeneration ??
            'kWh/year',
          `${format(annualGenerationKwh, locale)} kWh`
        ),
        dashboardMetric(
          wizard.annualCoverage ?? 'Annual consumption coverage',
          `≈ ${format(scenario.coveragePercent, locale, { maximumFractionDigits: 0 })}%`
        ),
        dashboardMetric(
          wizard.remainingGridDemand ?? 'Remaining annual grid demand',
          remainingGridDemandKwh === null ? '—' : `${format(remainingGridDemandKwh, locale)} kWh`
        )
      );
      balance.append(values);
      if (retailOffsetValueAmd !== null)
        balance.append(
          element(
            'p',
            '',
            `${wizard.retailOffsetSavings ?? 'Savings from covered consumption'}: ${text(
              wizard.retailOffsetSavingsCopy ?? '≈ {value} AMD/year',
              { value: format(retailOffsetValueAmd, locale) }
            )}`
          )
        );
      if (surplusEnergyKwh !== null && surplusEnergyKwh > 0) {
        const surplusCopy =
          surplusCompensationValueAmd === null
            ? (wizard.surplusValueUnavailable ?? wizard.surplusCompensationUnavailableCopy)
            : text(wizard.surplusCompensationValueCopy, {
                surplus: format(surplusEnergyKwh, locale),
                value: format(surplusCompensationValueAmd, locale)
              });
        balance.append(
          element(
            'p',
            '',
            surplusCompensationValueAmd === null
              ? surplusCopy
              : `${wizard.surplusCompensationValue ?? 'Surplus compensation'}: ${surplusCopy}`
          )
        );
        balance.append(
          element(
            'small',
            '',
            wizard.annualNetSurplusHelp ??
              'This compares annual totals; it is not an hourly export calculation.'
          )
        );
      }
      resultDashboard.append(balance);
    }
    const projectSummary = element('section', 'result-project-summary');
    projectSummary.append(
      element('h3', '', wizard.projectSummaryTitle ?? 'Your project summary')
    );
    const projectValues = element('dl', 'wizard-kpis');
    const coordinates = analysis.property?.coordinates ?? state.confirmedProperty;
    const referencePotential = state.sitePotential;
    const consumptionMode = state.consumption?.mode;
    const consumptionModeLabel = consumptionMode
      ? product.consumption?.modes?.[consumptionMode] ?? consumptionMode
      : '—';
    const tariffRate = analysis.financial?.tariff?.rateAmdPerKwh ?? state.userTariff?.rateAmdPerKwh;
    const roofMounting =
      analysis.roof?.mountingMode === 'elevated'
        ? (wizard.elevated ?? 'Elevated structure')
        : (wizard.parallel ?? 'Roof parallel');
    projectValues.append(
      dashboardMetric(
        wizard.projectLocation ?? 'Location',
        state.addressNote ||
          (coordinates
            ? `${format(coordinates.lat, locale, { maximumFractionDigits: 5 })}, ${format(coordinates.lng, locale, { maximumFractionDigits: 5 })}`
            : '—')
      ),
      dashboardMetric(
        wizard.exactCoordinates ?? 'Coordinates',
        coordinates
          ? `${format(coordinates.lat, locale, { maximumFractionDigits: 5 })}, ${format(coordinates.lng, locale, { maximumFractionDigits: 5 })}`
          : '—'
      ),
      dashboardMetric(
        wizard.pvgisReferenceYield ?? 'PVGIS reference yield',
        referencePotential
          ? `${format(referencePotential.annualYieldKwhPerKwp, locale)} kWh/kWp/year`
          : '—'
      ),
      dashboardMetric(
        wizard.annualConsumption ?? 'Annual consumption',
        `${format(annualConsumptionKwh, locale)} kWh · ${consumptionModeLabel}`
      ),
      dashboardMetric(
        wizard.metrics?.tariff ?? 'Tariff',
        tariffRate === null || tariffRate === undefined
          ? '—'
          : `${format(tariffRate, locale, { maximumFractionDigits: 2 })} AMD/kWh`
      ),
      dashboardMetric(
        wizard.roofSummary ?? 'Roof',
        `${format(analysis.roof?.areaSqm, locale, { maximumFractionDigits: 1 })} m² · ${format(analysis.roof?.orientationDegrees, locale, { maximumFractionDigits: 0 })}° · ${format(analysis.roof?.tiltDegrees, locale, { maximumFractionDigits: 0 })}° · ${roofMounting}`
      )
    );
    projectSummary.append(projectValues);
    resultDashboard.append(projectSummary);
    const yieldDetail = element('details', 'wizard-details result-yield-comparison');
    yieldDetail.append(
      element('summary', '', wizard.roofYieldDetails ?? 'Location and roof yield details')
    );
    const yieldValues = element('dl', 'passport-ledger');
    yieldValues.append(
      dashboardMetric(
        wizard.pvgisReferenceYield ?? 'PVGIS reference at location',
        referencePotential
          ? `${format(referencePotential.annualYieldKwhPerKwp, locale)} kWh/kWp/year · ${format(referencePotential.orientation?.azimuthDegrees, locale, { maximumFractionDigits: 0 })}° / ${format(referencePotential.orientation?.tiltDegrees, locale, { maximumFractionDigits: 0 })}°`
          : '—'
      ),
      dashboardMetric(
        wizard.roofSystemYield ?? 'Estimated specific yield for your roof',
        `${format(analysis.production?.annualYieldKwhPerKwp, locale)} kWh/kWp/year`
      )
    );
    yieldDetail.append(
      yieldValues,
      element(
        'p',
        '',
        wizard.roofYieldExplanation ??
          'The difference can result from the actual roof orientation, tilt and calculation assumptions.'
      )
    );
    resultDashboard.append(yieldDetail);
    const equipmentRecommendation = analysis.equipmentRecommendation;
    const renderedEquipmentCards = equipmentRecommendationCards(equipmentRecommendation);
    if (renderedEquipmentCards) resultDashboard.append(renderedEquipmentCards);
    const solarModule = equipmentRecommendation?.solarModule;
    if (!renderedEquipmentCards && solarModule) {
      const recommendation = element('section', 'result-notice');
      recommendation.append(
        element('h3', '', wizard.moduleRecommendationTitle ?? 'Recommended solar module'),
        element('p', '', `${solarModule.brand} ${solarModule.productName}`),
        element('p', '', solarModule.model),
        element(
          'p',
          '',
          text(wizard.moduleRecommendationCopy, {
            quantity: format(solarModule.quantity, locale),
            watts: format(solarModule.watts, locale),
            capacity: format(solarModule.totalDcCapacityKwp, locale, {
              maximumFractionDigits: 2
            }),
            area: format(solarModule.physicalModuleAreaSqm, locale, {
              maximumFractionDigits: 2
            }),
            footprint: format(solarModule.totalModuleFootprintSqm, locale, {
              maximumFractionDigits: 2
            })
          })
        ),
        element(
          'p',
          '',
          wizard.moduleRecommendationReason ??
            'The catalog module count and rating produce the calculated DC capacity.'
        ),
        element(
          'small',
          '',
          wizard.equipmentPreliminaryCopy ??
            'Final string design, electrical compatibility and site implementation are confirmed during engineering.'
        )
      );
      resultDashboard.append(recommendation);
    } else {
      const equipment = analysis.equipment ?? scenario.system?.equipment;
      if (equipment?.panelBrand && equipment?.panelModel) {
        resultDashboard.append(
          element(
            'p',
            'result-notice',
            `${wizard.preliminarySizingBasis ?? 'Preliminary sizing basis'}: ${equipment.panelBrand} ${equipment.panelModel} · ${format(equipment.panelWatts, locale)} W`
          )
        );
      }
    }
    const roofCapacity = calculatePreliminaryRoofCapacity({
      roofAreaSqm: analysis.roof?.areaSqm,
      usableAreaRatio: analysis.roof?.usableAreaRatio,
      panelAreaSqm: scenario.system?.panelAreaSqm,
      panelWatts: scenario.system?.panelWatts
    });
    if (roofCapacity) {
      const roofFit = element('section', 'result-notice result-roof-capacity');
      roofFit.append(element('h3', '', wizard.roofCapacityTitle ?? 'Physical roof capacity'));
      const values = element('dl', 'wizard-kpis');
      values.append(
        dashboardMetric(
          wizard.roofAreaForSizing ?? 'Roof area used for sizing',
          `${format(roofCapacity.roofAreaSqm, locale, { maximumFractionDigits: 1 })} m²`
        ),
        dashboardMetric(
          wizard.preliminaryUsableRoofArea ?? 'Preliminary usable module area',
          `${format(roofCapacity.usableRoofAreaSqm, locale, { maximumFractionDigits: 1 })} m²`
        ),
        dashboardMetric(
          wizard.maximumPanelsForRoof ?? 'Maximum with the selected module',
          format(roofCapacity.maximumPanelCount, locale)
        ),
        dashboardMetric(
          wizard.physicalDcCapacityLimit ?? 'Physical DC capacity limit',
          `${format(roofCapacity.maximumCapacityKwp, locale, { maximumFractionDigits: 2 })} kWp`
        ),
        dashboardMetric(
          wizard.roofOrientation ?? 'Roof orientation',
          `${format(analysis.roof?.orientationDegrees, locale, { maximumFractionDigits: 0 })}°`
        ),
        dashboardMetric(
          wizard.roofTilt ?? 'Roof tilt',
          `${format(analysis.roof?.tiltDegrees, locale, { maximumFractionDigits: 0 })}° · ${
            analysis.roof?.mountingMode === 'elevated'
              ? (wizard.elevated ?? 'Elevated structure')
              : (wizard.parallel ?? 'Roof parallel')
          }`
        )
      );
      roofFit.append(
        values,
        element(
          'p',
          '',
          text(wizard.roofCapacityPreview, {
            capacity: format(roofCapacity.maximumCapacityKwp, locale, {
              maximumFractionDigits: 2
            }),
            count: format(roofCapacity.maximumPanelCount, locale)
          })
        ),
        element(
          'small',
          '',
          text(wizard.roofCapacityAssumption, {
            ratio: format(roofCapacity.usableAreaRatio * 100, locale, {
              maximumFractionDigits: 0
            })
          })
        ),
        element(
          'p',
          'result-roof-capacity__status',
          scenario.limitations?.includes('ROOF_CAPACITY_LIMIT')
            ? (wizard.roofCapacityLimiting ??
              'The physical roof limit constrains the recommended system size.')
            : (wizard.roofCapacityNotLimiting ?? 'Roof capacity is not a limiting factor.')
        ),
        element(
          'small',
          '',
          wizard.roofCapacityExplanation ??
            'The physical roof limit is not the recommended system size; the recommendation is sized from consumption, solar yield and the other calculation inputs.'
        )
      );
      resultDashboard.append(roofFit);
    }
    const inverter = equipmentRecommendation?.inverter ?? analysis.inverterRecommendation;
    if (
      !renderedEquipmentCards &&
      inverter?.productId &&
      Number.isFinite(Number(inverter.selectedAcPowerKw))
    ) {
      const recommendation = element('section', 'result-notice');
      recommendation.append(
        element('h3', '', wizard.inverterRecommendationTitle ?? 'Recommended inverter'),
        element(
          'p',
          '',
          `${inverter.brand} ${inverter.productName} · ${format(inverter.selectedAcPowerKw, locale, { maximumFractionDigits: 1 })} kW`
        ),
        element('p', '', inverter.model),
        element(
          'p',
          '',
          text(wizard.inverterTechnologyCopy, {
            technology: inverterTechnology(inverter.technology, wizard)
          })
        ),
        element('p', '', inverterReason(inverter.reason, wizard)),
        element(
          'small',
          '',
          wizard.equipmentPreliminaryCopy ??
            wizard.inverterRecommendationCopy ??
            'Final string, MPPT and grid compatibility is confirmed during engineering.'
        )
      );
      resultDashboard.append(recommendation);
    }
    const mountingHardware = analysis.mountingHardwareRecommendation;
    if (
      !renderedEquipmentCards &&
      mountingHardware?.status === 'matched' &&
      mountingHardware.productId
    ) {
      const recommendation = element('section', 'result-notice');
      const availableAngles = (mountingHardware.availableInclinationDeg ?? [])
        .map((angle) => format(angle, locale, { maximumFractionDigits: 1 }))
        .join(' / ');
      recommendation.append(
        element('h3', '', wizard.mountingHardwareTitle ?? 'Catalog mounting option'),
        element('p', '', `${mountingHardware.brand} ${mountingHardware.productName}`),
        element('p', '', mountingHardware.model),
        element(
          'p',
          '',
          text(wizard.mountingHardwareCopy, {
            optimum: format(mountingHardware.pvgisOptimumTiltDegrees, locale, {
              maximumFractionDigits: 1
            }),
            available: availableAngles,
            practical: format(mountingHardware.practicalInclinationDeg, locale, {
              maximumFractionDigits: 1
            })
          })
        )
      );
      if (
        Number.isFinite(Number(mountingHardware.kitLengthMm)) ||
        Number.isFinite(Number(mountingHardware.railLengthMm))
      ) {
        recommendation.append(
          element(
            'p',
            '',
            text(wizard.mountingHardwareDimensionsCopy, {
              kit: Number.isFinite(Number(mountingHardware.kitLengthMm))
                ? format(mountingHardware.kitLengthMm, locale)
                : '—',
              rail: Number.isFinite(Number(mountingHardware.railLengthMm))
                ? format(mountingHardware.railLengthMm, locale)
                : '—'
            })
          )
        );
      }
      recommendation.append(
        element(
          'p',
          '',
          wizard.mountingHardwareReason ??
            'The catalog-supported inclination nearest the PVGIS optimum was selected.'
        )
      );
      recommendation.append(
        element(
          'small',
          '',
          wizard.mountingHardwareEngineeringCopy ??
            'The catalog angle does not change the calculated roof plane. Structure and wind-load design are confirmed during engineering.'
        )
      );
      resultDashboard.append(recommendation);
    } else if (!renderedEquipmentCards && mountingHardware?.status === 'no-catalog-match') {
      resultDashboard.append(
        element(
          'p',
          'result-notice',
          text(wizard.mountingHardwareNoMatchCopy, {
            optimum: format(mountingHardware.pvgisOptimumTiltDegrees, locale, {
              maximumFractionDigits: 1
            })
          })
        )
      );
    }
    const storage = analysis.storageRecommendation;
    if (!renderedEquipmentCards && storage) {
      const recommendation = element('section', 'result-notice');
      recommendation.append(
        element('h3', '', wizard.storageRecommendationTitle ?? 'Energy-storage option')
      );
      if (storage.status === 'sized' && storage.productId) {
        recommendation.append(
          element('p', '', `${storage.brand} ${storage.productName}`),
          element('p', '', storage.model),
          element(
            'p',
            '',
            text(wizard.storageSizingCopy, {
              required: format(storage.requiredUsableCapacityKwh, locale, {
                maximumFractionDigits: 2
              }),
              modules: storage.moduleCount,
              selected: format(storage.selectedUsableCapacityKwh, locale, {
                maximumFractionDigits: 2
              })
            })
          ),
          element(
            'p',
            '',
            wizard.storageSizingReason ??
              'A whole module count was rounded up to cover the required usable capacity.'
          )
        );
      } else if (storage.status === 'catalog-capacity-exceeded') {
        recommendation.append(
          element(
            'p',
            '',
            text(wizard.storageCapacityExceededCopy, {
              maximum: format(storage.systemUsableCapacityMaxKwh, locale, {
                maximumFractionDigits: 2
              })
            })
          )
        );
      } else {
        recommendation.append(
          element(
            'p',
            '',
            wizard.storageProfileRequiredCopy ??
              'Storage is optional. Exact battery sizing requires a load and backup profile.'
          )
        );
      }
      recommendation.append(
        element(
          'small',
          '',
          wizard.storageEngineeringCopy ??
            'Final compatibility, backup output and connection design are confirmed during engineering.'
        )
      );
      resultDashboard.append(recommendation);
    }
    const basis = calculationBasisDetail(analysis.calculationBasis);
    if (basis) resultDashboard.append(basis);
    if (scenario.limitations?.includes('ROOF_CAPACITY_LIMIT')) {
      const limit = element('p', 'result-notice result-notice--warning', wizard.roofLimit);
      limit.append(
        ` ${format(scenario.system?.requestedCapacityKwp, locale, { maximumFractionDigits: 2 })} kWp → ${format(scenario.system?.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp; ${format(scenario.system?.maximumPanelCount, locale)} panels.`
      );
      resultDashboard.append(limit);
    }
    const environmental = analysis.environmental;
    if (Number.isFinite(Number(environmental?.avoidedCo2Tons))) {
      const impact = element('section', 'result-environmental');
      impact.append(
        element(
          'h3',
          '',
          wizard.results?.impactTitle ?? wizard.environmental?.co2 ?? 'Environmental impact'
        )
      );
      const values = element('dl', 'wizard-kpis');
      values.append(
        dashboardMetric(
          wizard.results?.impact?.co2 ?? wizard.environmental?.co2 ?? 'Avoided CO₂ emissions',
          `${format(environmental.avoidedCo2Tons, locale, { maximumFractionDigits: 2 })} t CO₂`
        )
      );
      if (Number.isFinite(Number(environmental.treeEquivalent))) {
        values.append(
          dashboardMetric(
            wizard.results?.impact?.trees ??
              wizard.environmental?.trees ??
              'Tree CO₂ absorption equivalent',
            `≈ ${format(environmental.treeEquivalent, locale)}`
          )
        );
      }
      impact.append(values);
      const factor = environmental.factor ?? {};
      if (Number.isFinite(Number(factor.valueKgCo2PerKwh))) {
        impact.append(
          element(
            'small',
            'result-environmental__source',
            `${wizard.environmentalFactorSource ?? 'Historical grid-emission factor'}${
              factor.dataYear ? ` (${factor.dataYear})` : ''
            }: ${format(factor.valueKgCo2PerKwh, locale, {
              maximumFractionDigits: 3
            })} kgCO₂/kWh`
          )
        );
      }
      resultDashboard.append(impact);
    }
    const actualMonthlyConsumption =
      state.consumption?.mode === 'monthly' &&
      Array.isArray(analysis.consumption?.monthlyKwh) &&
      analysis.consumption.monthlyKwh.length === 12 &&
      analysis.consumption.monthlyKwh.every((value) => number(value, 0) !== null)
        ? analysis.consumption.monthlyKwh
        : null;
    if (actualMonthlyConsumption && monthly.length === 12) {
      resultDashboard.append(
        monthlyComparisonChart({
          consumption: actualMonthlyConsumption,
          generation: monthly,
          months: product.passport?.months ?? []
        })
      );
    } else {
      const chart = element('figure', 'wizard-chart');
      chart.append(
        element(
          'figcaption',
          '',
          wizard.results?.monthlyProduction ?? wizard.production ?? 'Monthly solar production'
        )
      );
      const bars = element('div', 'chart-bars');
      renderBars(bars, monthly, product.passport?.months ?? [], 'kWh');
      chart.append(bars);
      resultDashboard.append(chart);
    }
    if (resultSummary)
      resultSummary.textContent = wizard.results?.intro ?? product.result?.ready ?? '';
    if (financeEmpty) financeEmpty.hidden = true;
    if (financeResult) financeResult.hidden = true;
    financeValues?.replaceChildren();
  };

  const renderPassport = () => {
    if (!passportContent || !state.solarPassport) return;
    const analysis = state.solarPassport.analysis;
    passportContent.replaceChildren();
    const list = element('dl', 'passport-ledger');
    const add = (label, value) => list.append(dashboardMetric(label, value));
    add(
      wizard.steps?.[0] ?? 'Property',
      `${format(analysis.property?.coordinates?.lat, locale, { maximumFractionDigits: 5 })}, ${format(analysis.property?.coordinates?.lng, locale, { maximumFractionDigits: 5 })}`
    );
    add(
      wizard.steps?.[2] ?? 'Roof',
      `${format(analysis.roof?.areaSqm, locale, { maximumFractionDigits: 1 })} m² · ${format(analysis.roof?.orientationDegrees, locale)}° · ${format(analysis.roof?.tiltDegrees, locale)}°`
    );
    const pvgisLoss = analysis.calculationBasis?.solarYield?.configuration?.systemLossPercent;
    add(
      wizard.metrics?.pvgis ?? 'PVGIS',
      `${format(analysis.production?.annualYieldKwhPerKwp, locale)} kWh/kWp · ${analysis.providerRetrievedAt ?? '—'}${pvgisLoss === null || pvgisLoss === undefined ? '' : ` · ${format(pvgisLoss, locale, { maximumFractionDigits: 1 })}%`}`
    );
    add(
      wizard.metrics?.system ?? 'System',
      `${format(analysis.selectedScenario?.system?.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp · ${format(analysis.selectedScenario?.system?.panelCount, locale)} × ${format(analysis.selectedScenario?.system?.panelWatts, locale)} W${analysis.equipment?.panelBrand && analysis.equipment?.panelModel ? ` · ${analysis.equipment.panelBrand} ${analysis.equipment.panelModel}` : ''}`
    );
    const surplusEnergyKwh = number(analysis.selectedScenario?.energyBalance?.surplusEnergyKwh, 0);
    const surplusCompensationValueAmd = number(
      analysis.selectedScenario?.financial?.surplusCompensationValueAmd,
      0
    );
    if (surplusEnergyKwh !== null && surplusEnergyKwh > 0) {
      const compensationCopy =
        surplusCompensationValueAmd === null
          ? wizard.surplusCompensationUnavailableCopy
          : wizard.surplusCompensationValueCopy;
      add(
        wizard.surplusEnergy ?? 'Surplus generation',
        text(compensationCopy, {
          surplus: format(surplusEnergyKwh, locale),
          value: format(surplusCompensationValueAmd, locale)
        })
      );
    }
    const inverter = analysis.inverterRecommendation;
    if (inverter?.productId && Number.isFinite(Number(inverter.selectedAcPowerKw))) {
      add(
        wizard.inverterRecommendationTitle ?? 'Recommended inverter',
        `${inverter.brand} ${inverter.productName} · ${format(inverter.selectedAcPowerKw, locale, { maximumFractionDigits: 1 })} kW`
      );
    }
    const storage = analysis.storageRecommendation;
    if (storage?.status === 'sized' && storage.productId) {
      add(
        wizard.storageRecommendationTitle ?? 'Energy-storage option',
        `${storage.brand} ${storage.productName} · ${format(storage.selectedUsableCapacityKwh, locale, { maximumFractionDigits: 2 })} kWh · ${format(storage.moduleCount, locale)} modules`
      );
    }
    const mountingHardware = analysis.mountingHardwareRecommendation;
    if (mountingHardware?.status === 'matched' && mountingHardware.productId) {
      add(
        wizard.mountingHardwareTitle ?? 'Catalog mounting option',
        `${mountingHardware.brand} ${mountingHardware.productName} · ${format(mountingHardware.practicalInclinationDeg, locale, { maximumFractionDigits: 1 })}°`
      );
    }
    const estimate = analysis.commercialEstimate;
    add(
      wizard.budget,
      estimate?.available
        ? `P25 ${format(estimate.rangeAmd?.p25, locale)} ֏ · P50 ${format(estimate.primaryAmd, locale)} ֏ · P75 ${format(estimate.rangeAmd?.p75, locale)} ֏`
        : '—'
    );
    add(
      wizard.metrics?.tariff ?? product.consumption?.tariffLabel ?? 'Tariff',
      analysis.financial?.tariff?.rateAmdPerKwh
        ? `${format(analysis.financial.tariff.rateAmdPerKwh, locale)} AMD/kWh`
        : (product.result?.noTariff ?? '—')
    );
    const environmental = analysis.environmental;
    if (Number.isFinite(Number(environmental?.avoidedCo2Tons))) {
      const factor = environmental.factor ?? {};
      const historicalFactor = `${wizard.environmental?.historical ?? 'Verified historical factor'}${
        factor.dataYear ? ` (${factor.dataYear})` : ''
      }`;
      add(
        wizard.environmental?.co2 ?? 'Avoided CO₂ emissions',
        `${format(environmental.avoidedCo2Tons, locale, { maximumFractionDigits: 3 })} t CO₂ · ${historicalFactor} · ${format(factor.valueKgCo2PerKwh, locale, { maximumFractionDigits: 3 })} kgCO₂/kWh`
      );
      if (Number.isFinite(Number(environmental?.treeEquivalent))) {
        add(
          wizard.environmental?.trees ?? 'Tree CO₂ absorption equivalent',
          `≈ ${format(environmental.treeEquivalent, locale, { maximumFractionDigits: 0 })}`
        );
      }
    }
    passportContent.append(list);
    const limitations = element('ul', 'check-list');
    [...(analysis.assumptions ?? []), ...(analysis.limitations ?? [])].forEach((note) =>
      limitations.append(element('li', '', product.ledger?.assumptions?.[note] ?? note))
    );
    passportContent.append(limitations);
  };

  return { renderResult, renderPassport };
};
