import { localize, publishedRecipes, recipeTitle } from '../recipes';

const entry = (id: string, title: string, draft = false, featured = false) => ({
  id,
  data: { title, draft, featured },
});

describe('recipes', () => {
  it('should use the English text and fall back to Spanish when it is missing', () => {
    expect(localize({ es: 'Budín', en: 'Loaf' }, 'en')).toBe('Loaf');
    expect(localize({ es: 'Budín', en: '  ' }, 'en')).toBe('Budín');
    expect(localize({ es: 'Budín', en: 'Loaf' }, 'es')).toBe('Budín');
  });

  it('should give the title in each language', () => {
    const recipe = { title: 'Budín de limón', titleEn: 'Lemon loaf' };
    expect(recipeTitle(recipe, 'es')).toBe('Budín de limón');
    expect(recipeTitle(recipe, 'en')).toBe('Lemon loaf');
    expect(recipeTitle({ ...recipe, titleEn: '' }, 'en')).toBe('Budín de limón');
  });

  it('should leave drafts out and list featured recipes first, then by title', () => {
    const result = publishedRecipes([
      entry('scones', 'Scones'),
      entry('draft', 'Borrador', true),
      entry('quiche', 'Quiche', false, true),
      entry('lemon-loaf', 'Budín'),
    ]);
    expect(result.map(({ id }) => id)).toEqual(['quiche', 'lemon-loaf', 'scones']);
  });
});
