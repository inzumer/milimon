import { SAVED_RECIPES_LIMIT, SAVED_RECIPES_STORAGE_KEY } from '@constants';
import { normalizeSavedRecipes, useSavedRecipesStore } from '../saved-recipes-store';

describe('saved recipes store', () => {
  it('should save a recipe first and remove it on a second toggle', () => {
    const { toggle } = useSavedRecipesStore.getState();
    toggle('lemon-loaf');
    toggle('scones');
    expect(useSavedRecipesStore.getState().ids).toEqual(['scones', 'lemon-loaf']);
    toggle('lemon-loaf');
    expect(useSavedRecipesStore.getState().ids).toEqual(['scones']);
  });

  it('should persist the ids on this device', () => {
    useSavedRecipesStore.getState().toggle('lemon-loaf');
    expect(JSON.parse(window.localStorage.getItem(SAVED_RECIPES_STORAGE_KEY) ?? '[]')).toEqual([
      'lemon-loaf',
    ]);
  });

  it('should keep only unique, non-empty ids up to the limit', () => {
    expect(normalizeSavedRecipes(['a', 'a', '', 3, 'b'])).toEqual(['a', 'b']);
    expect(normalizeSavedRecipes('nope')).toEqual([]);
    const many = Array.from({ length: SAVED_RECIPES_LIMIT + 5 }, (_, i) => `r${i}`);
    expect(normalizeSavedRecipes(many)).toHaveLength(SAVED_RECIPES_LIMIT);
  });
});
