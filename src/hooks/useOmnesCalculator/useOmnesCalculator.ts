import { useMemo, useState } from 'react';
import { useCurrency } from '@hooks/useCurrency';
import { useDraft } from '@hooks/useDraft';
import { parseDecimal, track, type Locale } from '@utils';
import { formatInputValue } from '@utils/format-value';
import { calculateOmnesRules } from '@utils/formulas/omnes-rules';

/** 16 cakes between $ 40 and $ 115 with the balanced 4 / 8 / 4 split the manual describes. */
export const OMNES_EXAMPLE = {
  id: 'sixteen-cakes',
  prices: [40, 50, 55, 65, 70, 72, 75, 78, 80, 85, 88, 90, 95, 100, 110, 115],
  averageTicket: 80,
  dailySpecialPrice: 75,
} as const;

/** Splits a list typed one per line (or by spaces / semicolons); commas stay decimal separators. */
export const parsePriceList = (
  text: string,
  lang: Locale,
): { prices: number[]; invalid: string[] } => {
  const tokens = text.split(/[\s;]+/).filter((token) => token.length > 0);
  const prices: number[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    const value = parseDecimal(token, lang);
    if (value === null) {
      invalid.push(token);
    } else {
      prices.push(value);
    }
  }
  return { prices, invalid };
};

const EMPTY = { prices: '', averageTicket: '', dailySpecialPrice: '' };

export type OptionalField = 'averageTicket' | 'dailySpecialPrice';

export const useOmnesCalculator = ({ lang }: { lang: Locale }) => {
  const { draft, setDraft, resetDraft } = useDraft('omnes-rules', EMPTY);
  const currency = useCurrency();
  const [touched, setTouched] = useState(false);
  const [touchedOptional, setTouchedOptional] = useState<ReadonlySet<OptionalField>>(
    () => new Set(),
  );

  const text = (key: keyof typeof EMPTY) => {
    const value = draft[key];
    return typeof value === 'string' ? value : '';
  };
  const prices = text('prices');
  const averageTicket = text('averageTicket');
  const dailySpecialPrice = text('dailySpecialPrice');

  const { list, result } = useMemo(() => {
    const parsed = parsePriceList(prices, lang);
    const calculation = calculateOmnesRules({
      prices: parsed.prices,
      averageTicket: parseDecimal(averageTicket, lang),
      dailySpecialPrice: parseDecimal(dailySpecialPrice, lang),
    });
    return { list: parsed, result: calculation };
  }, [prices, averageTicket, dailySpecialPrice, lang]);

  return {
    /** Raw values as saved (for the history). */
    draft,
    currency,
    prices,
    averageTicket,
    dailySpecialPrice,
    setField: (key: keyof typeof EMPTY, value: string) => setDraft({ ...draft, [key]: value }),
    touch: () => setTouched(true),
    touched,
    list,
    result: result.ok && list.invalid.length === 0 ? result : null,
    errors: result.ok ? [] : result.errors,
    /** Error code of an optional field, once the person left it: unreadable number or domain rule. */
    optionalError: (key: OptionalField): string | undefined => {
      if (!touchedOptional.has(key)) {
        return undefined;
      }
      const raw = text(key).trim();
      if (raw !== '' && parseDecimal(raw, lang) === null) {
        return 'invalid-number';
      }
      return result.ok ? undefined : result.errors.find((error) => error.field === key)?.code;
    },
    touchOptional: (key: OptionalField) =>
      setTouchedOptional((current) => new Set(current).add(key)),
    loadExample: () => {
      setDraft({
        prices: OMNES_EXAMPLE.prices.map((price) => formatInputValue(price, lang)).join('\n'),
        averageTicket: formatInputValue(OMNES_EXAMPLE.averageTicket, lang),
        dailySpecialPrice: formatInputValue(OMNES_EXAMPLE.dailySpecialPrice, lang),
      });
      setTouched(true);
      track('example_loaded', { formula: 'omnes-rules', example: OMNES_EXAMPLE.id });
    },
    reset: () => {
      resetDraft();
      setTouched(false);
      setTouchedOptional(new Set());
      track('calculator_reset', { formula: 'omnes-rules' });
    },
  };
};
