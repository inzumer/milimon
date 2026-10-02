import type { CalculatorDraft, HistoryEntry } from '@stores';
import { getFormula, type FormulaId, type StandardFormulaDefinition } from '@utils/formulas';
import { calculateOmnesRules } from '@utils/formulas/omnes-rules';
import { calculateRecipeCosting } from '@utils/formulas/recipe-costing';
import { headlineFor } from '@utils/history';

/** Builds a saved entry from real domain results, as the calculators do. */
const entry = (
  formulaId: FormulaId,
  draft: CalculatorDraft,
  result: { value: object; steps: HistoryEntry['result']['steps'] },
  id: string,
  savedAt: string,
): HistoryEntry => {
  const value = { ...(result.value as Record<string, unknown>) };

  return {
    id,
    formulaId,
    savedAt,
    draft,
    currency: 'ARS',
    result: { value, steps: result.steps },
    headline: headlineFor(formulaId, value),
  };
};

const ok = <T>(
  result: { ok: true; value: T; steps: HistoryEntry['result']['steps'] } | { ok: false },
) => {
  if (!result.ok) {
    throw new Error('Fixture calculation failed');
  }

  return result;
};

export const wasteFactorEntry = (id = 'waste', savedAt = '2026-09-26T12:00:00.000Z') => {
  const formula = getFormula('waste-factor') as StandardFormulaDefinition;

  return entry(
    'waste-factor',
    { wastePercentage: '30' },
    ok(formula.calculate({ wastePercentage: 30 })),
    id,
    savedAt,
  );
};

export const pricingEntry = (id = 'pricing', savedAt = '2026-09-25T12:00:00.000Z') => {
  const formula = getFormula('pricing') as StandardFormulaDefinition;
  const example = formula.examples[0];
  if (!example) {
    throw new Error('Pricing has no example');
  }

  const draft = Object.fromEntries(
    Object.entries(example.values).map(([key, value]) => [
      key,
      typeof value === 'boolean' ? value : String(value),
    ]),
  );

  return entry('pricing', draft, ok(formula.calculate(example.values)), id, savedAt);
};

export const recipeEntry = (id = 'recipe', savedAt = '2026-09-24T12:00:00.000Z') =>
  entry(
    'recipe-costing',
    {
      servings: '10',
      ingredients: JSON.stringify([
        {
          id: 'ingredient-1',
          name: 'Lomo',
          unit: 'kg',
          netQuantity: '1,8',
          wastePercentage: '30',
          unitPrice: '10000',
        },
      ]),
    },
    ok(
      calculateRecipeCosting({
        servings: 10,
        ingredients: [
          { name: 'Lomo', unit: 'kg', netQuantity: 1.8, wastePercentage: 30, unitPrice: 10_000 },
        ],
      }),
    ),
    id,
    savedAt,
  );

export const omnesEntry = (id = 'omnes', savedAt = '2026-09-23T12:00:00.000Z') =>
  entry(
    'omnes-rules',
    { prices: '40\n50\n80', averageTicket: '60', dailySpecialPrice: '' },
    ok(calculateOmnesRules({ prices: [40, 50, 80], averageTicket: 60 })),
    id,
    savedAt,
  );
