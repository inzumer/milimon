import { useId } from 'react';
import { Button } from '@inzumer/ui-library';
import { ResultPanel } from '@calculators/FormulaCalculator/ResultPanel';
import { StepList } from '@calculators/FormulaCalculator/StepList';
import { NumberField } from '@components/molecules/NumberField';
import { formulaText, type CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import type { CalculationsRepository, SettingsRepository } from '@repositories';
import type { Locale } from '@utils';
import { CostTable } from './CostTable';
import { IngredientCard } from './IngredientCard';
import { RECIPE_EXAMPLE, useRecipeCostingCalculator } from './useRecipeCostingCalculator';

export interface RecipeCostingCalculatorProps {
  lang: Locale;
  text: CalculatorText;
  ui: Translations<'calculator'>;
  calculations?: CalculationsRepository;
  settings?: SettingsRepository;
}

const TOTALS = [
  { key: 'recipeCost', kind: 'currency', primary: true },
  { key: 'portionCost', kind: 'currency', primary: true },
] as const;

/** Recipe costing sheet (manual, columns 1–8): ingredients → gross quantity → cost → portion cost. */
export const RecipeCostingCalculator = ({
  lang,
  text,
  ui,
  calculations,
  settings,
}: RecipeCostingCalculatorProps) => {
  const id = useId();
  const t = formulaText(text);
  const calculator = useRecipeCostingCalculator({
    lang,
    exampleNames: text.labels ?? {},
    ...(calculations ? { calculations } : {}),
    ...(settings ? { settings } : {}),
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
          <Button variant="secondary" className="min-h-11" onClick={calculator.loadExample}>
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
          id={`${id}-servings`}
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
            idPrefix={id}
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
            type="button"
            variant="secondary"
            className="min-h-11"
            onClick={calculator.addRow}
          >
            {t.label('add-ingredient')}
          </Button>
          <Button type="button" variant="ghost" className="min-h-11" onClick={calculator.reset}>
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
            <ResultPanel
              outputs={[...TOTALS]}
              values={calculator.result.value as unknown as Record<string, unknown>}
              text={text}
              context={context}
            />
            <CostTable
              value={calculator.result.value}
              ids={calculator.rows.map((row) => row.id)}
              text={text}
              context={context}
            />
            <h4 className="font-bold">{ui['steps-title']}</h4>
            <StepList
              steps={calculator.result.steps}
              templates={text.steps}
              kinds={{ recipeCost: 'currency', portionCost: 'currency', servings: 'count' }}
              context={context}
            />
          </>
        ) : (
          <p className="text-[var(--text-secondary)]">{ui['empty-result']}</p>
        )}
      </section>
    </div>
  );
};
