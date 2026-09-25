import type { ValueKind } from '@domain/registry';
import { formatCurrency, formatNumber, formatPercentage, type Locale } from '@utils';

export interface FormatContext {
  lang: Locale;
  currency: string;
}

/** Decimal places per kind, matching how the manual writes each value (1,429 · 51,429 kg · 1,42). */
const MAX_DECIMALS: Partial<Record<ValueKind, number>> = {
  weight: 3,
  factor: 3,
  rate: 4,
  area: 2,
  count: 2,
  months: 0,
};

export const formatValue = (
  value: number,
  kind: ValueKind | 'text' | undefined,
  context: FormatContext,
): string => {
  switch (kind) {
    case 'currency':
      return formatCurrency(value, context.lang, context.currency);
    case 'percentage':
      return formatPercentage(value, context.lang);
    case undefined:
    case 'text':
    case 'toggle':
      return formatNumber(value, context.lang, { maximumFractionDigits: 2 });
    default:
      return formatNumber(value, context.lang, { maximumFractionDigits: MAX_DECIMALS[kind] ?? 2 });
  }
};

/** Formats a raw value for an input field (no currency symbol, enough decimals to round-trip). */
export const formatInputValue = (value: number, lang: Locale): string =>
  formatNumber(value, lang, { maximumFractionDigits: 6 });
