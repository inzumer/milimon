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

/**
 * Currency used to display amounts in every calculator (display only, no conversion). A themed
 * ui-library `Dropdown`, so the list keeps the site's styles on every device.
 */
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
