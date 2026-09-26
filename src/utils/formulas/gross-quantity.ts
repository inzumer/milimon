import {
  belowHundred,
  ceilToStep,
  failure,
  nonNegative,
  positive,
  success,
  validate,
} from '@utils/calculation';
import type { CalculationResult } from '@utils/calculation';
import { wasteFactorFromPercentage } from '@utils/formulas/waste-factor';

export interface GrossQuantityInput {
  servings: number | null;
  netPortion: number | null;
  wastePercentage: number | null;
  roundingStep: number | null;
}

export interface GrossQuantityOutput {
  netRequired: number;
  wasteFactor: number;
  grossQuantity: number;
  purchaseQuantity: number;
  naiveQuantity: number;
}

export type GrossQuantityField = keyof GrossQuantityInput;

export const grossFromNet = (netQuantity: number, wasteFactor: number): number =>
  netQuantity * wasteFactor;

/** Regla de tres: si (100 − %) es netQuantity, ¿cuánto es 100? */
export const grossByRuleOfThree = (netQuantity: number, wastePercentage: number): number =>
  (netQuantity * 100) / (100 - wastePercentage);

export const calculateGrossQuantity = (
  input: GrossQuantityInput,
): CalculationResult<GrossQuantityOutput, GrossQuantityField> => {
  const { errors, values } = validate(input, {
    servings: [positive],
    netPortion: [positive],
    wastePercentage: [nonNegative, belowHundred],
    roundingStep: [positive],
  });
  if (errors.length > 0) {
    return failure(errors);
  }

  const { servings, netPortion, wastePercentage, roundingStep } = values;
  const netRequired = servings * netPortion;
  const wasteFactor = wasteFactorFromPercentage(wastePercentage);
  const grossQuantity = grossFromNet(netRequired, wasteFactor);
  const purchaseQuantity = ceilToStep(grossQuantity, roundingStep);
  const naiveQuantity = netRequired * (1 + wastePercentage / 100);

  return success({ netRequired, wasteFactor, grossQuantity, purchaseQuantity, naiveQuantity }, [
    { id: 'net-required', values: { servings, netPortion, netRequired } },
    { id: 'waste-factor', values: { wastePercentage, wasteFactor } },
    { id: 'gross-quantity', values: { netRequired, wasteFactor, grossQuantity } },
    { id: 'rule-of-three', values: { netRequired, wastePercentage, grossQuantity } },
    { id: 'purchase-quantity', values: { grossQuantity, roundingStep, purchaseQuantity } },
  ]);
};
