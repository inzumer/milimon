import { localize, publishedRecipes, recipeCardText, recipeTitle } from '../recipes';

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
    const recipe = { title: 'Lemon loaf', titleEs: 'Budín de limón' };
    expect(recipeTitle(recipe, 'es')).toBe('Budín de limón');
    expect(recipeTitle(recipe, 'en')).toBe('Lemon loaf');
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

  it('should keep drafts when asked (staging)', () => {
    const result = publishedRecipes(
      [entry('scones', 'Scones'), entry('draft', 'Borrador', true)],
      true,
    );
    expect(result.map(({ id }) => id)).toEqual(['draft', 'scones']);
  });

  it('should build the card texts with category and time', () => {
    const recipe = {
      title: 'Lemon loaf',
      titleEs: 'Budín de limón',
      category: 'sweet',
      minutes: 70,
      photoAlt: { es: 'Budín en un plato', en: '' },
    };
    const labels = { categories: { sweet: 'Dulce' }, minutes: '{minutes} min' };
    expect(recipeCardText(recipe, 'es', labels)).toEqual({
      title: 'Budín de limón',
      subtitle: 'Dulce · 70 min',
      alt: 'Budín en un plato',
    });
    expect(recipeCardText({ ...recipe, minutes: null }, 'en', labels).subtitle).toBe('Dulce');
  });
});
