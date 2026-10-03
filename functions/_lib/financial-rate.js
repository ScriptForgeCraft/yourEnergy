import {
  ARMENIA_TARIFF_DATASET,
  FINANCIAL_RATE_SOURCE_TYPES,
  createAutomaticStandardResidentialTariff,
  createAutomaticStandardResidentialTariffProfile,
  createBillDerivedTariffSelection,
  createStandardResidentialTariffFromActualDayNight,
  createUserTariffSelection,
  normalizeConsumption
} from '../../src/domain/index.js';
import { ApiError } from './http.js';

const requestFinancialRate = (body) => {
  const current = body?.financialRate;
  if (current && typeof current === 'object' && !Array.isArray(current)) return current;
  const legacy = body?.tariff;
  if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) {
    return { sourceType: FINANCIAL_RATE_SOURCE_TYPES.STANDARD };
  }
  if (typeof legacy.sourceType === 'string') return legacy;
  if (legacy.actualDayKwh !== undefined || legacy.actualNightKwh !== undefined) {
    return { ...legacy, sourceType: FINANCIAL_RATE_SOURCE_TYPES.ACTUAL_DAY_NIGHT };
  }
  if (
    legacy.rateAmdPerKwh !== undefined &&
    legacy.rateAmdPerKwh !== null &&
    legacy.rateAmdPerKwh !== ''
  ) {
    return {
      sourceType: FINANCIAL_RATE_SOURCE_TYPES.CUSTOM_EFFECTIVE,
      effectiveRateAmdPerKwh: legacy.rateAmdPerKwh
    };
  }
  return { sourceType: FINANCIAL_RATE_SOURCE_TYPES.STANDARD };
};

const automaticStandard = (consumption, effectiveDate) =>
  Array.isArray(consumption.monthlyKwh)
    ? createAutomaticStandardResidentialTariffProfile(
        consumption.monthlyKwh,
        ARMENIA_TARIFF_DATASET,
        effectiveDate
      )
    : createAutomaticStandardResidentialTariff(
        consumption.averageMonthlyKwh,
        ARMENIA_TARIFF_DATASET,
        effectiveDate
      );

/**
 * Shared server-authoritative financial source resolver for both calculator
 * endpoints. Hidden browser values are ignored unless their source is active.
 */
export const resolveFinancialCalculation = (body, effectiveDate = new Date()) => {
  const request = requestFinancialRate(body);
  const sourceType = request.sourceType;
  const supported = new Set(Object.values(FINANCIAL_RATE_SOURCE_TYPES));
  if (!supported.has(sourceType)) throw new ApiError('INVALID_INPUT');

  const customSelection =
    sourceType === FINANCIAL_RATE_SOURCE_TYPES.CUSTOM_EFFECTIVE
      ? createUserTariffSelection(
          {
            rateAmdPerKwh: request.effectiveRateAmdPerKwh ?? request.rateAmdPerKwh
          },
          effectiveDate
        )
      : null;
  if (customSelection && !customSelection.available) throw new ApiError('INVALID_INPUT');

  const consumption = normalizeConsumption(body?.consumption, {
    tariff: customSelection,
    tariffDataset: ARMENIA_TARIFF_DATASET,
    effectiveDate
  });
  if (!consumption.available) throw new ApiError('INVALID_INPUT');

  let tariffSelection;
  if (sourceType === FINANCIAL_RATE_SOURCE_TYPES.BILL_DERIVED) {
    tariffSelection = createBillDerivedTariffSelection(
      {
        billAmd: body?.consumption?.averageMonthlyBillAmd,
        billedKwh: body?.consumption?.billedKwh
      },
      effectiveDate
    );
  } else if (sourceType === FINANCIAL_RATE_SOURCE_TYPES.CUSTOM_EFFECTIVE) {
    tariffSelection = customSelection;
  } else if (sourceType === FINANCIAL_RATE_SOURCE_TYPES.ACTUAL_DAY_NIGHT) {
    tariffSelection = createStandardResidentialTariffFromActualDayNight(
      consumption.averageMonthlyKwh,
      {
        dayKwh: request.actualDayKwh,
        nightKwh: request.actualNightKwh
      },
      ARMENIA_TARIFF_DATASET,
      effectiveDate
    );
  } else {
    tariffSelection = automaticStandard(consumption, effectiveDate);
  }

  if (!tariffSelection?.available) throw new ApiError('INVALID_INPUT');
  return { consumption, tariffSelection, sourceType };
};

export const __private__ = Object.freeze({ requestFinancialRate });
