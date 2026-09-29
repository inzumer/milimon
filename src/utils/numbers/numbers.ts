import { NUMERIC_INPUT_DISALLOWED, PRICE_LIST_INPUT_DISALLOWED } from '@constants';
import type { Locale } from '@utils/locale';

/** Number formatting locale per app language (Argentine Spanish uses `.` for thousands, `,` for decimals). */
const NUMBER_LOCALES: Record<Locale, string> = {
  es: 'es-AR',
  en: 'en-US',
};

const DECIMAL_SEPARATOR: Record<Locale, ',' | '.'> = { es: ',', en: '.' };

/** `1.234` / `12.345` / `123.456` — a single separator followed by exactly three digits. */
const LOOKS_LIKE_GROUPING = /^[1-9]\d{0,2}[.,]\d{3}$/;

/** Plain digits, or digits grouped by `separator` in blocks of three (`1.234.567`). */
const isValidGrouping = (value: string, separator: string): boolean =>
  !value.includes(separator) || new RegExp(`^\\d{1,3}(\\${separator}\\d{3})+$`).test(value);

/** Parses typed numbers with `,` or `.` decimals and thousands grouping; `null` when invalid. */
export const parseDecimal = (raw: string, lang: Locale): number | null => {
  const cleaned = raw.replace(/[\s$% ]/g, '');
  if (cleaned === '' || cleaned === '-') {
    return null;
  }
  const sign = cleaned.startsWith('-') ? '-' : '';
  const body = sign ? cleaned.slice(1) : cleaned;

  const lastDot = body.lastIndexOf('.');
  const lastComma = body.lastIndexOf(',');
  let normalized: string;

  if (lastDot !== -1 && lastComma !== -1) {
    const decimal = lastDot > lastComma ? '.' : ',';
    const grouping = decimal === '.' ? ',' : '.';
    const [integerPart = '', fraction = ''] = body.split(decimal);
    if (!isValidGrouping(integerPart, grouping) || fraction.includes(grouping)) {
      return null;
    }
    normalized = `${integerPart.split(grouping).join('')}.${fraction}`;
  } else {
    const separator = lastDot !== -1 ? '.' : lastComma !== -1 ? ',' : null;
    const occurrences = separator ? body.split(separator).length - 1 : 0;
    if (!separator) {
      normalized = body;
    } else if (occurrences > 1) {
      if (!isValidGrouping(body, separator)) {
        return null;
      }
      normalized = body.split(separator).join('');
    } else if (separator !== DECIMAL_SEPARATOR[lang] && LOOKS_LIKE_GROUPING.test(body)) {
      normalized = body.replace(separator, '');
    } else {
      normalized = body.replace(separator, '.');
    }
  }

  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(normalized)) {
    return null;
  }
  return Number(`${sign}${normalized}`);
};

export interface FormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export const formatNumber = (value: number, lang: Locale, options: FormatOptions = {}): string =>
  new Intl.NumberFormat(NUMBER_LOCALES[lang], {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 3,
  }).format(value);

/** Money with the configured currency (display only — no conversion). */
export const formatCurrency = (value: number, lang: Locale, currency: string): string =>
  new Intl.NumberFormat(NUMBER_LOCALES[lang], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

/** `value` on the 0–100 scale (29.1667 → "29,17 %" / "29.17%"). */
export const formatPercentage = (value: number, lang: Locale, maximumFractionDigits = 2): string =>
  new Intl.NumberFormat(NUMBER_LOCALES[lang], {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value / 100);

/** Keeps only what a number can contain (digits, `,` and `.`) while the person types. */
export const keepNumericCharacters = (raw: string): string =>
  raw.replace(NUMERIC_INPUT_DISALLOWED, '');

/** Same for a list of numbers, keeping the separators between them (spaces, new lines, `;`). */
export const keepNumberListCharacters = (raw: string): string =>
  raw.replace(PRICE_LIST_INPUT_DISALLOWED, '');
