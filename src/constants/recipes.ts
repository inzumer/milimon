/** Recipe categories (Keystatic select, content schema and the recipe filters). */
export const RECIPE_CATEGORIES = ['sweet', 'savory', 'bread', 'drinks'] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

/** Query parameter that keeps the chosen filter in the URL, so it can be shared. */
export const RECIPE_FILTER_PARAM = 'category';
