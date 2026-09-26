import { Select } from '@inzumer/ui-library';
import { CURRENCIES } from '@constants';
import { useSettingsStore } from '@stores';
import { track, type Locale } from '@utils';

export interface CurrencySelectProps {
  lang: Locale;
  label: string;
}

const currencyName = (code: string, lang: Locale): string =>
  new Intl.DisplayNames([lang], { type: 'currency' }).of(code) ?? code;

/** Currency used to display amounts in every calculator (display only, no conversion). */
export const CurrencySelect = ({ lang, label }: CurrencySelectProps) => {
  const currency = useSettingsStore((state) => state.currency);
  const update = useSettingsStore((state) => state.update);

  return (
    <Select
      label={label}
      inputSize="lg"
      value={currency}
      onChange={(event) => {
        const next = event.target.value;
        update({ currency: next });
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
