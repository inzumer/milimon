import { Language } from '@inzumer/ui-library';
import { useSettingsStore } from '@stores';
import { isLocale, LOCALES, switchLocalePath, track, trackingId, type Locale } from '@utils';

const OPTIONS = LOCALES.map((value) => ({ value, label: value.toUpperCase() }));

export interface LanguageSwitcherProps {
  lang: Locale;
  pathname: string;
  label: string;
  /** Id of a short text explaining the selector. */
  describedBy?: string;
  navigate?: (href: string) => void;
}

const defaultNavigate = (href: string) => {
  window.location.assign(href);
};

/**
 * ES / EN switch (ui-library `Language`). Keeps the current route, since slugs are the same in
 * every locale, and remembers the choice for the root redirect.
 */
export const LanguageSwitcher = ({
  lang,
  pathname,
  label,
  describedBy,
  navigate = defaultNavigate,
}: LanguageSwitcherProps) => (
  <Language
    id={trackingId('settings', 'select', 'language')}
    aria-label={label}
    aria-describedby={describedBy}
    className="w-fit self-start"
    options={OPTIONS}
    value={lang}
    onChange={(next) => {
      if (!isLocale(next) || next === lang) {
        return;
      }
      useSettingsStore.getState().update({ locale: next });
      track('language_changed', { from: lang, to: next });
      navigate(`${switchLocalePath(pathname, next)}${window.location.hash}`);
    }}
  />
);
