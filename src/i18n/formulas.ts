import { z } from 'zod';
import type { FormulaId } from '@domain/registry';
import type { Locale } from '@utils/locale';

const text = z.string().trim().min(1);

const inputTextSchema = z.object({
  label: text,
  placeholder: text,
  hint: text.optional(),
});

export const NOTE_TYPES = ['tip', 'common-mistake', 'rounding', 'manual-difference'] as const;

/** Study-manual content of a formula page (our own wording, based on the manual). */
const studySchema = z.object({
  what: z.array(text).min(1),
  formula: z.array(text).min(1),
  variables: z.array(z.object({ name: text, description: text })).min(1),
  steps: z.array(text).min(1),
  examples: z.array(z.object({ title: text, paragraphs: z.array(text).min(1) })).min(1),
  notes: z.array(z.object({ type: z.enum(NOTE_TYPES), text })).min(1),
});

/**
 * Shape of `src/i18n/formulas/<formula-id>/{es,en}.json`. Keys are kebab-case versions of the
 * registry keys (`grossWeight` → `gross-weight`). Validated when loaded, so broken content fails
 * the build instead of rendering holes.
 */
export const formulaTranslationSchema = z.object({
  title: text,
  summary: text,
  study: studySchema,
  inputs: z.record(z.string(), inputTextSchema),
  outputs: z.record(z.string(), text),
  steps: z.record(z.string(), text),
  examples: z.record(z.string(), z.object({ title: text })),
  /** Labels for text results (e.g. `buy-gross`, `too-high`). */
  choices: z.record(z.string(), text).optional(),
  /** Field-specific error messages: `<input-key>.<error-code>`. */
  errors: z.record(z.string(), text).optional(),
  /** Extra UI strings used by custom calculators (buttons, table headers, example item names…). */
  labels: z.record(z.string(), text).optional(),
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

export { formulaText, toCalculatorText, toKebabCase, type CalculatorText } from './formula-text';
