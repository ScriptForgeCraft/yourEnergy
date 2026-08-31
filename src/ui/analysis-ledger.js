const text = (value) =>
  value === null || value === undefined || value === '' ? '—' : String(value);

const sourceLabel = (key, sources) => {
  const aliases = {
    property: 'location',
    production: 'solar',
    investment: 'investment',
    pricebook: 'pricebook'
  };
  return sources[aliases[key] ?? key] ?? sources.unavailable ?? key;
};

const row = (term, definition) => {
  const wrapper = document.createElement('div');
  const dt = document.createElement('dt');
  const dd = document.createElement('dd');
  dt.textContent = text(term);
  dd.textContent = text(definition);
  wrapper.append(dt, dd);
  return wrapper;
};

/** Renders only source metadata returned by the real analysis API. */
export const renderAnalysisLedger = ({ root, analysis, strings } = {}) => {
  if (!root || !analysis) return;
  const list = root.querySelector('[data-analysis-ledger-list]');
  const assumptions = root.querySelector('[data-analysis-assumptions]');
  const confidence = root.querySelector('[data-analysis-confidence]');
  const confidenceDetail = root.querySelector('[data-analysis-confidence-detail]');

  list?.replaceChildren();
  const sources = Array.isArray(analysis.sourceLedger) ? analysis.sourceLedger : [];
  sources.forEach((source) => {
    const sourceDetails = source.source ?? {};
    const label = sourceLabel(source.key, strings.sources ?? {});
    const detail =
      source.key === 'tariff' && sourceDetails.kind === 'manual'
        ? strings.sources?.userTariff
        : [sourceDetails.provider, sourceDetails.reference, sourceDetails.verifiedAt]
            .filter(Boolean)
            .join(' · ');
    list?.append(row(label, detail || strings.sources.unavailable));
  });

  assumptions?.replaceChildren();
  (analysis.assumptions ?? []).forEach((assumption) => {
    const item = document.createElement('li');
    item.textContent = text(strings.assumptions?.[assumption] ?? assumption);
    assumptions?.append(item);
  });

  const level = analysis.confidence?.level ?? 'unavailable';
  if (confidence) {
    confidence.textContent = strings.confidence?.[level] ?? strings.confidence?.insufficient ?? '—';
  }
  if (confidenceDetail) {
    const missing = Array.isArray(analysis.confidence?.missing) ? analysis.confidence.missing : [];
    const score = analysis.confidence?.score;
    const maximum = analysis.confidence?.maximumScore;
    const scoreText =
      Number.isFinite(score) && Number.isFinite(maximum) ? `${score}/${maximum}` : '';
    const missingText = missing.map((key) => sourceLabel(key, strings.sources ?? {})).join(' · ');
    confidenceDetail.textContent = [scoreText, missingText].filter(Boolean).join(' · ');
  }

  root.hidden = false;
};
