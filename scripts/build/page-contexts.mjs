import hy from '../../src/content/hy.js';
import ru from '../../src/content/ru.js';
import en from '../../src/content/en.js';
import aboutPageCopy from '../../src/content/about.js';
import { contactPageCopy } from '../../src/content/contacts.js';
import { legalDocuments } from '../../src/content/legal.js';
import toolCopy from '../../src/content/tools.js';
import wizardCopy from '../../src/content/calculator-wizard.js';
import { processStoryCopy } from '../../src/content/process-story.js';
import { calculatorModes, regionLabels } from '../../src/content/calculator-modes.js';
import {
  ARMENIA_GRID_CO2_FACTOR,
  EPA_URBAN_TREE_CO2_EQUIVALENCY,
  buildEnvironmentalImpact
} from '../../src/domain/index.js';
import { ARMENIA_REGIONAL_BENCHMARKS } from '../../src/data/regions/armenia.js';
import { ARMENIA_TARIFF_DATASET } from '../../src/data/tariffs/armenia.js';
import { GENERATED_CONTENT_LOCALES } from '../../src/content/schema.js';
import { createProcessImageContext } from '../../src/config/process-images.js';
import { BLOG_COPY, getBlogPath } from '../../src/content/blog.js';
import { GALLERY_PROJECT_CASE_SLUGS, PROJECT_CASES } from '../../src/content/project-cases.js';
import { EQUIPMENT_COPY, SPEC_LABELS } from '../../src/data/equipment/showroom/translations.js';
import {
  formatProductCount,
  isWarrantyLabel
} from '../../src/data/equipment/showroom/equipment-i18n.js';
import { createEquipmentCatalog } from '../../src/data/equipment/showroom/catalog.js';

import { pagePath } from '../../src/config/routes.js';
import {
  projectsPageCopy,
  FEATURED_PROJECT_CASE_SLUG,
  galleryProjectCaseCopy
} from '../../src/content/projects.js';

