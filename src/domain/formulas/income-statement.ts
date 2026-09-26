import {
  belowHundred,
  failure,
  nonNegative,
  percentOf,
  success,
  sum,
  validate,
} from '@domain/shared';
import type { CalculationResult } from '@domain/shared';

export interface IncomeStatementInput {
  foodSales: number | null;
  beverageSales: number | null;
  foodCost: number | null;
  beverageCost: number | null;
  salaries: number | null;
  socialCharges: number | null;
  rent: number | null;
  services: number | null;
  generalExpenses: number | null;
  amortization: number | null;
  salesTaxes: number | null;
  municipalFees: number | null;
  incomeTaxRate: number | null;
}

export interface IncomeStatementOutput {
  totalSales: number;
  costOfSales: number;
  operatingCosts: number;
  fixedCosts: number;
  resultBeforeIncomeTax: number;
  incomeTax: number;
  netResult: number;
}

export type IncomeStatementField = keyof IncomeStatementInput;

export const calculateIncomeStatement = (
  input: IncomeStatementInput,
): CalculationResult<IncomeStatementOutput, IncomeStatementField> => {
  const { errors, values: v } = validate(input, {
    foodSales: [nonNegative],
    beverageSales: [nonNegative],
    foodCost: [nonNegative],
    beverageCost: [nonNegative],
    salaries: [nonNegative],
    socialCharges: [nonNegative],
    rent: [nonNegative],
    services: [nonNegative],
    generalExpenses: [nonNegative],
    amortization: [nonNegative],
    salesTaxes: [nonNegative],
    municipalFees: [nonNegative],
    incomeTaxRate: [nonNegative, belowHundred],
  });
  if (errors.length > 0) {
    return failure(errors);
  }

  const totalSales = v.foodSales + v.beverageSales;
  const costOfSales = v.foodCost + v.beverageCost;
  const fixedCosts = sum([
    v.salaries,
    v.socialCharges,
    v.rent,
    v.services,
    v.generalExpenses,
    v.amortization,
    v.municipalFees,
  ]);
  const operatingCosts = fixedCosts + v.salesTaxes;
  const resultBeforeIncomeTax = totalSales - costOfSales - operatingCosts;
  const incomeTax =
    resultBeforeIncomeTax > 0 ? percentOf(resultBeforeIncomeTax, v.incomeTaxRate) : 0;
  const netResult = resultBeforeIncomeTax - incomeTax;

  return success(
    {
      totalSales,
      costOfSales,
      operatingCosts,
      fixedCosts,
      resultBeforeIncomeTax,
      incomeTax,
      netResult,
    },
    [
      {
        id: 'total-sales',
        values: { foodSales: v.foodSales, beverageSales: v.beverageSales, totalSales },
      },
      {
        id: 'cost-of-sales',
        values: { foodCost: v.foodCost, beverageCost: v.beverageCost, costOfSales },
      },
      { id: 'operating-costs', values: { fixedCosts, salesTaxes: v.salesTaxes, operatingCosts } },
      {
        id: 'result-before-income-tax',
        values: { totalSales, costOfSales, operatingCosts, resultBeforeIncomeTax },
      },
      {
        id: 'income-tax',
        values: { resultBeforeIncomeTax, incomeTaxRate: v.incomeTaxRate, incomeTax },
      },
      { id: 'net-result', values: { resultBeforeIncomeTax, incomeTax, netResult } },
    ],
  );
};
