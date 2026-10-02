/** Content editor (Keystatic), online only on staging, on the cms/draft branch (published to dev by cms-to-dev). */
export const CMS_URL = 'https://milimon-staging.inzumer.workers.dev/keystatic/branch/cms%2Fdraft';

/** Tab titles of the CMS screens (Keystatic sets none). */
export const CMS_TITLES = {
  collections: {
    blog: { list: 'Blog', create: 'Nuevo artículo' },
    recipes: { list: 'Recetas', create: 'Nueva receta' },
  },
  home: 'Inicio',
  suffix: 'Editor de Milimon',
} as const;

/** Where each entry is seen on the site; Keystatic's "Preview" opens it ({slug} is filled in). */
export const CMS_PREVIEW_PATHS = {
  blog: '/es/blog/{slug}',
  recipes: '/es/recipes/{slug}',
} as const;
