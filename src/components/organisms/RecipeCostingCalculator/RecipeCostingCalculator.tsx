import { Button, RichText } from '@inzumer/ui-library';
import { IngredientCard } from '@components/molecules/IngredientCard';
import { NumberField } from '@components/molecules/NumberField';
import { CalculatorLayout } from '@components/organisms/CalculatorLayout';
import { RecipeCostingResult } from '@components/organisms/RecipeCostingResult';
import { RECIPE_EXAMPLE, useRecipeCostingCalculator } from '@hooks/useRecipeCostingCalculator';
import { formulaText, type CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import { trackingId, type Locale } from '@utils';

/** Tracking scope: the formula id. */
const SCOPE = 'recipe-costing';

export interface RecipeCostingCalculatorProps {
  lang: Locale;
  text: CalculatorText;
  ui: Translations<'calculator'>;
}

/** Recipe costing sheet: ingredients → gross quantity → cost → portion cost. */
export const RecipeCostingCalculator = ({ lang, text, ui }: RecipeCostingCalculatorProps) => {
  const t = formulaText(text);
  const calculator = useRecipeCostingCalculator({
    lang,
    exampleNames: text.labels ?? {},
  });
  const context = { lang, currency: calculator.currency };
  const servingsCode = calculator.errors['servings'];

  return (
    <CalculatorLayout
      scope={SCOPE}
      lang={lang}
      ui={ui}
      examples={[
        {
          id: RECIPE_EXAMPLE.id,
          label: t.example(RECIPE_EXAMPLE.id),
          onLoad: calculator.loadExample,
        },
      ]}
      onReset={calculator.reset}
      actions={
        <Button
          id={trackingId(SCOPE, 'button', 'add-ingredient')}
          type="button"
          variant="secondary"
          className="min-h-11"
          onClick={calculator.addRow}
        >
          {t.label('add-ingredient')}
        </Button>
      }
      result={
        calculator.result && {
          view: (
            <RecipeCostingResult
              value={calculator.result.value}
              steps={calculator.result.steps}
              ids={calculator.rows.map((row) => row.id)}
              text={text}
              ui={ui}
              context={context}
            />
          ),
          save: {
            formulaId: SCOPE,
            draft: calculator.draft,
            currency: calculator.currency,
            result: calculator.result,
          },
        }
      }
    >
      <NumberField
        id={trackingId(SCOPE, 'input', 'servings')}
        label={t.input('servings').label}
        placeholder={t.input('servings').placeholder}
        error={servingsCode ? ui.errors[servingsCode as keyof typeof ui.errors] : undefined}
        value={calculator.servings}
        onValueChange={calculator.setServings}
        onBlur={() => calculator.touch('servings')}
      />
      <RichText variant="h4" className="font-bold">
        {t.label('ingredients-title')}
      </RichText>
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
    </CalculatorLayout>
  );
};
