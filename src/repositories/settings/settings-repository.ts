import {
  getBrowserStorage,
  isLocale,
  readJson,
  writeJson,
  type KeyValueStorage,
  type Locale,
} from '@utils';

export type ColorScheme = 'light' | 'dark';

export interface Settings {
  /** Explicit choice; `null` follows the operating system (`prefers-color-scheme`). */
  colorScheme: ColorScheme | null;
  /** Last language the user picked; `null` lets the root redirect detect it from the browser. */
  locale: Locale | null;
  /** ISO 4217 code used to display amounts (display only, no conversion). */
  currency: string;
  /** Analytics cookies: `null` until the person answers the consent banner. */
  analyticsConsent: AnalyticsConsent | null;
}

export type AnalyticsConsent = 'granted' | 'denied';

/** Shared with the inline theme/redirect scripts in `.astro` files, which can't import modules. */
export const SETTINGS_STORAGE_KEY = 'milimon:settings';

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  colorScheme: null,
  locale: null,
  currency: 'ARS',
  analyticsConsent: null,
};

export interface SettingsRepository {
  load: () => Settings;
  save: (patch: Partial<Settings>) => Settings;
}

const isColorScheme = (value: unknown): value is ColorScheme =>
  value === 'light' || value === 'dark';

const isConsent = (value: unknown): value is AnalyticsConsent =>
  value === 'granted' || value === 'denied';

const isCurrencyCode = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Z]{3}$/.test(value);

/** Keeps only valid, known fields so corrupted or outdated data never reaches the UI. */
const sanitize = (raw: unknown): Settings => {
  const data = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    colorScheme: isColorScheme(data['colorScheme']) ? data['colorScheme'] : null,
    locale: isLocale(data['locale']) ? data['locale'] : null,
    currency: isCurrencyCode(data['currency']) ? data['currency'] : DEFAULT_SETTINGS.currency,
    analyticsConsent: isConsent(data['analyticsConsent']) ? data['analyticsConsent'] : null,
  };
};

/** `localStorage`-backed implementation. A remote (per-profile) one replaces it in phase F10. */
export const createLocalSettingsRepository = (
  storage: KeyValueStorage | null = getBrowserStorage(),
): SettingsRepository => ({
  load: () => sanitize(readJson(storage, SETTINGS_STORAGE_KEY)),
  save: (patch) => {
    const next = sanitize({ ...sanitize(readJson(storage, SETTINGS_STORAGE_KEY)), ...patch });
    writeJson(storage, SETTINGS_STORAGE_KEY, next);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent<Settings>(SETTINGS_CHANGED_EVENT, { detail: next }));
    }
    return next;
  },
});

/** Fired on `window` after every save, so every island (menu, calculators) stays in sync. */
export const SETTINGS_CHANGED_EVENT = 'milimon:settings-changed';

/** Subscribes to settings changes; returns the unsubscribe function. */
export const onSettingsChange = (listener: (settings: Settings) => void): (() => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<Settings>).detail);
  window.addEventListener(SETTINGS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handler);
};

/** Currencies offered in the settings (display only; any ISO 4217 code is accepted). */
export const CURRENCIES = ['ARS', 'USD', 'EUR', 'MXN', 'CLP', 'UYU', 'COP', 'PEN', 'BRL'] as const;
