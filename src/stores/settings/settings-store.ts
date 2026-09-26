import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SETTINGS_STORAGE_KEY } from '@constants';
import { plainJsonStorage } from '@stores/persist';
import { isLocale, type Locale } from '@utils';

export type ColorScheme = 'light' | 'dark';

export type AnalyticsConsent = 'granted' | 'denied';

export interface Settings {
  colorScheme: ColorScheme | null;
  locale: Locale | null;
  currency: string;
  analyticsConsent: AnalyticsConsent | null;
}

export interface SettingsState extends Settings {
  update: (patch: Partial<Settings>) => void;
}

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  colorScheme: null,
  locale: null,
  currency: 'ARS',
  analyticsConsent: null,
};

/** Currencies offered in the settings (display only; any ISO 4217 code is accepted). */
export const CURRENCIES = ['ARS', 'USD', 'EUR', 'MXN', 'CLP', 'UYU', 'COP', 'PEN', 'BRL'] as const;

const isColorScheme = (value: unknown): value is ColorScheme =>
  value === 'light' || value === 'dark';

const isConsent = (value: unknown): value is AnalyticsConsent =>
  value === 'granted' || value === 'denied';

const isCurrencyCode = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Z]{3}$/.test(value);

/** Keeps only valid, known fields. */
export const sanitizeSettings = (raw: unknown): Settings => {
  const data = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    colorScheme: isColorScheme(data['colorScheme']) ? data['colorScheme'] : null,
    locale: isLocale(data['locale']) ? data['locale'] : null,
    currency: isCurrencyCode(data['currency']) ? data['currency'] : DEFAULT_SETTINGS.currency,
    analyticsConsent: isConsent(data['analyticsConsent']) ? data['analyticsConsent'] : null,
  };
};

/** Theme, language, currency and analytics consent of this device (synced to the account). */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(sanitizeSettings({ ...sanitizeSettings(get()), ...patch })),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      partialize: (state) => sanitizeSettings(state),
      storage: plainJsonStorage<Settings>((state) => state, sanitizeSettings),
    },
  ),
);
