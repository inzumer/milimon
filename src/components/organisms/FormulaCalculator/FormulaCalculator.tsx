import { FormulaFields } from '@components/molecules/FormulaFields';
import { CalculatorLayout } from '@components/organisms/CalculatorLayout';
import { FormulaResult } from '@components/organisms/FormulaResult';
import { useFormulaCalculator } from '@hooks/useFormulaCalculator';
import { formulaText, type CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import type { Locale } from '@utils';
import { getFormula, type FormulaId, type StandardFormulaDefinition } from '@utils/formulas';

export interface FormulaCalculatorProps {
  formulaId: FormulaId;
  lang: Locale;
  text: CalculatorText;
  ui: Translations<'calculator'>;
}

/** Interactive calculator for any standard formula of the registry (React island). */
export const FormulaCalculator = ({ formulaId, lang, text, ui }: FormulaCalculatorProps) => {
  const formula = getFormula(formulaId) as StandardFormulaDefinition;
  const calculator = useFormulaCalculator({
    formula,
    lang,
  });
  const context = { lang, currency: calculator.currency };

  return (
    <CalculatorLayout
      scope={formulaId}
      lang={lang}
      ui={ui}
      examples={formula.examples.map((example) => ({
        id: example.id,
        label: formulaText(text).example(example.id),
        onLoad: () => calculator.loadExample(example.id),
      }))}
      onReset={calculator.reset}
      result={
        calculator.result && {
          view: (
            <FormulaResult
              formula={formula}
              value={calculator.result.value as Record<string, unknown>}
              steps={calculator.result.steps}
              text={text}
              ui={ui}
              context={context}
            />
          ),
          save: {
            formulaId,
            draft: calculator.draft,
            currency: calculator.currency,
            result: calculator.result,
          },
        }
      }
    >
      <FormulaFields
        scope={formulaId}
        inputs={formula.inputs}
        draft={calculator.draft}
        errors={calculator.errors}
        currency={calculator.currency}
        text={text}
        ui={ui}
        onChange={calculator.setField}
        onBlur={calculator.touch}
      />
    </CalculatorLayout>
  );
};
