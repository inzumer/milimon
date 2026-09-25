import type { FormatContext } from '@calculators/shared/format-value';
import { valueKinds, type StandardFormulaDefinition } from '@domain/registry';
import type { Step } from '@domain/shared';
import type { CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import { ResultPanel } from './ResultPanel';
import { StepList } from './StepList';

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
    <h4 className="font-bold">{ui['steps-title']}</h4>
    <StepList steps={steps} templates={text.steps} kinds={valueKinds(formula)} context={context} />
  </>
);
