import { failure, nonNegative, success, validate } from '@utils/calculation';
import type { CalculationResult } from '@utils/calculation';

export interface CostOfGoodsInput {
  openingInventory: number | null;
  purchases: number | null;
  closingInventory: number | null;
}

export interface CostOfGoodsOutput {
  availableForUse: number;
  costOfGoodsConsumed: number;
}

export type CostOfGoodsField = keyof CostOfGoodsInput;

export const costOfGoodsConsumed = (opening: number, purchases: number, closing: number): number =>
  opening + purchases - closing;

export const calculateCostOfGoods = (
  input: CostOfGoodsInput,
): CalculationResult<CostOfGoodsOutput, CostOfGoodsField> => {
  const { errors, values } = validate(input, {
    openingInventory: [nonNegative],
    purchases: [nonNegative],
    closingInventory: [nonNegative],
  });
  if (errors.length === 0 && values.closingInventory > values.openingInventory + values.purchases) {
    errors.push({ field: 'closingInventory', code: 'must-not-exceed-gross' });
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  const { openingInventory, purchases, closingInventory } = values;
  const availableForUse = openingInventory + purchases;
  const consumed = costOfGoodsConsumed(openingInventory, purchases, closingInventory);

  return success({ availableForUse, costOfGoodsConsumed: consumed }, [
    { id: 'available-for-use', values: { openingInventory, purchases, availableForUse } },
    {
      id: 'cost-of-goods-consumed',
      values: { availableForUse, closingInventory, costOfGoodsConsumed: consumed },
    },
  ]);
};
