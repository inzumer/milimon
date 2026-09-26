import { RichText } from '@inzumer/ui-library';
import { ResultPanel } from '@components/molecules/ResultPanel';
import { StepList } from '@components/molecules/StepList';
import type { CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import type { Step } from '@utils/calculation';
import type { FormatContext } from '@utils/format-value';
import { valueKinds, type StandardFormulaDefinition } from '@utils/formulas';

export interface FormulaResultProps {
  formula: StandardFormulaDefinition;
  value: Record<string, unknown>;
  steps: Step[];
  text: CalculatorText;
  ui: Translations<'calculator'>;
  context: FormatContext;
}

/** Results and worked steps of a standard formula (live calculator and saved history). */
export const FormulaResult = ({ formula, value, steps, text, ui, context }: FormulaResultProps) => (
  <>
    <ResultPanel
      outputs={formula.outputs}
      values={value}
      text={text}
      context={context}
      units={ui.units}
    />
    <RichText variant="h4" className="font-bold">
      {ui['steps-title']}
    </RichText>
    <StepList steps={steps} templates={text.steps} kinds={valueKinds(formula)} context={context} />
  </>
);
