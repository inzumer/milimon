import { useEffect, useRef, useState } from 'react';
import { Select } from '@inzumer/ui-library';
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

/** Currency used to display amounts in every calculator (display only, no conversion). */
export const CurrencySelect = ({
  lang,
  label,
  repository = createLocalSettingsRepository(),
}: CurrencySelectProps) => {
  const [currency, setCurrency] = useState<string>(DEFAULT_SETTINGS.currency);
  const settingsRef = useRef(repository);

  // Read once after hydration, so the server markup (default currency) matches the first render.
  useEffect(() => {
    setCurrency(settingsRef.current.load().currency);
  }, []);

  return (
    <Select
      label={label}
      inputSize="lg"
      value={currency}
      onChange={(event) => {
        const next = event.target.value;
        setCurrency(next);
        settingsRef.current.save({ currency: next });
        track('currency_changed', { currency: next });
      }}
    >
      {CURRENCIES.map((code) => (
        <option key={code} value={code}>
          {code} — {currencyName(code, lang)}
        </option>
      ))}
    </Select>
  );
};
