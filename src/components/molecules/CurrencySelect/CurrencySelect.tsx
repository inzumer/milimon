import { Dropdown } from '@inzumer/ui-library';
import { CURRENCIES } from '@constants';
import { useSettingsStore } from '@stores';
import { track, trackingId, type Locale } from '@utils';

export interface CurrencySelectProps {
  lang: Locale;
  label: string;
  hint?: string;
}

const currencyName = (code: string, lang: Locale): string =>
  new Intl.DisplayNames([lang], { type: 'currency' }).of(code) ?? code;

/** Display currency for every calculator (no conversion), as a themed `Dropdown`. */
export const CurrencySelect = ({ lang, label, hint }: CurrencySelectProps) => {
  const currency = useSettingsStore((state) => state.currency);
  const update = useSettingsStore((state) => state.update);

  return (
    <Dropdown
      id={trackingId('settings', 'select', 'currency')}
      label={label}
      {...(hint ? { hint } : {})}
      inputSize="lg"
      value={currency}
      options={CURRENCIES.map((code) => ({
        value: code,
        label: `${code} — ${currencyName(code, lang)}`,
      }))}
      onChange={(next) => {
        update({ currency: next });
        track('currency_changed', { currency: next });
      }}
    />
  );
};
