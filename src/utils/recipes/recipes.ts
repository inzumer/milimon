import type { Locale } from '@utils/locale';

/** A text edited in both languages; English may be empty. */
export interface LocalizedText {
  es: string;
  en: string;
}

/** The text in `lang`, falling back to Spanish when the translation is missing. */
export const localize = (text: LocalizedText, lang: Locale): string =>
  (lang === 'en' && text.en.trim()) || text.es;

/** The recipe title in `lang` (Spanish title plus optional English one). */
export const recipeTitle = (recipe: { title: string; titleEn: string }, lang: Locale): string =>
  localize({ es: recipe.title, en: recipe.titleEn }, lang);

/** Published recipes (drafts left out), featured first, then by title. */
export const publishedRecipes = <
  T extends { id: string; data: { draft: boolean; featured: boolean; title: string } },
>(
  entries: readonly T[],
): T[] =>
  entries
    .filter((entry) => !entry.data.draft)
    .sort(
      (a, b) =>
        Number(b.data.featured) - Number(a.data.featured) ||
        a.data.title.localeCompare(b.data.title, 'es'),
    );
