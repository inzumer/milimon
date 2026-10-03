import type { FormulaTranslation } from './formulas';

export type CalculatorText = Omit<FormulaTranslation, 'study'>;

/** Strips the study content so it isn't serialized into island props. */
export const toCalculatorText = ({ study: _study, ...text }: FormulaTranslation): CalculatorText =>
  text;

const required = <T>(record: Record<string, T> | undefined, key: string, section: string): T => {
  const value = record?.[key];
  if (value === undefined) {
    throw new Error(`Missing formula translation ${section}.${key}`);
  }

  return value;
};

/** Typed formula text accessors; a missing key is a bug, so they throw instead of falling back. */
export const formulaText = (text: CalculatorText) => ({
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
