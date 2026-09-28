import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Internal suggestion documents, shown to editors and admins (see `ADMIN_DOCS`). */
const suggestions = defineCollection({
  loader: glob({ pattern: '[0-9][0-9]-*.md', base: './docs/suggestions' }),
});

/** Spanish is required; English falls back to Spanish. */
const localized = z.object({ es: z.string().min(1), en: z.string().default('') });
const optionalLocalized = z.object({ es: z.string().default(''), en: z.string().default('') });

/** Recipes edited with Keystatic (`keystatic.config.ts`), one YAML file each. */
const recipes = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/recipes' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      titleEn: z.string().default(''),
      summary: localized,
      category: z.enum(['sweet', 'savory', 'bread', 'drinks']),
      minutes: z.number().int().positive().nullable(),
      servings: z.number().int().positive().nullable(),
      photo: image().nullable().optional(),
      photoAlt: optionalLocalized.default({ es: '', en: '' }),
      ingredients: z
        .array(z.object({ amount: z.string().default(''), name: localized }))
        .default([]),
      steps: z
        .array(z.object({ text: localized, photo: image().nullable().optional() }))
        .default([]),
      featured: z.boolean().default(false),
      draft: z.boolean().default(true),
    }),
});

export const collections = { suggestions, recipes };
