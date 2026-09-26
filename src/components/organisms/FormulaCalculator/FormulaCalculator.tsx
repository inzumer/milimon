import { useId } from 'react';
import { Button } from '@inzumer/ui-library';
import { FormulaFields } from '@components/molecules/FormulaFields';
import { SaveToHistory } from '@components/molecules/SaveToHistory';
import { FormulaResult } from '@components/organisms/FormulaResult';
import { useFormulaCalculator } from '@hooks/useFormulaCalculator';
import { formulaText, type CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import { localizedPath, trackingId, type Locale } from '@utils';
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
  const id = useId();
  const calculator = useFormulaCalculator({
    formula,
    lang,
  });
  const context = { lang, currency: calculator.currency };

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby={`${id}-examples`} className="flex flex-col gap-3">
        <h3 id={`${id}-examples`} className="text-lg font-bold">
          {ui['examples-title']}
        </h3>
        <ul className="flex flex-col gap-2">
          {formula.examples.map((example) => (
            <li key={example.id} className="flex flex-wrap items-center gap-3">
              <Button
                id={trackingId(formulaId, 'button', 'load-example', example.id)}
                variant="secondary"
                className="min-h-11"
                onClick={() => calculator.loadExample(example.id)}
              >
                {ui['load-example']}: {formulaText(text).example(example.id)}
              </Button>
              <span className="text-sm text-[var(--text-secondary)]">
                {ui['example-source'][example.source]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <form
        noValidate
        aria-labelledby={`${id}-form`}
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-col gap-4"
      >
        <h3 id={`${id}-form`} className="text-lg font-bold">
          {ui['form-title']}
        </h3>
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
        <Button
          id={trackingId(formulaId, 'button', 'reset')}
          type="button"
          variant="ghost"
          className="min-h-11 self-start"
          onClick={calculator.reset}
        >
          {ui.reset}
        </Button>
      </form>

      <section
        aria-labelledby={`${id}-result`}
        aria-live="polite"
        className="flex flex-col gap-4 rounded-xl bg-[var(--surface-secondary)] p-4"
      >
        <h3 id={`${id}-result`} className="text-lg font-bold">
          {ui['result-title']}
        </h3>
        {calculator.result ? (
          <>
            <FormulaResult
              formula={formula}
              value={calculator.result.value as Record<string, unknown>}
              steps={calculator.result.steps}
              text={text}
              ui={ui}
              context={context}
            />
            <SaveToHistory
              formulaId={formulaId}
              draft={calculator.draft}
              currency={calculator.currency}
              result={calculator.result}
              labels={ui.history}
              historyHref={localizedPath(lang, 'history')}
            />
          </>
        ) : (
          <p className="text-[var(--text-secondary)]">{ui['empty-result']}</p>
        )}
      </section>
    </div>
  );
};
