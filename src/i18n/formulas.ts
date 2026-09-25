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

const required = <T>(record: Record<string, T> | undefined, key: string, section: string): T => {
  const value = record?.[key];
  if (value === undefined) {
    throw new Error(`Missing formula translation ${section}.${key}`);
  }
  return value;
};

/**
 * Typed accessors for a formula translation. Every key is validated by the i18n tests, so a
 * missing one is a bug: fail loudly instead of rendering a fallback key on screen.
 */
export const formulaText = (text: FormulaTranslation) => ({
  input: (key: string) => required(text.inputs, key, 'inputs'),
  output: (key: string) => required(text.outputs, key, 'outputs'),
  example: (key: string) => required(text.examples, key, 'examples').title,
  choice: (key: string) => required(text.choices, key, 'choices'),
  label: (key: string) => required(text.labels, key, 'labels'),
  error: (key: string): string | undefined => text.errors?.[key],
});

/** `grossWeight` → `gross-weight`: registry keys are camelCase, translation keys kebab-case. */
export const toKebabCase = (value: string): string =>
  value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