// Context construction is separate from filesystem, template compilation and output.
export const createPageContextBuilder = ({ publicEnv, pages }) => {
  const runtimeLocales = Object.freeze(
    Object.fromEntries(GENERATED_CONTENT_LOCALES.map(({ key, locale }) => [key, locale]))
  );

  const origin = 'https://yourenergy.am';
  const DEFAULT_OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const DEFAULT_OSM_TILE_ATTRIBUTION = '© OpenStreetMap contributors';
  const DEFAULT_SATELLITE_TILE_URL =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const DEFAULT_SATELLITE_TILE_ATTRIBUTION = 'Tiles © Esri';
  const sameOriginPath = (value, fallback) => {
    const candidate = value?.trim();
    return candidate && /^\/(?!\/)/u.test(candidate) ? candidate : fallback;
  };
  const publishedAlternateLinks = Object.freeze([
    ...GENERATED_CONTENT_LOCALES.map(({ key, path }) => ({
      hreflang: key,
      href: `${origin}${path}`
    })),
    { hreflang: 'x-default', href: `${origin}/` }
  ]);

  const languageLabels = Object.freeze({ hy: 'AM', ru: 'RU', en: 'EN' });
  const calculatorModeControl = Object.freeze({
    hy: {
      eyebrow: 'Արևային հաշվիչ',
      title: 'Պարզեք ձեր արևային ներուժը',
      label: 'Հաշվիչի ռեժիմ',
      quick: 'Արագ և պարզ',
      quickCopy: '2 քայլ, նախնական արդյունք',
      professional: 'Պրոֆեսիոնալ',
      professionalCopy: 'Մանրամասն հաշվարկ՝ ընդլայնված պարամետրերով',
      unavailable: 'Պրոֆեսիոնալ ռեժիմը հիմա հասանելի չէ։',
      migration: {
        title: 'Հաշվիչը տեղափոխվել է',
        copy: 'Բացվում է YOURENERGY-ի միավորված պրոֆեսիոնալ հաշվիչը։',
        action: 'Բացել պրոֆեսիոնալ ռեժիմը'
      }
    },
    ru: {
      eyebrow: 'Солнечный калькулятор',
      title: 'Узнайте потенциал солнечной энергии',
      label: 'Режим калькулятора',
      quick: 'Быстро и просто',
      quickCopy: '2 шага, предварительный результат',
      professional: 'Профессиональный',
      professionalCopy: 'Подробный расчёт с расширенными параметрами',
      unavailable: 'Профессиональный режим сейчас недоступен.',
      migration: {
        title: 'Калькулятор переехал',
        copy: 'Открываем единый профессиональный калькулятор YOURENERGY.',
        action: 'Открыть профессиональный режим'
      }
    },
    en: {
      eyebrow: 'Solar calculator',
      title: 'See your solar potential',
      label: 'Calculator mode',
      quick: 'Quick & Easy',
      quickCopy: '2 steps, preliminary result',
      professional: 'Professional',
      professionalCopy: 'Detailed calculation with advanced parameters',
      unavailable: 'Professional mode is temporarily unavailable.',
      migration: {
        title: 'The calculator has moved',
        copy: 'Opening the unified YOURENERGY Professional calculator.',
        action: 'Open Professional mode'
      }
    }
  });
  const localizedLanguageNames = Object.freeze({
    hy: Object.freeze({ hy: 'Հայերեն', ru: 'Ռուսերեն', en: 'Անգլերեն' }),
    ru: Object.freeze({ hy: 'Армянский', ru: 'Русский', en: 'Английский' }),
    en: Object.freeze({ hy: 'Armenian', ru: 'Russian', en: 'English' })
  });

  // Hero values use the same environment domain helper as SolarAnalysis. They
  // are an explicitly labelled illustration, not hand-tuned marketing numbers.
  const createHeroContent = (content) => {
    const example = content.hero?.dashboardExample;
    const environmental = buildEnvironmentalImpact({
      annualGenerationKwh: example?.annualGenerationKwh,
      gridEmissionFactor: ARMENIA_GRID_CO2_FACTOR,
      treeEquivalency: EPA_URBAN_TREE_CO2_EQUIVALENCY,
      at: new Date('2026-09-08T00:00:00.000Z')
    });
    const co2Tons = environmental.avoidedCo2Tons;
    const treeEquivalent = environmental.treeEquivalent;
    const locale = runtimeLocales[content.locale];
    return {
      ...content.hero,
      dashboardExample: {
        ...example,
        co2Tons,
        co2Display:
          co2Tons === null
            ? '—'
            : new Intl.NumberFormat(locale, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
              }).format(co2Tons),
        treeEquivalent,
        trees: treeEquivalent === null ? null : Math.round(treeEquivalent)
      }
    };
  };

  const createLanguageLinks = (currentLocale) =>
    GENERATED_CONTENT_LOCALES.filter(({ key }) => key !== currentLocale).map(({ key, path }) => ({
      href: path,
      hreflang: key,
      label: languageLabels[key],
      name: localizedLanguageNames[currentLocale][key]
    }));

  const toolPath = pagePath;
  const professionalShellPath = (locale) =>
    locale === 'hy' ? '/calculator/pro/shell.html' : `/${locale}/calculator/pro/shell.html`;
  const faqPath = (locale) => toolPath(locale, 'faq');
  const contentPagePath = pagePath;
  const projectCasePath = (locale, slug) => pagePath(locale, `projects/${slug}`);
  const createToolAlternateLinks = (type) =>
    Object.freeze([
      ...GENERATED_CONTENT_LOCALES.map(({ key }) => ({
        hreflang: key,
        href: `${origin}${toolPath(key, type)}`
      })),
      { hreflang: 'x-default', href: `${origin}${toolPath('hy', type)}` }
    ]);
  const createToolLanguageLinks = (currentLocale, type) =>
    GENERATED_CONTENT_LOCALES.filter(({ key }) => key !== currentLocale).map(({ key }) => ({
      href: toolPath(key, type),
      hreflang: key,
      label: languageLabels[key],
      name: localizedLanguageNames[currentLocale][key]
    }));
  const createProfessionalCalculatorLanguageLinks = (currentLocale) =>
    GENERATED_CONTENT_LOCALES.filter(({ key }) => key !== currentLocale).map(({ key }) => ({
      href: `${toolPath(key, 'calculator')}?mode=pro`,
      hreflang: key,
      label: languageLabels[key],
      name: localizedLanguageNames[currentLocale][key]
    }));
  const createContentPageAlternateLinks = (type) =>
    Object.freeze([
      ...GENERATED_CONTENT_LOCALES.map(({ key }) => ({
        hreflang: key,
        href: `${origin}${contentPagePath(key, type)}`
      })),
      { hreflang: 'x-default', href: `${origin}${contentPagePath('hy', type)}` }
    ]);
  const createContentPageLanguageLinks = (currentLocale, type) =>
    GENERATED_CONTENT_LOCALES.filter(({ key }) => key !== currentLocale).map(({ key }) => ({
      href: contentPagePath(key, type),
      hreflang: key,
      label: languageLabels[key],
      name: localizedLanguageNames[currentLocale][key]
    }));
  const createBlogAlternateLinks = (slug = null) =>
    Object.freeze([
      ...GENERATED_CONTENT_LOCALES.map(({ key }) => ({
        hreflang: key,
        href: `${origin}${slug ? getBlogPath(key, slug) : contentPagePath(key, 'blog')}`
      })),
      { hreflang: 'x-default', href: `${origin}${slug ? getBlogPath('hy', slug) : '/blog/'}` }
    ]);
  const createBlogLanguageLinks = (currentLocale, slug = null) =>
    GENERATED_CONTENT_LOCALES.filter(({ key }) => key !== currentLocale).map(({ key }) => ({
      href: slug ? getBlogPath(key, slug) : contentPagePath(key, 'blog'),
      hreflang: key,
      label: languageLabels[key],
      name: localizedLanguageNames[currentLocale][key]
    }));
  const createProjectCaseAlternateLinks = (slug) =>
    Object.freeze([
      ...GENERATED_CONTENT_LOCALES.map(({ key }) => ({
        hreflang: key,
        href: `${origin}${projectCasePath(key, slug)}`
      })),
      { hreflang: 'x-default', href: `${origin}${projectCasePath('hy', slug)}` }
    ]);
  const createProjectCaseLanguageLinks = (currentLocale, slug) =>
    GENERATED_CONTENT_LOCALES.filter(({ key }) => key !== currentLocale).map(({ key }) => ({
      href: projectCasePath(key, slug),
      hreflang: key,
      label: languageLabels[key],
      name: localizedLanguageNames[currentLocale][key]
    }));
  const escapeJsonForHtml = (value) =>
    JSON.stringify(value)
      .replaceAll('<', '\\u003c')
      .replaceAll('>', '\\u003e')
      .replaceAll('&', '\\u0026')
      .replaceAll('\u2028', '\\u2028')
      .replaceAll('\u2029', '\\u2029');

  const createJsonLd = (content, { includeFaq = true } = {}) => {
    const canonical = `https://yourenergy.am${content.path}`;
    const serviceName =
      content.locale === 'hy'
        ? 'Արևային համակարգի նախնական վերլուծություն'
        : content.locale === 'ru'
          ? 'Предварительный анализ солнечной системы'
          : 'Preliminary solar-system analysis';

    const graph = [
      {
        '@type': 'WebSite',
        '@id': 'https://yourenergy.am/#website',
        name: 'YOURENERGY',
        url: 'https://yourenergy.am/'
      },
      {
        '@type': 'Organization',
        '@id': 'https://yourenergy.am/#organization',
        name: 'Your Energy LLC',
        alternateName: 'YOURENERGY',
        url: 'https://yourenergy.am/',
        telephone: content.contact.phone
      },
      {
        '@type': 'Service',
        '@id': `${canonical}#service`,
        name: serviceName,
        serviceType: serviceName,
        description: content.meta.serviceDescription ?? content.meta.description,
        url: canonical,
        provider: { '@id': 'https://yourenergy.am/#organization' },
        areaServed: { '@type': 'Country', name: 'Armenia' }
      }
    ];

    // TODO(owner): provide one confirmed, structured street/locality/region
    // address before adding a PostalAddress to Organization JSON-LD. The supplied
    // free-form contact text contains multiple place labels, so splitting it here
    // would create unverified structured business data.

    if (includeFaq) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: content.faq.items.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer }
        }))
      });
    }

    return {
      '@context': 'https://schema.org',
      '@graph': graph
    };
  };

  const createPageConfig = (content, extra = {}) => ({
    locale: runtimeLocales[content.locale],
    status: content.status,
    product: {
      ...content.product,
      passport: { months: content.passport.months }
    },
    map: {
      image: '/images/roof-scan-768.webp',
      tileUrl: publicEnv.VITE_MAP_TILE_URL?.trim() || DEFAULT_OSM_TILE_URL,
      tileAttribution: publicEnv.VITE_MAP_ATTRIBUTION?.trim() || DEFAULT_OSM_TILE_ATTRIBUTION,
      imageryTileUrl: publicEnv.VITE_MAP_IMAGERY_TILE_URL?.trim() || DEFAULT_SATELLITE_TILE_URL,
      imageryTileAttribution:
        publicEnv.VITE_MAP_IMAGERY_ATTRIBUTION?.trim() || DEFAULT_SATELLITE_TILE_ATTRIBUTION
    },
    endpoints: {
      geocode: sameOriginPath(publicEnv.VITE_GEOCODING_ENDPOINT, '/api/geocode'),
      potential: sameOriginPath(publicEnv.VITE_POTENTIAL_ENDPOINT, '/api/potential'),
      analysis: sameOriginPath(publicEnv.VITE_ANALYSIS_ENDPOINT, '/api/analysis'),
      quickAnalysis: sameOriginPath(publicEnv.VITE_QUICK_ANALYSIS_ENDPOINT, '/api/quick-analysis')
    },
    ...extra
  });

  const headerNavigationKeys = Object.freeze([
    'home',
    'calculator',
    'projects',
    'process',
    'equipment',
    'contacts',
    'about',
    'blog'
  ]);

  const createHeaderNavigationState = (activeKey = null) =>
    Object.fromEntries(
      headerNavigationKeys.map((key) => [key, key === activeKey ? 'is-active' : ''])
    );

  const createHomeContext = (content, { pageKind = 'home' } = {}) => {
    const hero = createHeroContent(content);
    const calculatorHref = toolPath(content.locale, 'calculator');
    const faqHref = faqPath(content.locale);
    const projectsHref = contentPagePath(content.locale, 'projects');
    const contactsHref = contentPagePath(content.locale, 'contacts');
    const isHome = pageKind === 'home';
    const activeNavigation = createHeaderNavigationState(
      pageKind === 'home' ? 'home' : pageKind === 'calculator' ? 'calculator' : null
    );
    const homeSectionHref = (href) =>
      !isHome && href.startsWith('#') ? `${content.homeHref}${href}` : href;
    const processCopy = processStoryCopy[content.locale];
    const processStory = {
      ...processCopy,
      regions: ARMENIA_REGIONAL_BENCHMARKS.map(({ id }) => ({
        id,
        label: regionLabels[content.locale][id]
      })),
      steps: processCopy.steps.map((step, index) => {
        const timelineLength = step.timeline?.length ?? 0;
        const installationIcons = [
          'file-text',
          'faq-home',
          'faq-settings',
          'file-text',
          'wrench',
          'shield-check'
        ];

        return {
          ...step,
          index,
          image: createProcessImageContext(step.visual),
          headlineLines: step.headline.split('\n'),
          stateClass: index === 0 ? 'is-active' : '',
          ariaHidden: index === 0 ? 'false' : 'true',
          progressClass: index === 0 ? 'is-active' : 'is-future',
          isAnalysis: index === 0,
          isInspection: index === 1,
          isDesign: index === 2,
          isProposal: index === 3,
          isInstallation: index === 4,
          isSupport: index === 5,
          designPanels: index === 2 ? Array.from({ length: 12 }, (_, panel) => panel) : null,
          installPanels: index === 4 ? Array.from({ length: 9 }, (_, panel) => panel) : null,
          timeline: step.timeline?.map((timelineStep, timelineIndex) => ({
            ...timelineStep,
            icon: installationIcons[timelineIndex] ?? 'check',
            isCurrent: timelineIndex === timelineLength - 2,
            isComplete: timelineIndex === timelineLength - 1,
            timelineClass:
              timelineIndex === timelineLength - 1
                ? 'is-complete'
                : timelineIndex === timelineLength - 2
                  ? 'is-current'
                  : ''
          }))
        };
      })
    };

    return {
      ...content,
      hero,
      currentLanguageLabel: content.locale === 'hy' ? 'AM' : content.locale.toUpperCase(),
      activeNavigation,
      calculatorHref,
      faqHref,
      contactsHref,
      headerCtaHref: calculatorHref,
      headerCtaLabel: content.common.headerCta,
      navLinks: {
        home: content.homeHref,
        calculator: calculatorHref,
        projects: projectsHref,
        process: homeSectionHref('#process'),
        equipment: toolPath(content.locale, 'equipment'),
        contacts: contactsHref,
        about: contentPagePath(content.locale, 'about'),
        blog: contentPagePath(content.locale, 'blog')
      },
      alternateLinks: publishedAlternateLinks,
      languageLinks: createLanguageLinks(content.locale),
      processStory,
      footer: {
        ...content.footer,
        columns: content.footer.columns.map((column) => ({
          ...column,
          links: column.links.map(([label, href]) => [
            label,
            href === '#calculator'
              ? calculatorHref
              : href === '#faq'
                ? faqHref
                : !isHome && href.startsWith('#')
                  ? `${content.homeHref}${href}`
                  : href
          ])
        }))
      },
      projects: {
        ...content.projects,
        allHref: projectsHref,
        discussHref: contactsHref,
        items: content.projects.items.map((item) => ({
          ...item,
          avifSrcset: `/images/${item.image}-480.avif 480w, /images/${item.image}-800.avif 800w`,
          webpSrcset: `/images/${item.image}-480.webp 480w, /images/${item.image}-800.webp 800w`,
          imageSizes: '(max-width: 720px) 82vw, (max-width: 1100px) 44vw, 22vw',
          illustrativeLabel: content.common.illustrative,
          href: projectsHref
        }))
      },
      faq: {
        ...content.faq,
        previewItems: content.faq.previewItems ?? content.faq.items.slice(0, 4)
      },
      jsonLd: escapeJsonForHtml(createJsonLd(content, { includeFaq: false })),
      homePageConfig: escapeJsonForHtml({
        locale: runtimeLocales[content.locale],
        hero
      }),
      processPageConfig: escapeJsonForHtml({
        locale: runtimeLocales[content.locale],
        processStory
      })
    };
  };

  const createProjectsPageContext = (content) => {
    const path = contentPagePath(content.locale, 'projects');
    const base = createHomeContext(content, { pageKind: 'projects' });
    const copy = projectsPageCopy[content.locale];
    if (!copy) throw new Error(`Missing projects page content for ${content.locale}.`);
    const metricsIcons = ['zap', 'chart-bars', 'leaf'];

    return {
      ...base,
      path,
      meta: copy.meta,
      activeNavigation: createHeaderNavigationState('projects'),
      alternateLinks: createContentPageAlternateLinks('projects'),
      languageLinks: createContentPageLanguageLinks(content.locale, 'projects'),
      projectsPage: {
        ...copy,
        videoSrc: sameOriginPath(publicEnv.VITE_PROJECTS_HERO_VIDEO, ''),
        contactHref: base.navLinks.contacts,
        featuredHref: projectCasePath(content.locale, FEATURED_PROJECT_CASE_SLUG),
        items: copy.gallery.map((item, index) => ({
          ...item,
          tagIcon: index === 3 ? 'chart-bars' : index === 5 ? 'leaf' : 'faq-home',
          action: copy.featured.action,
          href: projectCasePath(content.locale, GALLERY_PROJECT_CASE_SLUGS[index]),
          imageAlt: `${item.title}, ${item.city}`,
          avifSrcset: `/images/${item.image}-480.avif 480w, /images/${item.image}-800.avif 800w`,
          webpSrcset: `/images/${item.image}-480.webp 480w, /images/${item.image}-800.webp 800w`,
          metrics: item.metrics.map((value, metricIndex) => ({
            icon: metricsIcons[metricIndex],
            value
          }))
        }))
      }
    };
  };

  const createProjectCaseContext = (content, slug) => {
    const galleryCaseIndex = GALLERY_PROJECT_CASE_SLUGS.indexOf(slug);
    const galleryItem =
      galleryCaseIndex === -1 ? null : projectsPageCopy[content.locale]?.gallery[galleryCaseIndex];
    const galleryCopy = galleryProjectCaseCopy[content.locale];
    const copy =
      PROJECT_CASES[slug]?.[content.locale] ??
      (galleryItem && galleryCopy
        ? {
            ...galleryCopy,
            slug,
            meta: {
              title: `${galleryItem.title} | YOURENERGY`,
              description: `${galleryCopy.metaDescription}: ${galleryItem.title}.`,
              ogTitle: `${galleryItem.title} | YOURENERGY`,
              ogDescription: galleryCopy.intro
            },
            category: galleryItem.tag,
            location: galleryItem.city,
            title: galleryItem.title,
            image: galleryItem.image,
            imageAlt: `${galleryItem.title}, ${galleryItem.city}`,
            metrics: projectsPageCopy[content.locale].featured.metrics.map((metric, index) => ({
              ...metric,
              value: galleryItem.metrics[index]
            }))
          }
        : null);
    if (!copy) throw new Error(`Missing project case content for ${slug} in ${content.locale}.`);
    const path = projectCasePath(content.locale, slug);
    const base = createHomeContext(content, { pageKind: 'projects' });

    return {
      ...base,
      path,
      meta: copy.meta,
      activeNavigation: createHeaderNavigationState('projects'),
      alternateLinks: createProjectCaseAlternateLinks(slug),
      languageLinks: createProjectCaseLanguageLinks(content.locale, slug),
      projectCase: {
        ...copy,
        image: copy.image ?? 'project-arabkir',
        avifSrcset: `/images/${copy.image ?? 'project-arabkir'}-480.avif 480w, /images/${copy.image ?? 'project-arabkir'}-800.avif 800w`,
        webpSrcset: `/images/${copy.image ?? 'project-arabkir'}-480.webp 480w, /images/${copy.image ?? 'project-arabkir'}-800.webp 800w`,
        projectsHref: contentPagePath(content.locale, 'projects'),
        calculatorHref: toolPath(content.locale, 'calculator')
      }
    };
  };

  const createFaqContext = (content) => {
    const path = faqPath(content.locale);
    const base = createHomeContext(content, { pageKind: 'faq' });
    return {
      ...base,
      path,
      faqHref: path,
      meta: content.faq.meta,
      alternateLinks: createToolAlternateLinks('faq'),
      languageLinks: createToolLanguageLinks(content.locale, 'faq'),
      jsonLd: escapeJsonForHtml(createJsonLd({ ...content, path }))
    };
  };

  const equipmentMeta = Object.freeze({
    hy: {
      ogTitle: 'Սարքավորումներ | YOURENERGY',
      description:
        'YOURENERGY-ի արևային վահանակներ, ինվերտորներ, կուտակիչներ և մոնտաժային համակարգեր։'
    },
    ru: {
      ogTitle: 'Оборудование | YOURENERGY',
      description: 'Оборудование YOURENERGY: солнечные панели, инверторы и аккумуляторные системы.'
    },
    en: {
      ogTitle: 'Equipment | YOURENERGY',
      description: 'YOURENERGY equipment: solar panels, inverters, batteries and mounting systems.'
    }
  });

  const EQUIPMENT_CATEGORY_ICONS = Object.freeze({
    'solar-panels': 'sun',
    'grid-inverters': 'zap',
    inverters: 'zap',
    microinverters: 'zap',
    batteries: 'cycle',
    'home-ess': 'faq-home',
    'commercial-ess': 'chart-bars',
    'ev-chargers': 'zap',
    mounting: 'solar-mount',
    monitoring: 'satellite',
    'system-components': 'faq-settings'
  });

  const labelEquipmentSpec = (key, locale) =>
    SPEC_LABELS[key]?.[locale] ??
    key.replace(/([a-z])([A-Z])/gu, '$1 $2').replace(/^./u, (letter) => letter.toUpperCase());

  const createEquipmentSsrContent = (locale) => {
    const catalog = createEquipmentCatalog(locale);
    const initialProduct = catalog.products.find(({ id }) => id);
    if (!initialProduct) throw new Error(`Equipment catalog has no products for ${locale}.`);

    const categoryProducts = catalog.products.filter(
      ({ category }) => category === initialProduct.category
    );
    const warrantyItems = initialProduct.highlights.filter(({ label }) => isWarrantyLabel(label));
    if (
      initialProduct.specs?.warranty &&
      !warrantyItems.some(({ value }) => value === initialProduct.specs.warranty)
    ) {
      warrantyItems.push({
        label: EQUIPMENT_COPY[locale].product.manufacturerWarranty,
        value: initialProduct.specs.warranty
      });
    }

    return {
      heroBackground: catalog.hero.background,
      categories: catalog.categories.map((category) => {
        const products = catalog.products.filter(({ category: id }) => id === category.id);
        return {
          ...category,
          icon: EQUIPMENT_CATEGORY_ICONS[category.id] ?? 'sun',
          productCount: products.length ? formatProductCount(products.length, locale) : '',
          isAvailable: Boolean(category.enabled && products.length),
          isSelected: category.id === initialProduct.category
        };
      }),
      categoryProducts: categoryProducts.map((product) => ({
        ...product,
        isSelected: product.id === initialProduct.id
      })),
      initialProduct: {
        ...initialProduct,
        brandData: initialProduct.brand.toLowerCase(),
        benefits:
          initialProduct.benefits?.length > 0 ? initialProduct.benefits : initialProduct.hotspots,
        specificationEntries: Object.entries(initialProduct.specs).map(([key, value]) => ({
          label: labelEquipmentSpec(key, locale),
          value
        })),
        warrantyItems,
        hasWarrantyItems: warrantyItems.length > 0,
        documentCount: `${initialProduct.documents.length} PDF`
      }
    };
  };

  const createEquipmentContext = (content) => {
    const path = toolPath(content.locale, 'equipment');
    const base = createHomeContext(content, { pageKind: 'equipment' });
    return {
      ...base,
      path,
      activeNavigation: createHeaderNavigationState('equipment'),
      alternateLinks: createToolAlternateLinks('equipment'),
      languageLinks: createToolLanguageLinks(content.locale, 'equipment'),
      equipmentMeta: equipmentMeta[content.locale],
      equipmentCopy: EQUIPMENT_COPY[content.locale],
      equipmentSsr: createEquipmentSsrContent(content.locale)
    };
  };

  const createProfessionalCalculatorContext = (content) => {
    const calculatorMeta = toolCopy[content.locale]?.calculatorMeta;
    const wizard = wizardCopy[content.locale];
    const modeCopy = calculatorModes[content.locale];
    if (!calculatorMeta) throw new Error(`Missing calculator metadata for ${content.locale}.`);
    if (!wizard) throw new Error(`Missing calculator wizard copy for ${content.locale}.`);

    const path = toolPath(content.locale, 'calculator/pro');
    const base = createHomeContext(content, { pageKind: 'calculator' });
    return {
      ...base,
      path,
      meta: modeCopy.proMeta ?? calculatorMeta,
      wizard: { ...wizard, ...modeCopy.pro },
      quick: modeCopy.quick,
      modeControl: calculatorModeControl[content.locale],
      professionalHref: `${toolPath(content.locale, 'calculator')}?mode=pro`,
      alternateLinks: createToolAlternateLinks('calculator/pro'),
      languageLinks: createProfessionalCalculatorLanguageLinks(content.locale),
      toolShared: toolCopy[content.locale].shared,
      calculatorHref: toolPath(content.locale, 'calculator'),
      pageConfig: escapeJsonForHtml(
        createPageConfig(content, { wizard: { ...wizard, ...modeCopy.pro } })
      ),
      jsonLd: escapeJsonForHtml(createJsonLd({ ...content, path }, { includeFaq: false }))
    };
  };

  const createQuickCalculatorContext = (content) => {
    const modeCopy = calculatorModes[content.locale];
    const wizard = wizardCopy[content.locale];
    const path = toolPath(content.locale, 'calculator');
    const base = createHomeContext(content, { pageKind: 'calculator' });
    return {
      ...base,
      path,
      meta: modeCopy.quickMeta,
      quick: modeCopy.quick,
      modeControl: calculatorModeControl[content.locale],
      // Visitors are already at the calculator, so the header CTA should move
      // them forward to a conversation instead of pointing back to this page.
      headerCtaHref: base.navLinks.contacts,
      headerCtaLabel: content.projects.discuss,
      regions: ARMENIA_REGIONAL_BENCHMARKS.map((region) => ({
        id: region.id,
        label: regionLabels[content.locale][region.id]
      })),
      professionalHref: `${toolPath(content.locale, 'calculator')}?mode=pro`,
      professionalShellHref: professionalShellPath(content.locale),
      alternateLinks: createToolAlternateLinks('calculator'),
      languageLinks: createToolLanguageLinks(content.locale, 'calculator'),
      toolShared: toolCopy[content.locale].shared,
      pageConfig: escapeJsonForHtml(
        createPageConfig(content, {
          quick: modeCopy.quick,
          wizard: { ...wizard, ...modeCopy.pro },
          modeControl: calculatorModeControl[content.locale],
          tariffRegistry: {
            revision: ARMENIA_TARIFF_DATASET.revision,
            records: ARMENIA_TARIFF_DATASET.records.map(
              ({ id, customerType, minMonthlyKwh, maxMonthlyKwh, dayRate, nightRate }) => ({
                id,
                customerType,
                minMonthlyKwh,
                maxMonthlyKwh,
                dayRate,
                nightRate
              })
            )
          }
        })
      ),
      jsonLd: escapeJsonForHtml(createJsonLd({ ...content, path }, { includeFaq: false }))
    };
  };

  const createRefineCalculatorContext = (content) => {
    const modeControl = calculatorModeControl[content.locale];
    const path = toolPath(content.locale, 'calculator/refine');
    const base = createHomeContext(content, { pageKind: 'calculator' });
    return {
      ...base,
      path,
      meta: { title: modeControl.migration.title, description: modeControl.migration.copy },
      migration: modeControl.migration,
      calculatorHref: toolPath(content.locale, 'calculator'),
      professionalHref: `${toolPath(content.locale, 'calculator')}?mode=pro`,
      redirectHref: `${toolPath(content.locale, 'calculator')}?mode=pro`
    };
  };

  const createProfessionalMigrationContext = (content) => {
    const modeControl = calculatorModeControl[content.locale];
    const base = createHomeContext(content, { pageKind: 'calculator' });
    return {
      ...base,
      path: toolPath(content.locale, 'calculator/pro'),
      migration: modeControl.migration,
      calculatorHref: toolPath(content.locale, 'calculator'),
      professionalHref: `${toolPath(content.locale, 'calculator')}?mode=pro`,
      redirectHref: `${toolPath(content.locale, 'calculator')}?mode=pro`
    };
  };

  const createContactsContext = (content) => {
    const path = contentPagePath(content.locale, 'contacts');
    const sourceContactPage = contactPageCopy[content.locale];
    if (!sourceContactPage) throw new Error(`Missing contact-page content for ${content.locale}.`);
    const contactPage = sourceContactPage;
    return {
      ...createHomeContext(content, { pageKind: 'contacts' }),
      path,
      privacyHref: toolPath(content.locale, 'privacy'),
      activeNavigation: createHeaderNavigationState('contacts'),
      alternateLinks: createContentPageAlternateLinks('contacts'),
      languageLinks: createContentPageLanguageLinks(content.locale, 'contacts'),
      contactPage,
      contactPageConfig: escapeJsonForHtml({
        locale: runtimeLocales[content.locale],
        copy: {
          invalid: contactPage.invalid,
          sending: contactPage.sending,
          unavailable: contactPage.unavailable,
          meeting: contactPage.meeting
        }
      })
    };
  };

  const createAboutContext = (content) => {
    const aboutPage = aboutPageCopy[content.locale];
    if (!aboutPage) throw new Error(`Missing About page copy for ${content.locale}.`);

    return {
      ...createHomeContext(content, { pageKind: 'about' }),
      path: contentPagePath(content.locale, 'about'),
      meta: aboutPage.meta,
      activeNavigation: createHeaderNavigationState('about'),
      alternateLinks: createContentPageAlternateLinks('about'),
      languageLinks: createContentPageLanguageLinks(content.locale, 'about'),
      aboutPage
    };
  };

  const createBlogArticleJsonLd = (article, content) =>
    escapeJsonForHtml({
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${origin}${article.path}#article`,
      headline: article.h1,
      description: article.description,
      image: [`${origin}${article.image}`],
      dateModified: article.verifiedDateIso,
      inLanguage: runtimeLocales[content.locale],
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${origin}${article.path}` },
      author: { '@type': 'Organization', name: 'YOURENERGY' },
      publisher: { '@type': 'Organization', name: 'YOURENERGY', url: origin }
    });

  const createBlogIndexContext = (content, articles) => {
    const localeArticles = articles.map((article, index) => ({
      ...article[content.locale],
      number: String(index + 1)
    }));
    const categories = localeArticles.map((article) => ({
      key: article.categoryKey,
      label: article.category
    }));
    return {
      ...createHomeContext(content, { pageKind: 'blog' }),
      path: contentPagePath(content.locale, 'blog'),
      blogCopy: BLOG_COPY[content.locale],
      featured: localeArticles[0],
      articles: localeArticles,
      categories,
      calculatorHref: toolPath(content.locale, 'calculator'),
      activeNavigation: createHeaderNavigationState('blog'),
      alternateLinks: createBlogAlternateLinks(),
      languageLinks: createBlogLanguageLinks(content.locale)
    };
  };

  const createBlogArticleContext = (content, article, articles) => {
    const localizedArticle = article[content.locale];
    return {
      ...createHomeContext(content, { pageKind: 'blog' }),
      blogHref: contentPagePath(content.locale, 'blog'),
      blogCopy: BLOG_COPY[content.locale],
      article: localizedArticle,
      calculatorHref: toolPath(content.locale, 'calculator'),
      relatedArticles: articles
        .filter((candidate) => candidate[content.locale].slug !== localizedArticle.slug)
        .slice(0, 2)
        .map((candidate) => candidate[content.locale]),
      activeNavigation: createHeaderNavigationState('blog'),
      alternateLinks: createBlogAlternateLinks(localizedArticle.slug),
      languageLinks: createBlogLanguageLinks(content.locale, localizedArticle.slug),
      articleJsonLd: createBlogArticleJsonLd(localizedArticle, content)
    };
  };

  const homeContent = { hy, ru, en };
  const blogArticles = pages
    .filter(({ kind, locale }) => kind === 'blog-article' && locale === 'hy')
    .map(({ article }) => article);
  const contexts = {
    home: createHomeContext,
    blog: (content) => createBlogIndexContext(content, blogArticles),
    'blog-article': (content, page) =>
      createBlogArticleContext(content, page.article, blogArticles),
    faq: createFaqContext,
    equipment: createEquipmentContext,
    calculator: createQuickCalculatorContext,
    'calculator-shell': createProfessionalCalculatorContext,
    'calculator-pro': createProfessionalMigrationContext,
    'calculator-refine': createRefineCalculatorContext,
    projects: createProjectsPageContext,
    'project-case': (content, page) => createProjectCaseContext(content, page.slug),
    about: createAboutContext,
    contacts: createContactsContext
  };
  return (page) => {
    const content = homeContent[page.locale];
    if (!content) throw new Error(`Missing content for ${page.file}`);
    if (page.kind === 'privacy' || page.kind === 'terms') {
      const document = legalDocuments[page.kind][page.locale];
      if (!document) throw new Error(`Missing ${page.kind} document for ${page.locale}.`);
      return {
        ...createHomeContext(content, { pageKind: 'support' }),
        path: page.path,
        title: document.title,
        document,
        alternateLinks: createToolAlternateLinks(page.kind),
        languageLinks: createToolLanguageLinks(page.locale, page.kind)
      };
    }
    const createContext = contexts[page.kind];
    if (!createContext) throw new Error(`Missing context builder for ${page.file}`);
    return createContext(content, page);
  };
};
