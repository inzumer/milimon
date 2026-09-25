import { formatInputValue, formatValue } from '../format-value';

const plain = (text: string) => text.replace(/[  ]/g, ' ');
const es = { lang: 'es', currency: 'ARS' } as const;
const en = { lang: 'en', currency: 'USD' } as const;

describe('formatValue', () => {
  it('should format each kind the way the manual writes it', () => {
    expect(formatValue(51.428571, 'weight', es)).toBe('51,429');
    expect(formatValue(1.428571, 'factor', es)).toBe('1,429');
    expect(formatValue(1.422839, 'rate', es)).toBe('1,4228');
    expect(formatValue(26.4, 'area', es)).toBe('26,4');
    expect(formatValue(33.846, 'count', es)).toBe('33,85');
    expect(formatValue(36, 'months', es)).toBe('36');
  });

  it('should format currency with the configured code and percentages', () => {
    expect(plain(formatValue(34.7419, 'currency', es))).toBe('$ 34,74');
    expect(formatValue(1_118_000, 'currency', en)).toBe('$1,118,000.00');
    expect(formatValue(29.1667, 'percentage', en)).toBe('29.17%');
  });

  it('should fall back to two decimals for unknown, text and toggle kinds', () => {
    expect(formatValue(2.345, undefined, es)).toBe('2,35');
    expect(formatValue(2.345, 'text', en)).toBe('2.35');
    expect(formatValue(1, 'toggle', en)).toBe('1');
  });
});

describe('formatInputValue', () => {
  it('should keep enough decimals to parse the value back', () => {
    expect(formatInputValue(0.18, 'es')).toBe('0,18');
    expect(formatInputValue(332_248.05, 'es')).toBe('332.248,05');
    expect(formatInputValue(3_000_000, 'en')).toBe('3,000,000');
  });
});
