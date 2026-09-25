import { formatCurrency, formatNumber, formatPercentage, parseDecimal } from '../numbers';

/** Intl uses narrow/regular no-break spaces depending on the runtime; compare with plain spaces. */
const plain = (text: string) => text.replace(/[  ]/g, ' ');

describe('parseDecimal', () => {
  it.each([
    ['2,400', 2.4],
    ['0,180', 0.18],
    ['1.234,56', 1234.56],
    ['1.234.567', 1_234_567],
    ['2.400', 2400],
    ['0.180', 0.18],
    ['2.5', 2.5],
    ['30', 30],
    ['30 %', 30],
    ['$ 12,50', 12.5],
    ['-5,5', -5.5],
    [',5', 0.5],
  ])('es: "%s" → %d', (raw, expected) => {
    expect(parseDecimal(raw, 'es')).toBe(expected);
  });

  it.each([
    ['2.400', 2.4],
    ['2,400', 2400],
    ['1,234.56', 1234.56],
    ['1,234,567', 1_234_567],
    ['0,180', 0.18],
    ['2,5', 2.5],
    ['1.234,5', 1234.5],
  ])('en: "%s" → %d', (raw, expected) => {
    expect(parseDecimal(raw, 'en')).toBe(expected);
  });

  it.each(['', '   ', '-', 'abc', '1,2,3.4.5', '12a', '1..2'])('rejects "%s"', (raw) => {
    expect(parseDecimal(raw, 'es')).toBeNull();
  });
});

describe('formatting', () => {
  it('formats numbers per locale', () => {
    expect(formatNumber(51.428571, 'es')).toBe('51,429');
    expect(formatNumber(51.428571, 'en')).toBe('51.429');
    expect(formatNumber(1_118_000, 'es')).toBe('1.118.000');
    expect(formatNumber(2.4, 'es', { minimumFractionDigits: 3 })).toBe('2,400');
  });

  it('formats currency with the configured code', () => {
    expect(plain(formatCurrency(34.7419, 'es', 'ARS'))).toBe('$ 34,74');
    expect(plain(formatCurrency(1_118_000, 'en', 'USD'))).toBe('$1,118,000.00');
  });

  it('formats percentages given on the 0–100 scale', () => {
    expect(plain(formatPercentage(29.1667, 'es'))).toBe('29,17%');
    expect(formatPercentage(29.1667, 'en')).toBe('29.17%');
    expect(formatPercentage(30, 'en', 0)).toBe('30%');
  });
});
