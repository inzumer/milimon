import { collection, config, fields } from '@keystatic/core';

/** English is optional and falls back to Spanish on the site. */
const localized = (label: string, { multiline = false, required = true } = {}) =>
  fields.object(
    {
      es: fields.text({ label: 'Español', multiline, validation: { isRequired: required } }),
      en: fields.text({ label: 'English', multiline }),
    },
    { label, layout: [6, 6] },
  );

export default config({
  storage: { kind: 'local' },
  ui: { brand: { name: 'Milimon' } },
  collections: {
    recipes: collection({
      label: 'Recetas',
      slugField: 'title',
      path: 'src/content/recipes/*',
      format: { data: 'yaml' },
      columns: ['title', 'category', 'draft'],
      entryLayout: 'form',
      schema: {
        title: fields.slug({
          name: { label: 'Título en español', validation: { isRequired: true } },
          slug: {
            label: 'Dirección',
            description: 'En inglés y con guiones, igual en los dos idiomas (ej.: lemon-loaf).',
          },
        }),
        titleEn: fields.text({ label: 'Título en inglés' }),
        summary: localized('Resumen (una o dos frases)', { multiline: true }),
        category: fields.select({
          label: 'Categoría',
          options: [
            { label: 'Dulce', value: 'sweet' },
            { label: 'Salado', value: 'savory' },
            { label: 'Panadería', value: 'bread' },
            { label: 'Bebidas', value: 'drinks' },
          ],
          defaultValue: 'sweet',
        }),
        minutes: fields.integer({ label: 'Tiempo total (minutos)', validation: { min: 1 } }),
        servings: fields.integer({ label: 'Porciones', validation: { min: 1 } }),
        photo: fields.image({
          label: 'Foto principal',
          description: 'Vertical 3:4, ver la guía de fotografía.',
          directory: 'src/assets/recipes',
          publicPath: '../../assets/recipes/',
        }),
        photoAlt: localized('Descripción de la foto', { required: false }),
        ingredients: fields.array(
          fields.object({
            amount: fields.text({ label: 'Cantidad (ej.: 200 g)' }),
            name: localized('Ingrediente'),
          }),
          { label: 'Ingredientes', itemLabel: (item) => item.fields.name.fields.es.value || '…' },
        ),
        steps: fields.array(
          fields.object({
            text: localized('Paso', { multiline: true }),
            photo: fields.image({
              label: 'Foto del paso (opcional)',
              directory: 'src/assets/recipes',
              publicPath: '../../assets/recipes/',
            }),
          }),
          { label: 'Pasos', itemLabel: (item) => item.fields.text.fields.es.value || '…' },
        ),
        featured: fields.checkbox({ label: 'Destacada en el inicio' }),
        draft: fields.checkbox({
          label: 'Borrador',
          description: 'Los borradores no se publican.',
          defaultValue: true,
        }),
      },
    }),
  },
});
