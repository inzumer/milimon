import {
  belowHundred,
  failure,
  nonNegative,
  percentage,
  positive,
  success,
  sum,
  validate,
} from '@domain/shared';
import type { CalculationResult, FieldError } from '@domain/shared';
import { wasteFactorFromPercentage } from './waste-factor';

export interface RecipeIngredientInput {
  name: string;
  unit: string;
  netQuantity: number | null;
  wastePercentage: number | null;
  unitPrice: number | null;
}

export interface RecipeCostingInput {
  servings: number | null;
  ingredients: RecipeIngredientInput[];
}

export interface RecipeIngredientCost {
  name: string;
  unit: string;
  netQuantity: number;
  wastePercentage: number;
  wasteFactor: number;
  grossQuantity: number;
  unitPrice: number;
  cost: number;
  share: number;
}

export interface RecipeCostingOutput {
  ingredients: RecipeIngredientCost[];
  recipeCost: number;
  portionCost: number;
}

export type RecipeCostingField = string;

export const ingredientCost = (
  netQuantity: number,
  wastePercentage: number,
  unitPrice: number,
): { wasteFactor: number; grossQuantity: number; cost: number } => {
  const wasteFactor = wasteFactorFromPercentage(wastePercentage);
  const grossQuantity = netQuantity * wasteFactor;
  return { wasteFactor, grossQuantity, cost: grossQuantity * unitPrice };
};

export const calculateRecipeCosting = (
  input: RecipeCostingInput,
): CalculationResult<RecipeCostingOutput, RecipeCostingField> => {
  const errors: FieldError[] = [];
  const servingsCheck = validate({ servings: input.servings }, { servings: [positive] });
  errors.push(...servingsCheck.errors);
  if (input.ingredients.length === 0) {
    errors.push({ field: 'ingredients', code: 'required' });
  }

  const rows = input.ingredients.map((ingredient, index) => {
    const check = validate(
      {
        netQuantity: ingredient.netQuantity,
        wastePercentage: ingredient.wastePercentage,
        unitPrice: ingredient.unitPrice,
      },
      {
        netQuantity: [positive],
        wastePercentage: [nonNegative, belowHundred],
        unitPrice: [nonNegative],
      },
    );
    errors.push(
      ...check.errors.map(({ field, code }) => ({ field: `ingredients.${index}.${field}`, code })),
    );
    return { ingredient, values: check.values };
  });

  if (errors.length > 0) {
    return failure(errors);
  }

  const costed = rows.map(({ ingredient, values }) => ({
    name: ingredient.name,
    unit: ingredient.unit,
    netQuantity: values.netQuantity,
    wastePercentage: values.wastePercentage,
    unitPrice: values.unitPrice,
    ...ingredientCost(values.netQuantity, values.wastePercentage, values.unitPrice),
  }));
  const recipeCost = sum(costed.map((row) => row.cost));
  const servings = servingsCheck.values.servings;
  const portionCost = recipeCost / servings;
  const ingredients = costed.map((row) => ({
    ...row,
    share: recipeCost > 0 ? percentage(row.cost, recipeCost) : 0,
  }));

  return success({ ingredients, recipeCost, portionCost }, [
    { id: 'recipe-cost', values: { recipeCost } },
    { id: 'portion-cost', values: { recipeCost, servings, portionCost } },
  ]);
};
