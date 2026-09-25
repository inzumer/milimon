import { Language } from '@inzumer/ui-library';
import { createLocalSettingsRepository, type SettingsRepository } from '@repositories';
import { isLocale, LOCALES, switchLocalePath, track, type Locale } from '@utils';

const OPTIONS = LOCALES.map((value) => ({ value, label: value.toUpperCase() }));

export interface LanguageSwitcherProps {
  lang: Locale;
  pathname: string;
  /** Accessible name of the group, e.g. "Idioma". */
  label: string;
  /** Injected in tests; defaults to a full page navigation. */
  navigate?: (href: string) => void;
  repository?: SettingsRepository;
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
  navigate = defaultNavigate,
  repository = createLocalSettingsRepository(),
}: LanguageSwitcherProps) => (
  <Language
    aria-label={label}
    options={OPTIONS}
    value={lang}
    onChange={(next) => {
      if (!isLocale(next) || next === lang) {
        return;
      }
      repository.save({ locale: next });
      track('language_changed', { from: lang, to: next });
      navigate(`${switchLocalePath(pathname, next)}${window.location.hash}`);
    }}
  />
);
