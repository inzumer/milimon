import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SAVED_RECIPES_LIMIT, SAVED_RECIPES_STORAGE_KEY } from '@constants';
import { plainJsonStorage } from '@stores/persist';

export interface SavedRecipesState {
  ids: string[];
  toggle: (id: string) => void;
  replaceAll: (ids: string[]) => void;
}

/** Unique recipe ids, newest first, at most `SAVED_RECIPES_LIMIT`. */
export const normalizeSavedRecipes = (raw: unknown): string[] =>
  [...new Set(Array.isArray(raw) ? raw.filter((id) => typeof id === 'string' && id) : [])].slice(
    0,
    SAVED_RECIPES_LIMIT,
  );

/** Recipes saved on this device, newest first (synced to the account). */
export const useSavedRecipesStore = create<SavedRecipesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const ids = get().ids;
        set({
          ids: ids.includes(id)
            ? ids.filter((saved) => saved !== id)
            : normalizeSavedRecipes([id, ...ids]),
        });
      },
      replaceAll: (ids) => set({ ids: normalizeSavedRecipes(ids) }),
    }),
    {
      name: SAVED_RECIPES_STORAGE_KEY,
      partialize: ({ ids }) => ({ ids }),
      storage: plainJsonStorage<Pick<SavedRecipesState, 'ids'>>(
        ({ ids }) => ids,
        (raw) => ({ ids: normalizeSavedRecipes(raw) }),
      ),
    },
  ),
);
