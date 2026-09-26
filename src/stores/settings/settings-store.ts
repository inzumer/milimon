import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CURRENCIES, DEFAULT_CURRENCY, SETTINGS_STORAGE_KEY } from '@constants';
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
  currency: DEFAULT_CURRENCY,
  analyticsConsent: null,
};

const isColorScheme = (value: unknown): value is ColorScheme =>
  value === 'light' || value === 'dark';

const isConsent = (value: unknown): value is AnalyticsConsent =>
  value === 'granted' || value === 'denied';

const isCurrency = (value: unknown): value is string =>
  CURRENCIES.some((currency) => currency === value);

/** Keeps only valid, known fields. */
export const sanitizeSettings = (raw: unknown): Settings => {
  const data = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    colorScheme: isColorScheme(data['colorScheme']) ? data['colorScheme'] : null,
    locale: isLocale(data['locale']) ? data['locale'] : null,
    currency: isCurrency(data['currency']) ? data['currency'] : DEFAULT_SETTINGS.currency,
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
