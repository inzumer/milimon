import { toKebabCase } from '@i18n/formula-text';
import type { HistoryHeadline } from '@stores';
import { getFormula, type FormulaId } from '@utils/formulas';

/** Main result of the special calculators (the standard ones mark it with `primary`). */
const CUSTOM_HEADLINES: Partial<Record<FormulaId, { key: string; kind: string }>> = {
  'recipe-costing': { key: 'portionCost', kind: 'currency' },
  'omnes-rules': { key: 'averagePrice', kind: 'currency' },
};

/** The value shown for a saved calculation in the history list. */
export const headlineFor = (
  formulaId: FormulaId,
  value: Record<string, unknown>,
): HistoryHeadline | null => {
  const formula = getFormula(formulaId);
  const main =
    formula.layout === 'standard'
      ? (formula.outputs.find((output) => output.primary) ?? formula.outputs[0])
      : CUSTOM_HEADLINES[formulaId];
  const result = main ? value[main.key] : undefined;
  if (!main || typeof result !== 'number') {
    return null;
  }

  return { output: toKebabCase(main.key), value: result, kind: main.kind };
};
