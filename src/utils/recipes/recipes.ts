import type { Locale } from '@utils/locale';

/** A text edited in both languages; English may be empty. */
export interface LocalizedText {
  es: string;
  en: string;
}

/** The text in `lang`, falling back to Spanish when the translation is missing. */
export const localize = (text: LocalizedText, lang: Locale): string =>
  (lang === 'en' && text.en.trim()) || text.es;

/** The recipe title in `lang` (`title` is the English one, which sets the address). */
export const recipeTitle = (recipe: { title: string; titleEs: string }, lang: Locale): string =>
  lang === 'en' ? recipe.title : recipe.titleEs;

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

/** Texts of a recipe card: title, "Category · 70 min" and the photo description. */
export const recipeCardText = (
  recipe: {
    title: string;
    titleEs: string;
    category: string;
    minutes: number | null;
    photoAlt: LocalizedText;
  },
  lang: Locale,
  labels: { categories: Record<string, string>; minutes: string },
) => ({
  title: recipeTitle(recipe, lang),
  subtitle: [
    labels.categories[recipe.category] ?? recipe.category,
    recipe.minutes ? labels.minutes.replace('{minutes}', String(recipe.minutes)) : '',
  ]
    .filter(Boolean)
    .join(' · '),
  alt: localize(recipe.photoAlt, lang),
});
