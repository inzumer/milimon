import { isActivePath, localizedPath, stripBase, switchLocalePath, withBase } from '../routes';

describe('routes', () => {
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
    const BASE = '/milimon-cost-lab';

    it('should add and remove the base', () => {
      expect(withBase('/og/og-es.png', BASE)).toBe('/milimon-cost-lab/og/og-es.png');
      expect(withBase('favicon.ico', BASE)).toBe('/milimon-cost-lab/favicon.ico');
      expect(withBase('/es', '')).toBe('/es');
      expect(stripBase('/milimon-cost-lab/es/learn', BASE)).toBe('/es/learn');
      expect(stripBase('/milimon-cost-lab', BASE)).toBe('/');
      expect(stripBase('/milimon-cost-labs/es', BASE)).toBe('/milimon-cost-labs/es');
      expect(stripBase('/es', '')).toBe('/es');
    });

    it('should switch languages keeping the base', () => {
      expect(switchLocalePath('/milimon-cost-lab/es/formulas/cooking-loss', 'en', BASE)).toBe(
        '/milimon-cost-lab/en/formulas/cooking-loss',
      );
      expect(switchLocalePath('/milimon-cost-lab/', 'es', BASE)).toBe('/milimon-cost-lab/es');
    });

    it('should detect the active section with the base', () => {
      expect(isActivePath('/milimon-cost-lab/es', '/milimon-cost-lab/es', BASE)).toBe(true);
      expect(isActivePath('/milimon-cost-lab/es/formulas/x', '/milimon-cost-lab/es', BASE)).toBe(
        false,
      );
      expect(
        isActivePath('/milimon-cost-lab/es/formulas/x', '/milimon-cost-lab/es/formulas', BASE),
      ).toBe(true);
    });
  });
});
