import { useId } from 'react';
import { Button, RichText, Textarea } from '@inzumer/ui-library';
import { NumberField } from '@components/molecules/NumberField';
import { SaveToHistory } from '@components/molecules/SaveToHistory';
import { OmnesResult } from '@components/organisms/OmnesResult';
import { OMNES_EXAMPLE, useOmnesCalculator, type OptionalField } from '@hooks/useOmnesCalculator';
import { formulaText, type CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import {
  interpolate,
  keepNumberListCharacters,
  localizedPath,
  trackingId,
  type Locale,
} from '@utils';

/** Tracking scope: the formula id. */
const SCOPE = 'omnes-rules';

export interface OmnesCalculatorProps {
  lang: Locale;
  text: CalculatorText;
  ui: Translations<'calculator'>;
}

/** Omnes' rules for a whole menu: one price per line, plus optional ticket and daily special. */
export const OmnesCalculator = ({ lang, text, ui }: OmnesCalculatorProps) => {
  const id = useId();
  const calculator = useOmnesCalculator({
    lang,
  });
  const context = { lang, currency: calculator.currency };
  const t = formulaText(text);
  const pricesText = t.input('prices');
  const invalid = calculator.list.invalid;
  const listError =
    invalid.length > 0
      ? interpolate(t.label('invalid-prices'), { values: invalid.join(', ') })
      : calculator.errors.find((error) => error.field === 'prices')?.code;
  const showListError = calculator.touched && listError;
  const optional = (key: OptionalField, copyKey: string) => {
    const copy = t.input(copyKey);
    const code = calculator.optionalError(key);
    return (
      <NumberField
        id={trackingId(SCOPE, 'input', key)}
        label={copy.label}
        unit={calculator.currency}
        placeholder={copy.placeholder}
        hint={copy.hint}
        error={code ? ui.errors[code as keyof typeof ui.errors] : undefined}
        value={calculator[key]}
        onValueChange={(value) => calculator.setField(key, value)}
        onBlur={() => calculator.touchOptional(key)}
      />
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby={`${id}-examples`} className="flex flex-col gap-3">
        <RichText variant="h3" id={`${id}-examples`} className="text-lg font-bold">
          {ui['examples-title']}
        </RichText>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            id={trackingId(SCOPE, 'button', 'load-example', OMNES_EXAMPLE.id)}
            variant="secondary"
            className="min-h-11"
            onClick={calculator.loadExample}
          >
            {ui['load-example']}: {t.example(OMNES_EXAMPLE.id)}
          </Button>
          <RichText variant="s3" className="text-[var(--text-secondary)]">
            {ui['example-source'].illustrative}
          </RichText>
        </div>
      </section>

      <form
        noValidate
        aria-labelledby={`${id}-form`}
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-col gap-5"
      >
        <RichText variant="h3" id={`${id}-form`} className="text-lg font-bold">
          {ui['form-title']}
        </RichText>
        <Textarea
          id={trackingId(SCOPE, 'input', 'prices')}
          label={`${pricesText.label} (${calculator.currency})`}
          rows={8}
          inputSize="lg"
          className="tabular-nums"
          value={calculator.prices}
          placeholder={pricesText.placeholder}
          hint={`${t.label('prices-hint')} ${interpolate(t.label('prices-count'), {
            count: calculator.list.prices.length,
          })}`}
          {...(showListError
            ? {
                error:
                  invalid.length > 0
                    ? (listError as string)
                    : ui.errors[listError as keyof typeof ui.errors],
              }
            : {})}
          onChange={(event) =>
            calculator.setField('prices', keepNumberListCharacters(event.target.value))
          }
          onBlur={calculator.touch}
        />
        {optional('averageTicket', 'average-ticket')}
        {optional('dailySpecialPrice', 'daily-special-price')}
        <Button
          id={trackingId(SCOPE, 'button', 'reset')}
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
        <RichText variant="h3" id={`${id}-result`} className="text-lg font-bold">
          {ui['result-title']}
        </RichText>
        {calculator.result ? (
          <>
            <OmnesResult
              value={calculator.result.value}
              steps={calculator.result.steps}
              text={text}
              ui={ui}
              context={context}
            />
            <SaveToHistory
              formulaId={'omnes-rules'}
              draft={calculator.draft}
              currency={calculator.currency}
              result={calculator.result}
              labels={ui.history}
              historyHref={localizedPath(lang, 'history')}
            />
          </>
        ) : (
          <RichText className="text-[var(--text-secondary)]">{ui['empty-result']}</RichText>
        )}
      </section>
    </div>
  );
};
