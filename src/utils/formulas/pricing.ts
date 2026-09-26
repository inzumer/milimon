import {
  belowHundred,
  failure,
  nonNegative,
  percentOf,
  positive,
  success,
  sum,
  validate,
} from '@utils/calculation';
import type { CalculationResult } from '@utils/calculation';

/**
 * Fijación de precios (manual, Unidad 3).
 *
 * Costos no relacionados con la materia prima = sueldos + cargas sociales + alquiler + servicios
 *   + gastos generales + amortizaciones (inversión / meses de amortización).
 * Ganancia deseada neta = inversión × % retorno anual / 12 + retiro mensual.
 * Ganancia deseada bruta = ganancia neta / (1 − impuesto a las ganancias).
 * Coeficiente = 1 + (costos no MP + ganancia bruta) / costo de mercaderías consumidas.
 * Precio neto = costo estándar unitario × coeficiente.
 * Precio bruto (carta) = precio neto × (1 + IVA + IIBB + tarjetas + Seguridad e Higiene).
 *
 * El total de impuestos sale siempre del desglose, y la comisión de tarjetas se puede activar o no.
 */
export const DEFAULT_AMORTIZATION_MONTHS = 48;

export interface SalesTaxRates {
  vat: number;
  grossIncomeTax: number;
  cardFee: number;
  safetyHygiene: number;
}

/** Starting values for Argentina; everyone replaces them with their own. */
export const DEFAULT_SALES_TAX_RATES: Readonly<SalesTaxRates> = {
  vat: 21,
  grossIncomeTax: 3.5,
  cardFee: 4,
  safetyHygiene: 1,
};

export const DEFAULT_INCOME_TAX_RATE = 35;
export const DEFAULT_SOCIAL_CHARGES_RATE = 45;
export const DEFAULT_ANNUAL_RETURN_RATE = 30;

export const socialCharges = (salaries: number, rate: number): number => percentOf(salaries, rate);

export const amortization = (investment: number, months = DEFAULT_AMORTIZATION_MONTHS): number =>
  investment / months;

export const monthlyReturn = (investment: number, annualReturnRate: number): number =>
  percentOf(investment, annualReturnRate) / 12;

/** Gross (pre-tax) profit needed so that, after income tax, the net profit remains. */
export const grossUpForIncomeTax = (netProfit: number, incomeTaxRate: number): number =>
  netProfit / (1 - incomeTaxRate / 100);

export const pricingCoefficient = (
  nonRawMaterialCosts: number,
  grossProfit: number,
  costOfGoodsConsumed: number,
): number => 1 + (nonRawMaterialCosts + grossProfit) / costOfGoodsConsumed;

export const salesTaxTotal = (rates: SalesTaxRates, includeCardFee: boolean): number =>
  rates.vat + rates.grossIncomeTax + rates.safetyHygiene + (includeCardFee ? rates.cardFee : 0);

export const grossPrice = (netPrice: number, salesTaxRate: number): number =>
  netPrice * (1 + salesTaxRate / 100);

export interface PricingInput {
  salaries: number | null;
  socialChargesRate: number | null;
  rent: number | null;
  services: number | null;
  generalExpenses: number | null;
  investment: number | null;
  amortizationMonths: number | null;
  annualReturnRate: number | null;
  monthlyWithdrawal: number | null;
  incomeTaxRate: number | null;
  costOfGoodsConsumed: number | null;
  unitCost: number | null;
  vatRate: number | null;
  grossIncomeTaxRate: number | null;
  cardFeeRate: number | null;
  safetyHygieneRate: number | null;
  includeCardFee: boolean;
}

export interface PricingOutput {
  socialCharges: number;
  amortization: number;
  nonRawMaterialCosts: number;
  monthlyReturn: number;
  netProfit: number;
  grossProfit: number;
  coefficient: number;
  netPrice: number;
  salesTaxRate: number;
  grossPrice: number;
}

export type PricingField = Exclude<keyof PricingInput, 'includeCardFee'>;

