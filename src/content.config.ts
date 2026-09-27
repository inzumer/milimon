import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

/** Internal suggestion documents, shown to editors and admins (see `ADMIN_DOCS`). */
const suggestions = defineCollection({
  loader: glob({ pattern: '[0-9][0-9]-*.md', base: './docs/suggestions' }),
});

export const collections = { suggestions };
