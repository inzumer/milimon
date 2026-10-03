import { failure, nonNegative, percentage, positive, success, validate } from '@utils/calculation';
import type { CalculationResult } from '@utils/calculation';

export interface WastePercentageInput {
  grossWeight: number | null;
  netWeight: number | null;
}

export interface WastePercentageOutput {
  wasteWeight: number;
  wastePercentage: number;
}

export type WastePercentageField = keyof WastePercentageInput;

export const wasteWeight = (grossWeight: number, netWeight: number): number =>
  grossWeight - netWeight;

export const wastePercentage = (grossWeight: number, netWeight: number): number =>
  percentage(wasteWeight(grossWeight, netWeight), grossWeight);

export const calculateWastePercentage = (
  input: WastePercentageInput,
): CalculationResult<WastePercentageOutput, WastePercentageField> => {
  const { errors, values } = validate(input, {
    grossWeight: [positive],
    netWeight: [nonNegative],
  });
  if (errors.length === 0 && values.netWeight > values.grossWeight) {
    errors.push({ field: 'netWeight', code: 'must-not-exceed-gross' });
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  const { grossWeight, netWeight } = values;
  const waste = wasteWeight(grossWeight, netWeight);
  const result = wastePercentage(grossWeight, netWeight);

  return success({ wasteWeight: waste, wastePercentage: result }, [
    { id: 'waste-weight', values: { grossWeight, netWeight, wasteWeight: waste } },
    {
      id: 'waste-percentage',
      values: { wasteWeight: waste, grossWeight, wastePercentage: result },
    },
  ]);
};
