import { z } from 'zod';
import type { FormulaId } from '@domain/registry';
import type { Locale } from '@utils/locale';

const text = z.string().trim().min(1);

const inputTextSchema = z.object({
  label: text,
  placeholder: text,
  hint: text.optional(),
});

/**
 * Shape of `src/i18n/formulas/<formula-id>/{es,en}.json`. Keys are kebab-case versions of the
 * registry keys (`grossWeight` → `gross-weight`). Validated when loaded, so broken content fails
 * the build instead of rendering holes.
 */
export const formulaTranslationSchema = z.object({
  title: text,
  summary: text,
  inputs: z.record(z.string(), inputTextSchema),
  outputs: z.record(z.string(), text),
  steps: z.record(z.string(), text),
  examples: z.record(z.string(), z.object({ title: text })),
  /** Labels for text results (e.g. `buy-gross`, `too-high`). */
  choices: z.record(z.string(), text).optional(),
  /** Field-specific error messages: `<input-key>.<error-code>`. */
  errors: z.record(z.string(), text).optional(),
});

export type FormulaTranslation = z.infer<typeof formulaTranslationSchema>;

const files = import.meta.glob<unknown>('./formulas/*/*.json', { eager: true, import: 'default' });

export const getFormulaTranslation = (lang: Locale, id: FormulaId): FormulaTranslation => {
  const raw = files[`./formulas/${id}/${lang}.json`];
  if (raw === undefined) {
    throw new Error(`Missing translation src/i18n/formulas/${id}/${lang}.json`);
  }
  return formulaTranslationSchema.parse(raw);
};

/** `grossWeight` → `gross-weight`: registry keys are camelCase, translation keys kebab-case. */
export const toKebabCase = (value: string): string =>
  value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
