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
}

/** Shared with the inline theme/redirect scripts in `.astro` files, which can't import modules. */
export const SETTINGS_STORAGE_KEY = 'milimon:settings';

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  colorScheme: null,
  locale: null,
  currency: 'ARS',
};

export interface SettingsRepository {
  load: () => Settings;
  save: (patch: Partial<Settings>) => Settings;
}

const isColorScheme = (value: unknown): value is ColorScheme =>
  value === 'light' || value === 'dark';

const isCurrencyCode = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Z]{3}$/.test(value);

/** Keeps only valid, known fields so corrupted or outdated data never reaches the UI. */
const sanitize = (raw: unknown): Settings => {
  const data = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    colorScheme: isColorScheme(data['colorScheme']) ? data['colorScheme'] : null,
    locale: isLocale(data['locale']) ? data['locale'] : null,
    currency: isCurrencyCode(data['currency']) ? data['currency'] : DEFAULT_SETTINGS.currency,
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
    return next;
  },
});
