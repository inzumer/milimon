import { useSettingsStore } from '@stores';

/** Configured currency: the default until hydration, then the saved one. */
export const useCurrency = (): string => useSettingsStore((state) => state.currency);
