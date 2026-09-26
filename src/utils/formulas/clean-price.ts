import {
  belowHundred,
  failure,
  nonNegative,
  positive,
  success,
  validate,
} from '@utils/calculation';
import type { CalculationResult } from '@utils/calculation';
import { wasteFactorFromPercentage } from '@utils/formulas/waste-factor';

export interface CleanPriceInput {
  grossPrice: number | null;
  wastePercentage: number | null;
  supplierCleanPrice: number | null;
}

export type CleanPriceChoice = 'buy-gross' | 'buy-clean' | 'same';

export interface CleanPriceOutput {
  wasteFactor: number;
  equivalentCleanPrice: number;
  difference: number;
  choice: CleanPriceChoice;
}

export type CleanPriceField = keyof CleanPriceInput;

export const equivalentCleanPrice = (grossPrice: number, wasteFactor: number): number =>
  grossPrice * wasteFactor;

/** Differences under a cent are treated as equal. */
const TOLERANCE = 0.005;

export const calculateCleanPrice = (
  input: CleanPriceInput,
): CalculationResult<CleanPriceOutput, CleanPriceField> => {
  const { errors, values } = validate(input, {
    grossPrice: [positive],
    wastePercentage: [nonNegative, belowHundred],
    supplierCleanPrice: [positive],
  });
  if (errors.length > 0) {
    return failure(errors);
  }

  const { grossPrice, wastePercentage, supplierCleanPrice } = values;
  const wasteFactor = wasteFactorFromPercentage(wastePercentage);
  const equivalent = equivalentCleanPrice(grossPrice, wasteFactor);
  const difference = supplierCleanPrice - equivalent;
  const choice: CleanPriceChoice =
    Math.abs(difference) < TOLERANCE ? 'same' : difference > 0 ? 'buy-gross' : 'buy-clean';

  return success({ wasteFactor, equivalentCleanPrice: equivalent, difference, choice }, [
    { id: 'waste-factor', values: { wastePercentage, wasteFactor } },
    {
      id: 'equivalent-clean-price',
      values: { grossPrice, wasteFactor, equivalentCleanPrice: equivalent },
    },
    {
      id: 'comparison',
      values: { supplierCleanPrice, equivalentCleanPrice: equivalent, difference },
    },
  ]);
};
