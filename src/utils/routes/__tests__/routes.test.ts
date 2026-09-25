import { isActivePath, localizedPath, switchLocalePath } from '../routes';

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
});
