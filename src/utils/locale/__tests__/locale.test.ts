import { DEFAULT_LOCALE, isLocale, LOCALES, toLocale } from '../locale';

describe('locale', () => {
  it('should support Spanish and English, with Spanish as default', () => {
    expect(LOCALES).toStrictEqual(['es', 'en']);
    expect(DEFAULT_LOCALE).toBe('es');
  });

  it.each(['es', 'en'])('should recognize "%s" as a supported locale', (value) => {
    expect(isLocale(value)).toBe(true);
    expect(toLocale(value)).toBe(value);
  });

  it.each(['fr', 'ES', '', undefined, null, 42])(
    'should fall back to the default for %s',
    (value) => {
      expect(isLocale(value)).toBe(false);
      expect(toLocale(value)).toBe(DEFAULT_LOCALE);
    },
  );
});
