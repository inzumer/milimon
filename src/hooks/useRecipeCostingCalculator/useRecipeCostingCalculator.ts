import { useMemo, useState } from 'react';
import { useCurrency } from '@hooks/useCurrency';
import { useDraft } from '@hooks/useDraft';
import { parseDecimal, track, type Locale } from '@utils';
import type { ErrorCode } from '@utils/calculation';
import { formatInputValue } from '@utils/format-value';
import { calculateRecipeCosting } from '@utils/formulas/recipe-costing';

export interface IngredientRow {
  id: string;
  name: string;
  unit: string;
  netQuantity: string;
  wastePercentage: string;
  unitPrice: string;
}

export type IngredientField = Exclude<keyof IngredientRow, 'id'>;

/** Illustrative recipe (the manual gives the costing sheet, not numbers): names are label keys. */
export const RECIPE_EXAMPLE = {
  id: 'tournedos-recipe',
  servings: 10,
  ingredients: [
    { nameKey: 'tenderloin', unit: 'kg', netQuantity: 1.8, wastePercentage: 30, unitPrice: 10_000 },
    { nameKey: 'potatoes', unit: 'kg', netQuantity: 2, wastePercentage: 20, unitPrice: 1_500 },
    { nameKey: 'butter', unit: 'kg', netQuantity: 0.2, wastePercentage: 0, unitPrice: 8_000 },
  ],
} as const;

let nextId = 0;
const newRow = (values: Partial<IngredientRow> = {}): IngredientRow => {
  nextId += 1;
  return {
    id: `ingredient-${nextId}`,
    name: '',
    unit: 'kg',
    netQuantity: '',
    wastePercentage: '0',
    unitPrice: '',
    ...values,
  };
};

const EMPTY_ROW = { name: '', unit: 'kg', netQuantity: '', wastePercentage: '0', unitPrice: '' };
const INITIAL = {
  servings: '',
  ingredients: JSON.stringify([{ id: 'ingredient-0', ...EMPTY_ROW }]),
};

const readRows = (raw: unknown): IngredientRow[] => {
  try {
    const rows = JSON.parse(typeof raw === 'string' ? raw : '[]') as IngredientRow[];
    return Array.isArray(rows) && rows.length > 0 ? rows : [newRow()];
  } catch {
    return [newRow()];
  }
};

export const useRecipeCostingCalculator = ({
  lang,
  exampleNames,
}: {
  lang: Locale;
  /** Translated names for the example ingredients, keyed by `nameKey`. */
  exampleNames: Record<string, string>;
}) => {
  const { draft, setDraft, resetDraft } = useDraft('recipe-costing', INITIAL);
  const currency = useCurrency();
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const servings = typeof draft['servings'] === 'string' ? draft['servings'] : '';
  const rowsJson =
    typeof draft['ingredients'] === 'string' ? draft['ingredients'] : INITIAL.ingredients;
  const rows = useMemo(() => readRows(rowsJson), [rowsJson]);

  const save = (nextServings: string, nextRows: IngredientRow[]) =>
    setDraft({ servings: nextServings, ingredients: JSON.stringify(nextRows) });

  const { result, errors } = useMemo(() => {
    const invalid: Record<string, ErrorCode | 'invalid-number'> = {};
    const number = (raw: string, field: string) => {
      const value = parseDecimal(raw, lang);
      if (value === null && raw.trim() !== '') {
        invalid[field] = 'invalid-number';
      }
      return value;
    };
    const calculation = calculateRecipeCosting({
      servings: number(servings, 'servings'),
      ingredients: rows.map((row, index) => ({
        name: row.name,
        unit: row.unit,
        netQuantity: number(row.netQuantity, `ingredients.${index}.netQuantity`),
        wastePercentage: number(row.wastePercentage, `ingredients.${index}.wastePercentage`),
        unitPrice: number(row.unitPrice, `ingredients.${index}.unitPrice`),
      })),
    });
    const fieldErrors = calculation.ok
      ? {}
      : Object.fromEntries(calculation.errors.map((error) => [error.field, error.code]));
    return { result: calculation, errors: { ...fieldErrors, ...invalid } };
  }, [servings, rows, lang]);

  return {
    /** Raw values as saved (for the history). */
    draft,
    currency,
    servings,
    rows,
    result: result.ok && Object.keys(errors).length === 0 ? result : null,
    errors: Object.fromEntries(Object.entries(errors).filter(([key]) => touched.has(key))),
    touch: (key: string) => setTouched((current) => new Set(current).add(key)),
    setServings: (value: string) => save(value, rows),
    setRowField: (id: string, field: IngredientField, value: string) =>
      save(
        servings,
        rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      ),
    addRow: () => save(servings, [...rows, newRow()]),
    removeRow: (id: string) =>
      save(servings, rows.length > 1 ? rows.filter((row) => row.id !== id) : rows),
    loadExample: () => {
      save(
        formatInputValue(RECIPE_EXAMPLE.servings, lang),
        RECIPE_EXAMPLE.ingredients.map((item) =>
          newRow({
            name: exampleNames[item.nameKey] ?? item.nameKey,
            unit: item.unit,
            netQuantity: formatInputValue(item.netQuantity, lang),
            wastePercentage: formatInputValue(item.wastePercentage, lang),
            unitPrice: formatInputValue(item.unitPrice, lang),
          }),
        ),
      );
      setTouched(new Set());
      track('example_loaded', { formula: 'recipe-costing', example: RECIPE_EXAMPLE.id });
    },
    reset: () => {
      resetDraft();
      setTouched(new Set());
      track('calculator_reset', { formula: 'recipe-costing' });
    },
  };
};
