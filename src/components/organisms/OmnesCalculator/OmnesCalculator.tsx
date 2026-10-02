import { Textarea } from '@inzumer/ui-library';
import { NumberField } from '@components/molecules/NumberField';
import { CalculatorLayout } from '@components/organisms/CalculatorLayout';
import { OmnesResult } from '@components/organisms/OmnesResult';
import { OMNES_EXAMPLE, useOmnesCalculator, type OptionalField } from '@hooks/useOmnesCalculator';
import { formulaText, type CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import { interpolate, keepNumberListCharacters, trackingId, type Locale } from '@utils';

/** Tracking scope: the formula id. */
const SCOPE = 'omnes-rules';

export interface OmnesCalculatorProps {
  lang: Locale;
  text: CalculatorText;
  ui: Translations<'calculator'>;
}

/** Omnes' rules for a whole menu: one price per line, plus optional ticket and daily special. */
export const OmnesCalculator = ({ lang, text, ui }: OmnesCalculatorProps) => {
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
    <CalculatorLayout
      scope={SCOPE}
      lang={lang}
      ui={ui}
      examples={[
        {
          id: OMNES_EXAMPLE.id,
          label: t.example(OMNES_EXAMPLE.id),
          onLoad: calculator.loadExample,
        },
      ]}
      onReset={calculator.reset}
      result={
        calculator.result && {
          view: (
            <OmnesResult
              value={calculator.result.value}
              steps={calculator.result.steps}
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
    </CalculatorLayout>
  );
};
