import { belowHundred, failure, nonNegative, positive, success, validate } from '@domain/shared';
import type { CalculationResult } from '@domain/shared';
import { wasteFactorFromPercentage } from './waste-factor';

/**
 * Precio limpio equivalente (manual, Unidad 2 — "Comparativa de precios").
 * PLE = precio sucio (bruto) × factor de desechos. Se compara con el precio limpio del proveedor.
 * El manual recuerda sumar otras variables antes de decidir (mano de obra, urgencia, almacenamiento).
 */
export interface CleanPriceInput {
  grossPrice: number | null;
  wastePercentage: number | null;
  supplierCleanPrice: number | null;
}

export type CleanPriceChoice = 'buy-gross' | 'buy-clean' | 'same';

export interface CleanPriceOutput {
  wasteFactor: number;
  equivalentCleanPrice: number;
  /** Supplier clean price − our equivalent: positive means buying gross is cheaper. */
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
