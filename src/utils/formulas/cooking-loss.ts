import { failure, nonNegative, percentage, positive, success, validate } from '@utils/calculation';
import type { CalculationResult } from '@utils/calculation';

export interface CookingLossInput {
  netWeight: number | null;
  additionsWeight: number | null;
  cookedWeight: number | null;
}

export interface CookingLossOutput {
  weightBeforeCooking: number;
  lossWeight: number;
  lossPercentage: number;
  cookedYield: number;
}

export type CookingLossField = keyof CookingLossInput;

export const calculateCookingLoss = (
  input: CookingLossInput,
): CalculationResult<CookingLossOutput, CookingLossField> => {
  const { errors, values } = validate(input, {
    netWeight: [positive],
    additionsWeight: [nonNegative],
    cookedWeight: [nonNegative],
  });
  if (errors.length === 0 && values.cookedWeight > values.netWeight + values.additionsWeight) {
    errors.push({ field: 'cookedWeight', code: 'must-not-exceed-gross' });
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  const { netWeight, additionsWeight, cookedWeight } = values;
  const weightBeforeCooking = netWeight + additionsWeight;
  const lossWeight = weightBeforeCooking - cookedWeight;
  const lossPercentage = percentage(lossWeight, weightBeforeCooking);
  const cookedYield = cookedWeight / weightBeforeCooking;

  return success({ weightBeforeCooking, lossWeight, lossPercentage, cookedYield }, [
    { id: 'weight-before-cooking', values: { netWeight, additionsWeight, weightBeforeCooking } },
    { id: 'loss-weight', values: { weightBeforeCooking, cookedWeight, lossWeight } },
    { id: 'loss-percentage', values: { lossWeight, weightBeforeCooking, lossPercentage } },
  ]);
};
