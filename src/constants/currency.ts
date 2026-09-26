/** Currencies offered in the settings (display only, no conversion). The first one is the default. */
export const CURRENCIES = ['ARS', 'USD', 'EUR'] as const;

export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = 'ARS';
