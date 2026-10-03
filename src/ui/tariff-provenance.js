const numericText = (value) =>
  Number.isFinite(Number(value)) ? String(Number(value)).replace(/\.0+$/u, '') : '';

export const formatTariffBracket = ({ tariff, strings = {}, formatKwh = numericText } = {}) => {
  const minimum = tariff?.bracketMinMonthlyKwh ?? tariff?.minMonthlyKwh;
  const maximum = tariff?.bracketMaxMonthlyKwh ?? tariff?.maxMonthlyKwh;
  if (tariff?.accuracy === 'monthly-range' || Array.isArray(tariff?.monthlyTariffs)) {
    return strings.monthlyBracket ?? 'Band selected for each month';
  }
  if (maximum !== null && maximum !== undefined && Number(minimum) === 0) {
    return (strings.bracketUpTo ?? 'Up to {max} kWh/month').replace('{max}', formatKwh(maximum));
  }
  if (maximum !== null && maximum !== undefined) {
    return (strings.bracketBetween ?? '{min}–{max} kWh/month')
      .replace('{min}', formatKwh(Number(minimum)))
      .replace('{max}', formatKwh(maximum));
  }
  if (minimum !== null && minimum !== undefined) {
    return (strings.bracketAbove ?? 'Above {min} kWh/month').replace('{min}', formatKwh(minimum));
  }
  return '';
};

export const formatTariffRate = ({ tariff, formatRate = numericText } = {}) => {
  const effective = tariff?.effectiveRateAmdPerKwh ?? tariff?.rateAmdPerKwh;
  if (effective !== null && effective !== undefined) return `${formatRate(effective)} AMD/kWh`;
  const minimum = tariff?.minRateAmdPerKwh;
  const maximum = tariff?.maxRateAmdPerKwh;
  return minimum !== null && minimum !== undefined && maximum !== null && maximum !== undefined
    ? `${formatRate(minimum)}–${formatRate(maximum)} AMD/kWh`
    : '';
};

/** Formats calculation provenance without restoring tariff choices in the UI. */
export const formatTariffProvenance = ({
  tariff,
  strings = {},
  rate,
  formatRate = numericText
} = {}) => {
  const sourceType = tariff?.sourceType ?? tariff?.tariffSource;
  const isBillDerived =
    tariff?.kind === 'bill-derived' || sourceType === 'bill-derived-effective-rate';
  const isUser = tariff?.kind === 'user' || sourceType === 'user-provided-effective-rate';
  const isActualDayNight =
    sourceType === 'actual-day-night' || tariff?.accuracy === 'actual-day-night';
  const effectiveTariff =
    rate === null || rate === undefined ? tariff : { ...tariff, effectiveRateAmdPerKwh: rate };
  const rateText = formatTariffRate({ tariff: effectiveTariff, formatRate });
  if (!rateText) return strings.noTariff ?? '';
  const label = isBillDerived
    ? (strings.billDerivedRate ?? 'Average cost from your bill')
    : isUser
      ? (strings.userProvidedEffectiveRate ?? 'Entered average rate')
      : isActualDayNight
        ? (strings.actualDayNightRate ?? 'Actual day/night consumption')
        : (strings.automaticStandardTariff ?? 'Standard residential tariff');
  const bracket = isUser || isBillDerived ? '' : formatTariffBracket({ tariff, strings });
  return [label, bracket, rateText].filter(Boolean).join(' · ');
};
