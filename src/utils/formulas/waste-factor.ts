import { belowHundred, failure, nonNegative, success, validate } from '@utils/calculation';
import type { CalculationResult } from '@utils/calculation';

export interface WasteFactorInput {
  wastePercentage: number | null;
}

export interface WasteFactorOutput {
  usablePercentage: number;
  wasteFactor: number;
}

export type WasteFactorField = keyof WasteFactorInput;

export const wasteFactorFromPercentage = (wastePercentage: number): number =>
  wastePercentage / (100 - wastePercentage) + 1;

export const wasteFactorFromWeights = (grossWeight: number, netWeight: number): number =>
  grossWeight / netWeight;

export const calculateWasteFactor = (
  input: WasteFactorInput,
): CalculationResult<WasteFactorOutput, WasteFactorField> => {
  const { errors, values } = validate(input, { wastePercentage: [nonNegative, belowHundred] });
  if (errors.length > 0) {
    return failure(errors);
  }

  const { wastePercentage } = values;
  const usablePercentage = 100 - wastePercentage;
  const wasteFactor = wasteFactorFromPercentage(wastePercentage);

  return success({ usablePercentage, wasteFactor }, [
    { id: 'usable-percentage', values: { wastePercentage, usablePercentage } },
    { id: 'waste-factor', values: { wastePercentage, usablePercentage, wasteFactor } },
  ]);
};
