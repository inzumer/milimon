import { useEffect, useId, useRef, useState } from 'react';
import {
  createLocalSettingsRepository,
  CURRENCIES,
  DEFAULT_SETTINGS,
  type SettingsRepository,
} from '@repositories';
import { track, type Locale } from '@utils';

export interface CurrencySelectProps {
  lang: Locale;
  label: string;
  /** Injected in tests; defaults to the localStorage repository. */
  repository?: SettingsRepository;
}

const currencyName = (code: string, lang: Locale): string =>
  new Intl.DisplayNames([lang], { type: 'currency' }).of(code) ?? code;

/**
 * Currency used to display amounts in every calculator (display only, no conversion). Native
 * `<select>`: the ui-library has no Select yet and the native control is the most accessible on
 * mobile. Styled with the same input variables.
 */
export const CurrencySelect = ({
  lang,
  label,
  repository = createLocalSettingsRepository(),
}: CurrencySelectProps) => {
  const id = useId();
  const [currency, setCurrency] = useState<string>(DEFAULT_SETTINGS.currency);
  const settingsRef = useRef(repository);

  // Read once after hydration, so the server markup (default currency) matches the first render.
  useEffect(() => {
    setCurrency(settingsRef.current.load().currency);
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--text-primary)]">
        {label}
      </label>
      <select
        id={id}
        value={currency}
        onChange={(event) => {
          const next = event.target.value;
          setCurrency(next);
          settingsRef.current.save({ currency: next });
          track('currency_changed', { currency: next });
        }}
        className="min-h-11 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-base text-[var(--input-text)] focus-visible:border-[var(--input-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:outline-none"
      >
        {CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code} — {currencyName(code, lang)}
          </option>
        ))}
      </select>
    </div>
  );
};
