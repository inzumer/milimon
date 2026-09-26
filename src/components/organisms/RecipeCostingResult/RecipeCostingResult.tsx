import { RichText } from '@inzumer/ui-library';
import { CostTable } from '@components/molecules/CostTable';
import { ResultPanel } from '@components/molecules/ResultPanel';
import { StepList } from '@components/molecules/StepList';
import type { CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import type { Step } from '@utils/calculation';
import type { FormatContext } from '@utils/format-value';
import type { RecipeCostingOutput } from '@utils/formulas/recipe-costing';

const TOTALS = [
  { key: 'recipeCost', kind: 'currency', primary: true },
  { key: 'portionCost', kind: 'currency', primary: true },
] as const;

export interface RecipeCostingResultProps {
  value: RecipeCostingOutput;
  steps: Step[];
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
    <RichText variant="h4" className="font-bold">
      {ui['steps-title']}
    </RichText>
    <StepList
      steps={steps}
      templates={text.steps}
      kinds={{ recipeCost: 'currency', portionCost: 'currency', servings: 'count' }}
      context={context}
    />
  </>
);
