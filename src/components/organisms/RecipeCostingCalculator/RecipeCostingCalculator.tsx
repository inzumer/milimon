import { useId } from 'react';
import { Button } from '@inzumer/ui-library';
import { IngredientCard } from '@components/molecules/IngredientCard';
import { NumberField } from '@components/molecules/NumberField';
import { SaveToHistory } from '@components/molecules/SaveToHistory';
import { RecipeCostingResult } from '@components/organisms/RecipeCostingResult';
import { RECIPE_EXAMPLE, useRecipeCostingCalculator } from '@hooks/useRecipeCostingCalculator';
import { formulaText, type CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import { localizedPath, trackingId, type Locale } from '@utils';

/** Tracking scope: the formula id. */
const SCOPE = 'recipe-costing';

export interface RecipeCostingCalculatorProps {
  lang: Locale;
  text: CalculatorText;
  ui: Translations<'calculator'>;
}

/** Recipe costing sheet (manual, columns 1–8): ingredients → gross quantity → cost → portion cost. */
export const RecipeCostingCalculator = ({ lang, text, ui }: RecipeCostingCalculatorProps) => {
  const id = useId();
  const t = formulaText(text);
  const calculator = useRecipeCostingCalculator({
    lang,
    exampleNames: text.labels ?? {},
  });
  const context = { lang, currency: calculator.currency };
  const servingsCode = calculator.errors['servings'];

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby={`${id}-examples`} className="flex flex-col gap-3">
        <h3 id={`${id}-examples`} className="text-lg font-bold">
          {ui['examples-title']}
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            id={trackingId(SCOPE, 'button', 'load-example', RECIPE_EXAMPLE.id)}
            variant="secondary"
            className="min-h-11"
            onClick={calculator.loadExample}
          >
            {ui['load-example']}: {t.example(RECIPE_EXAMPLE.id)}
          </Button>
          <span className="text-sm text-[var(--text-secondary)]">
            {ui['example-source'].illustrative}
          </span>
        </div>
      </section>

      <form
        noValidate
        aria-labelledby={`${id}-form`}
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-col gap-5"
      >
        <h3 id={`${id}-form`} className="text-lg font-bold">
          {ui['form-title']}
        </h3>
        <NumberField
          id={trackingId(SCOPE, 'input', 'servings')}
          label={t.input('servings').label}
          placeholder={t.input('servings').placeholder}
          error={servingsCode ? ui.errors[servingsCode as keyof typeof ui.errors] : undefined}
          value={calculator.servings}
          onValueChange={calculator.setServings}
          onBlur={() => calculator.touch('servings')}
        />
        <h4 className="font-bold">{t.label('ingredients-title')}</h4>
        {calculator.rows.map((row, index) => (
          <IngredientCard
            key={row.id}
            row={row}
            index={index}
            currency={calculator.currency}
            canRemove={calculator.rows.length > 1}
            errors={calculator.errors}
            text={text}
            ui={ui}
            onChange={(field, value) => calculator.setRowField(row.id, field, value)}
            onBlur={(field) => calculator.touch(`ingredients.${index}.${field}`)}
            onRemove={() => calculator.removeRow(row.id)}
          />
        ))}
        <div className="flex flex-wrap gap-3">
          <Button
            id={trackingId(SCOPE, 'button', 'add-ingredient')}
            type="button"
            variant="secondary"
            className="min-h-11"
            onClick={calculator.addRow}
          >
            {t.label('add-ingredient')}
          </Button>
          <Button
            id={trackingId(SCOPE, 'button', 'reset')}
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={calculator.reset}
          >
            {ui.reset}
          </Button>
        </div>
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
            <RecipeCostingResult
              value={calculator.result.value}
              steps={calculator.result.steps}
              ids={calculator.rows.map((row) => row.id)}
              text={text}
              ui={ui}
              context={context}
            />
            <SaveToHistory
              formulaId={'recipe-costing'}
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
