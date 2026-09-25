import { failure, nonNegative, percentage, positive, success, validate } from '@domain/shared';
import type { CalculationResult } from '@domain/shared';

/**
 * % de merma de cocción (manual, Unidad 2 — "Cálculo del porcentaje de mermas").
 * Peso antes de cocción = peso limpio + aderezos, salsas, rebozados o rellenos que no se pueden separar.
 * Merma = peso antes de cocción − peso cocido; % merma = merma / peso antes de cocción × 100.
 */
export interface CookingLossInput {
  netWeight: number | null;
  additionsWeight: number | null;
  cookedWeight: number | null;
}

export interface CookingLossOutput {
  weightBeforeCooking: number;
  lossWeight: number;
  lossPercentage: number;
  /** Cooked weight obtained per unit of weight before cooking (yield, 0–1). */
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
