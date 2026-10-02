import { failure, nonNegative, positive, success, validate } from '@utils/calculation';
import type { CalculationResult } from '@utils/calculation';

export interface BreakEvenInput {
  grossSales: number | null;
  taxes: number | null;
  variableCosts: number | null;
  fixedCosts: number | null;
  desiredProfitBeforeTax: number | null;
}

export interface BreakEvenOutput {
  netSales: number;
  taxRate: number;
  variableCostRate: number;
  contributionRate: number;
  breakEvenNetSales: number;
  breakEvenGrossSales: number;
  targetNetSales: number;
  targetGrossSales: number;
}

export type BreakEvenField = keyof BreakEvenInput;

export const taxRate = (grossSales: number, netSales: number): number => grossSales / netSales;

export const variableCostRate = (variableCosts: number, netSales: number): number =>
  variableCosts / netSales;

export const contributionRate = (variableRate: number): number => 1 - variableRate;

/** Net sales needed to cover fixed costs plus an optional profit (0 = break-even). */
export const requiredNetSales = (fixedCosts: number, rate: number, profit = 0): number =>
  (fixedCosts + profit) / rate;

export const calculateBreakEven = (
  input: BreakEvenInput,
): CalculationResult<BreakEvenOutput, BreakEvenField> => {
  const { errors, values: v } = validate(input, {
    grossSales: [positive],
    taxes: [nonNegative],
    variableCosts: [nonNegative],
    fixedCosts: [nonNegative],
    desiredProfitBeforeTax: [nonNegative],
  });
  if (errors.length === 0 && v.taxes >= v.grossSales) {
    errors.push({ field: 'taxes', code: 'must-not-exceed-gross' });
  }

  if (errors.length === 0 && v.variableCosts >= v.grossSales - v.taxes) {
    errors.push({ field: 'variableCosts', code: 'must-not-exceed-gross' });
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  const netSales = v.grossSales - v.taxes;
  const taxes = taxRate(v.grossSales, netSales);
  const variableRate = variableCostRate(v.variableCosts, netSales);
  const contribution = contributionRate(variableRate);
  const breakEvenNetSales = requiredNetSales(v.fixedCosts, contribution);
  const targetNetSales = requiredNetSales(v.fixedCosts, contribution, v.desiredProfitBeforeTax);

  const value: BreakEvenOutput = {
    netSales,
    taxRate: taxes,
    variableCostRate: variableRate,
    contributionRate: contribution,
    breakEvenNetSales,
    breakEvenGrossSales: breakEvenNetSales * taxes,
    targetNetSales,
    targetGrossSales: targetNetSales * taxes,
  };

  return success(value, [
    { id: 'net-sales', values: { grossSales: v.grossSales, taxes: v.taxes, netSales } },
    { id: 'tax-rate', values: { grossSales: v.grossSales, netSales, taxRate: taxes } },
    {
      id: 'variable-cost-rate',
      values: { variableCosts: v.variableCosts, netSales, variableCostRate: variableRate },
    },
    {
      id: 'contribution-rate',
      values: { variableCostRate: variableRate, contributionRate: contribution },
    },
    {
      id: 'break-even',
      values: { fixedCosts: v.fixedCosts, contributionRate: contribution, breakEvenNetSales },
    },
    {
      id: 'target-sales',
      values: {
        fixedCosts: v.fixedCosts,
        desiredProfitBeforeTax: v.desiredProfitBeforeTax,
        contributionRate: contribution,
        targetNetSales,
      },
    },
    {
      id: 'target-gross-sales',
      values: { targetNetSales, taxRate: taxes, targetGrossSales: value.targetGrossSales },
    },
  ]);
};
