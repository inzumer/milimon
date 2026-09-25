import { useId } from 'react';
import { Button } from '@inzumer/ui-library';
import { SaveToHistory } from '@calculators/shared/SaveToHistory';
import { getFormula, type FormulaId, type StandardFormulaDefinition } from '@domain/registry';
import { formulaText, type CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import type { CalculationsRepository, HistoryRepository, SettingsRepository } from '@repositories';
import { localizedPath, type Locale } from '@utils';
import { FormulaFields } from './FormulaFields';
import { FormulaResult } from './FormulaResult';
import { useFormulaCalculator } from './useFormulaCalculator';

export interface FormulaCalculatorProps {
  formulaId: FormulaId;
  lang: Locale;
  /** Translations are resolved on the server and passed in, so no dictionary ships to the client. */
  text: CalculatorText;
  ui: Translations<'calculator'>;
  calculations?: CalculationsRepository;
  settings?: SettingsRepository;
  history?: HistoryRepository;
}

/** Interactive calculator for any standard formula of the registry (React island). */
export const FormulaCalculator = ({
  formulaId,
  lang,
  text,
  ui,
  calculations,
  settings,
  history,
}: FormulaCalculatorProps) => {
  const formula = getFormula(formulaId) as StandardFormulaDefinition;
  const id = useId();
  const calculator = useFormulaCalculator({
    formula,
    lang,
    ...(calculations ? { calculations } : {}),
    ...(settings ? { settings } : {}),
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
          idPrefix={id}
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
              {...(history ? { repository: history } : {})}
            />
          </>
        ) : (
          <p className="text-[var(--text-secondary)]">{ui['empty-result']}</p>
        )}
      </section>
    </div>
  );
};
