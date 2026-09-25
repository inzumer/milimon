import { useId } from 'react';
import { Button } from '@inzumer/ui-library';
import { SaveToHistory } from '@calculators/shared/SaveToHistory';
import { NumberField } from '@components/molecules/NumberField';
import { formulaText, type CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import type { CalculationsRepository, HistoryRepository, SettingsRepository } from '@repositories';
import { interpolate, localizedPath, type Locale } from '@utils';
import { OmnesResult } from './OmnesResult';
import { OMNES_EXAMPLE, useOmnesCalculator } from './useOmnesCalculator';

export interface OmnesCalculatorProps {
  lang: Locale;
  text: CalculatorText;
  ui: Translations<'calculator'>;
  calculations?: CalculationsRepository;
  settings?: SettingsRepository;
  history?: HistoryRepository;
}

/** Omnes' rules for a whole menu: one price per line, plus optional ticket and daily special. */
export const OmnesCalculator = ({
  lang,
  text,
  ui,
  calculations,
  settings,
  history,
}: OmnesCalculatorProps) => {
  const id = useId();
  const calculator = useOmnesCalculator({
    lang,
    ...(calculations ? { calculations } : {}),
    ...(settings ? { settings } : {}),
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
  const optional = (key: 'averageTicket' | 'dailySpecialPrice', copyKey: string) => {
    const copy = t.input(copyKey);
    return (
      <NumberField
        id={`${id}-${copyKey}`}
        label={copy.label}
        unit={calculator.currency}
        placeholder={copy.placeholder}
        hint={copy.hint}
        value={calculator[key]}
        onValueChange={(value) => calculator.setField(key, value)}
      />
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby={`${id}-examples`} className="flex flex-col gap-3">
        <h3 id={`${id}-examples`} className="text-lg font-bold">
          {ui['examples-title']}
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" className="min-h-11" onClick={calculator.loadExample}>
            {ui['load-example']}: {t.example(OMNES_EXAMPLE.id)}
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-prices`} className="text-sm font-semibold">
            {pricesText.label} ({calculator.currency})
          </label>
          <textarea
            id={`${id}-prices`}
            rows={8}
            value={calculator.prices}
            placeholder={pricesText.placeholder}
            aria-describedby={`${id}-prices-help`}
            aria-invalid={showListError ? 'true' : undefined}
            onChange={(event) => calculator.setField('prices', event.target.value)}
            onBlur={calculator.touch}
            className="rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] p-3 text-base text-[var(--input-text)] tabular-nums placeholder:text-[var(--input-placeholder)] focus-visible:border-[var(--input-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:outline-none"
          />
          <p id={`${id}-prices-help`} className="text-sm text-[var(--text-secondary)]">
            {t.label('prices-hint')}{' '}
            {interpolate(t.label('prices-count'), {
              count: calculator.list.prices.length,
            })}
          </p>
          {showListError && (
            <p role="alert" className="text-sm text-[var(--border-error)]">
              {invalid.length > 0 ? listError : ui.errors[listError as keyof typeof ui.errors]}
            </p>
          )}
        </div>
        {optional('averageTicket', 'average-ticket')}
        {optional('dailySpecialPrice', 'daily-special-price')}
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
