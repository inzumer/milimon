import { useSettingsStore } from '@stores';

/**
 * Currency configured in the settings. The server markup (and hydration) use the default; the
 * saved one applies right after and follows later changes (e.g. from the menu).
 */
export const useCurrency = (): string => useSettingsStore((state) => state.currency);
