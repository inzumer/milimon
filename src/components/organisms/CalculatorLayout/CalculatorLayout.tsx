import { useId, type ReactNode } from 'react';
import { Button, RichText } from '@inzumer/ui-library';
import { SaveToHistory, type SaveToHistoryProps } from '@components/molecules/SaveToHistory';
import type { Translations } from '@i18n/translations';
import { localizedPath, trackingId, type Locale } from '@utils';

export interface CalculatorExample {
  id: string;
  label: string;
  onLoad: () => void;
}

export interface CalculatorLayoutProps {
  /** Tracking scope: the formula id. */
  scope: string;
  lang: Locale;
  ui: Translations<'calculator'>;
  examples: CalculatorExample[];
  /** The form fields. */
  children: ReactNode;
  /** Extra form buttons, before "Reset". */
  actions?: ReactNode;
  onReset: () => void;
  /** The result view and what to save, or `null` while there is no result. */
  result: { view: ReactNode; save: Omit<SaveToHistoryProps, 'labels' | 'historyHref'> } | null;
}

/** Shared calculator layout: examples, form with reset, and the result with "Save to history". */
export const CalculatorLayout = ({
  scope,
  lang,
  ui,
  examples,
  children,
  actions,
  onReset,
  result,
}: CalculatorLayoutProps) => {
  const id = useId();

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby={`${id}-examples`} className="flex flex-col gap-3">
        <RichText variant="h3" id={`${id}-examples`} className="text-lg font-bold">
          {ui['examples-title']}
        </RichText>
        <ul className="flex flex-col gap-2">
          {examples.map((example) => (
            <li key={example.id} className="flex flex-wrap items-center gap-3">
              <Button
                id={trackingId(scope, 'button', 'load-example', example.id)}
                variant="secondary"
                className="min-h-11"
                onClick={example.onLoad}
              >
                {ui['load-example']}: {example.label}
              </Button>
            </li>
          ))}
        </ul>
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
        {children}
        <div className="flex flex-wrap gap-3">
          {actions}
          <Button
            id={trackingId(scope, 'button', 'reset')}
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={onReset}
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
        <RichText variant="h3" id={`${id}-result`} className="text-lg font-bold">
          {ui['result-title']}
        </RichText>
        {result ? (
          <>
            {result.view}
            <SaveToHistory
              {...result.save}
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
