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

/** Photos need their description in both languages. */
const describedPhoto = <T extends { photo?: unknown; photoAlt: { es: string; en: string } }>(
  value: T,
) => !value.photo || (value.photoAlt.es.trim() !== '' && value.photoAlt.en.trim() !== '');
const ALT_MESSAGE = 'Every photo needs its description (alt text) in Spanish and English.';

/** Recipes edited with Keystatic (`keystatic.config.ts`), one YAML file each. */
const recipes = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/recipes' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        titleEs: z.string().min(1),
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
          .array(
            z
              .object({
                text: localized,
                photo: image().nullable().optional(),
                photoAlt: optionalLocalized.default({ es: '', en: '' }),
              })
              .refine(describedPhoto, ALT_MESSAGE),
          )
          .default([]),
        featured: z.boolean().default(false),
        draft: z.boolean().default(true),
      })
      .refine(describedPhoto, ALT_MESSAGE),
});

/** Blog articles edited with Keystatic: `<slug>/index.yaml` plus `<slug>/content/{es,en}.mdoc`. */
const blog = defineCollection({
  loader: glob({ pattern: '*/index.yaml', base: './src/content/blog' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        titleEs: z.string().min(1),
        description: localized,
        date: z.coerce.date(),
        cover: image().nullable().optional(),
        coverAlt: optionalLocalized.default({ es: '', en: '' }),
        draft: z.boolean().default(true),
      })
      .refine(
        ({ cover, coverAlt }) => describedPhoto({ photo: cover, photoAlt: coverAlt }),
        ALT_MESSAGE,
      ),
});

const blogContent = defineCollection({
  loader: glob({ pattern: '*/content/*.mdoc', base: './src/content/blog' }),
});

export const collections = { suggestions, recipes, blog, blogContent };
