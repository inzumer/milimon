import { ResultPanel } from '@calculators/FormulaCalculator/ResultPanel';
import { StepList } from '@calculators/FormulaCalculator/StepList';
import type { FormatContext } from '@calculators/shared/format-value';
import type { RecipeCostingOutput } from '@domain/formulas/recipe-costing';
import type { Step } from '@domain/shared';
import type { CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import { CostTable } from './CostTable';

const TOTALS = [
  { key: 'recipeCost', kind: 'currency', primary: true },
  { key: 'portionCost', kind: 'currency', primary: true },
] as const;

export interface RecipeCostingResultProps {
  value: RecipeCostingOutput;
  steps: Step[];
  /** Stable React keys for the ingredient rows, in order. */
  ids: string[];
  text: CalculatorText;
  ui: Translations<'calculator'>;
  context: FormatContext;
}

/** Totals, cost per ingredient and worked steps of a recipe (live calculator and saved history). */
export const RecipeCostingResult = ({
  value,
  steps,
  ids,
  text,
  ui,
  context,
}: RecipeCostingResultProps) => (
  <>
    <ResultPanel
      outputs={[...TOTALS]}
      values={value as unknown as Record<string, unknown>}
      text={text}
      context={context}
    />
    <CostTable value={value} ids={ids} text={text} context={context} />
    <h4 className="font-bold">{ui['steps-title']}</h4>
    <StepList
      steps={steps}
      templates={text.steps}
      kinds={{ recipeCost: 'currency', portionCost: 'currency', servings: 'count' }}
      context={context}
    />
  </>
);