export const calculatePricing = (
  input: PricingInput,
): CalculationResult<PricingOutput, PricingField> => {
  const { includeCardFee, ...numbers } = input;
  const { errors, values } = validate<PricingField>(numbers, {
    salaries: [nonNegative],
    socialChargesRate: [nonNegative],
    rent: [nonNegative],
    services: [nonNegative],
    generalExpenses: [nonNegative],
    investment: [nonNegative],
    amortizationMonths: [positive],
    annualReturnRate: [nonNegative],
    monthlyWithdrawal: [nonNegative],
    incomeTaxRate: [nonNegative, belowHundred],
    costOfGoodsConsumed: [positive],
    unitCost: [nonNegative],
    vatRate: [nonNegative],
    grossIncomeTaxRate: [nonNegative],
    cardFeeRate: [nonNegative],
    safetyHygieneRate: [nonNegative],
  });
  if (errors.length > 0) {
    return failure(errors);
  }

  const v = values;
  const charges = socialCharges(v.salaries, v.socialChargesRate);
  const amortizationValue = amortization(v.investment, v.amortizationMonths);
  const nonRawMaterialCosts = sum([
    v.salaries,
    charges,
    v.rent,
    v.services,
    v.generalExpenses,
    amortizationValue,
  ]);
  const returnValue = monthlyReturn(v.investment, v.annualReturnRate);
  const netProfit = returnValue + v.monthlyWithdrawal;
  const grossProfit = grossUpForIncomeTax(netProfit, v.incomeTaxRate);
  const coefficient = pricingCoefficient(nonRawMaterialCosts, grossProfit, v.costOfGoodsConsumed);
  const netPrice = v.unitCost * coefficient;
  const salesTaxRate = salesTaxTotal(
    {
      vat: v.vatRate,
      grossIncomeTax: v.grossIncomeTaxRate,
      cardFee: v.cardFeeRate,
      safetyHygiene: v.safetyHygieneRate,
    },
    includeCardFee,
  );
  const finalPrice = grossPrice(netPrice, salesTaxRate);

  return success(
    {
      socialCharges: charges,
      amortization: amortizationValue,
      nonRawMaterialCosts,
      monthlyReturn: returnValue,
      netProfit,
      grossProfit,
      coefficient,
      netPrice,
      salesTaxRate,
      grossPrice: finalPrice,
    },
    [
      {
        id: 'social-charges',
        values: {
          salaries: v.salaries,
          socialChargesRate: v.socialChargesRate,
          socialCharges: charges,
        },
      },
      {
        id: 'amortization',
        values: {
          investment: v.investment,
          amortizationMonths: v.amortizationMonths,
          amortization: amortizationValue,
        },
      },
      {
        id: 'non-raw-material-costs',
        values: {
          salaries: v.salaries,
          socialCharges: charges,
          rent: v.rent,
          services: v.services,
          generalExpenses: v.generalExpenses,
          amortization: amortizationValue,
          nonRawMaterialCosts,
        },
      },
      {
        id: 'monthly-return',
        values: {
          investment: v.investment,
          annualReturnRate: v.annualReturnRate,
          monthlyReturn: returnValue,
        },
      },
      {
        id: 'net-profit',
        values: { monthlyReturn: returnValue, monthlyWithdrawal: v.monthlyWithdrawal, netProfit },
      },
      { id: 'gross-profit', values: { netProfit, incomeTaxRate: v.incomeTaxRate, grossProfit } },
      {
        id: 'coefficient',
        values: {
          nonRawMaterialCosts,
          grossProfit,
          costOfGoodsConsumed: v.costOfGoodsConsumed,
          coefficient,
        },
      },
      { id: 'net-price', values: { unitCost: v.unitCost, coefficient, netPrice } },
      {
        id: 'sales-tax-rate',
        values: {
          vatRate: v.vatRate,
          grossIncomeTaxRate: v.grossIncomeTaxRate,
          cardFeeRate: includeCardFee ? v.cardFeeRate : 0,
          safetyHygieneRate: v.safetyHygieneRate,
          salesTaxRate,
        },
      },
      { id: 'gross-price', values: { netPrice, salesTaxRate, grossPrice: finalPrice } },
    ],
  );
};
