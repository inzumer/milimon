import {
  belowHundred,
  ceilToStep,
  failure,
  nonNegative,
  positive,
  success,
  validate,
} from '@domain/shared';
import type { CalculationResult } from '@domain/shared';
import { wasteFactorFromPercentage } from './waste-factor';

/**
 * Cantidad bruta a comprar (manual, Unidad 2 — "¿Cómo calcular una cantidad bruta (sucia) a comprar?").
 * Neto necesario = comensales × porción neta. Bruto = neto × factor de desechos.
 * Equivale a la regla de tres: bruto = neto × 100 / (100 − % desecho).
 * El manual redondea hacia arriba lo que se compra (51,429 kg → 52 kg).
 * Sumar el % de desecho al neto "nunca alcanza": aparece el desecho del desecho.
 */
export interface GrossQuantityInput {
  servings: number | null;
  netPortion: number | null;
  wastePercentage: number | null;
  /** Unit to round the purchase up to (1 = whole kilograms, 0.5 = half kilos…). */
  roundingStep: number | null;
}

export interface GrossQuantityOutput {
  netRequired: number;
  wasteFactor: number;
  grossQuantity: number;
  purchaseQuantity: number;
  /** What you'd buy by (wrongly) adding the waste % to the net quantity. */
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
