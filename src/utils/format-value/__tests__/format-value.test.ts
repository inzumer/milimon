import { formatInputValue, formatValue } from '../format-value';

const plain = (text: string) => text.replace(/[  ]/g, ' ');
const es = { lang: 'es', currency: 'ARS' } as const;
const en = { lang: 'en', currency: 'USD' } as const;

describe('formatValue', () => {
  it('should format each kind with its usual decimals', () => {
    expect(formatValue(2.4567, 'weight', es)).toBe('2,457');
    expect(formatValue(1.333333, 'factor', es)).toBe('1,333');
    expect(formatValue(1.417099, 'rate', es)).toBe('1,4171');
    expect(formatValue(37.4, 'area', es)).toBe('37,4');
    expect(formatValue(35.714, 'count', es)).toBe('35,71');
    expect(formatValue(48, 'months', es)).toBe('48');
  });

  it('should format currency with the configured code and percentages', () => {
    expect(plain(formatValue(51.7019, 'currency', es))).toBe('$ 51,70');
    expect(formatValue(1_570_000, 'currency', en)).toBe('$1,570,000.00');
    expect(formatValue(5.4157, 'percentage', en)).toBe('5.42%');
  });

  it('should fall back to two decimals for unknown, text and toggle kinds', () => {
    expect(formatValue(2.345, undefined, es)).toBe('2,35');
    expect(formatValue(2.345, 'text', en)).toBe('2.35');
    expect(formatValue(1, 'toggle', en)).toBe('1');
  });
});

describe('formatInputValue', () => {
  it('should keep enough decimals to parse the value back', () => {
    expect(formatInputValue(0.16, 'es')).toBe('0,16');
    expect(formatInputValue(462_102.5, 'es')).toBe('462.102,5');
    expect(formatInputValue(4_800_000, 'en')).toBe('4,800,000');
  });
});
