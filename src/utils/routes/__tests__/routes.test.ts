import {
  canonicalPath,
  isActivePath,
  localizedPath,
  stripBase,
  switchLocalePath,
  withBase,
} from '../routes';

describe('routes', () => {
  it('should turn built file paths into the clean public path', () => {
    expect(canonicalPath('/milimon/es/blog/milicitos.html')).toBe('/milimon/es/blog/milicitos');
    expect(canonicalPath('/es/index.html')).toBe('/es');
    expect(canonicalPath('/es/learn')).toBe('/es/learn');
    expect(canonicalPath('/index.html')).toBe('/');
  });

  it('should build localized paths with English slugs', () => {
    expect(localizedPath('es', 'home')).toBe('/es');
    expect(localizedPath('en', 'calculator')).toBe('/en/calculator');
    expect(localizedPath('es', 'formulas', 'cooking-loss')).toBe('/es/formulas/cooking-loss');
  });

  it.each([
    ['/es/formulas/cooking-loss', 'en', '/en/formulas/cooking-loss'],
    ['/en/calculator/', 'es', '/es/calculator'],
    ['/es', 'en', '/en'],
    ['/', 'en', '/en'],
    ['/formulas', 'es', '/es/formulas'],
  ] as const)('should switch %s to %s → %s', (pathname, lang, expected) => {
    expect(switchLocalePath(pathname, lang)).toBe(expected);
  });

  it('should mark the locale root as active only on exact match', () => {
    expect(isActivePath('/es', '/es')).toBe(true);
    expect(isActivePath('/es/', '/es')).toBe(true);
    expect(isActivePath('/es/formulas', '/es')).toBe(false);
  });

  it('should mark sections as active for nested pages', () => {
    expect(isActivePath('/es/formulas', '/es/formulas')).toBe(true);
    expect(isActivePath('/es/formulas/cooking-loss', '/es/formulas')).toBe(true);
    expect(isActivePath('/es/formulas-old', '/es/formulas')).toBe(false);
    expect(isActivePath('/', '/es/formulas')).toBe(false);
  });

  describe('under a base path (GitHub Pages)', () => {
    const BASE = '/milimon';

    it('should add and remove the base', () => {
      expect(withBase('/og/og-es.png', BASE)).toBe('/milimon/og/og-es.png');
      expect(withBase('favicon.ico', BASE)).toBe('/milimon/favicon.ico');
      expect(withBase('/es', '')).toBe('/es');
      expect(stripBase('/milimon/es/learn', BASE)).toBe('/es/learn');
      expect(stripBase('/milimon', BASE)).toBe('/');
      expect(stripBase('/milimon-app/es', BASE)).toBe('/milimon-app/es');
      expect(stripBase('/es', '')).toBe('/es');
    });

    it('should switch languages keeping the base', () => {
      expect(switchLocalePath('/milimon/es/formulas/cooking-loss', 'en', BASE)).toBe(
        '/milimon/en/formulas/cooking-loss',
      );
      expect(switchLocalePath('/milimon/', 'es', BASE)).toBe('/milimon/es');
    });

    it('should detect the active section with the base', () => {
      expect(isActivePath('/milimon/es', '/milimon/es', BASE)).toBe(true);
      expect(isActivePath('/milimon/es/formulas/x', '/milimon/es', BASE)).toBe(false);
      expect(isActivePath('/milimon/es/formulas/x', '/milimon/es/formulas', BASE)).toBe(true);
    });
  });
});
