const numericText = (value) =>
  Number.isFinite(Number(value)) ? String(Number(value)).replace(/\.0+$/u, '') : '';

/** Formats calculation provenance without restoring tariff choices in the UI. */
export const formatTariffProvenance = ({
  tariff,
  strings = {},
  rate,
  formatRate = numericText
} = {}) => {
  const resolvedRate = rate ?? tariff?.rateAmdPerKwh;
  if (resolvedRate === null || resolvedRate === undefined) return strings.noTariff ?? '';
  const label =
    tariff?.kind === 'user' || tariff?.tariffSource === 'user-provided-effective-rate'
      ? (strings.userProvidedEffectiveRate ?? 'User-provided effective tariff')
      : (strings.automaticStandardTariff ?? 'Automatic standard residential tariff');
  return [label, `${formatRate(resolvedRate)} AMD/kWh`].filter(Boolean).join(' · ');
};
