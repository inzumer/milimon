import type { ErrorCode, FieldError } from './result';

type Rule = (value: number) => ErrorCode | null;

export const isMissing = (value: number | null | undefined): value is null | undefined =>
  value === null || value === undefined || Number.isNaN(value);

export const positive: Rule = (value) => (value > 0 ? null : 'must-be-positive');

export const nonNegative: Rule = (value) => (value >= 0 ? null : 'must-be-non-negative');

/** For percentages that make a divisor `100 − %` (waste): 100% would divide by zero. */
export const belowHundred: Rule = (value) => (value < 100 ? null : 'must-be-below-100');

export const atMostHundred: Rule = (value) => (value <= 100 ? null : 'must-be-at-most-100');

export const integer: Rule = (value) => (Number.isInteger(value) ? null : 'must-be-integer');

/**
 * Validates a record of numeric inputs. Returns the errors (first failing rule per field) and,
 * when there are none, the values narrowed to `number`.
 */
export const validate = <K extends string>(
  input: Record<K, number | null | undefined>,
  rules: Record<K, Rule[]>,
): { errors: FieldError<K>[]; values: Record<K, number> } => {
  const errors: FieldError<K>[] = [];
  for (const field of Object.keys(rules) as K[]) {
    const value = input[field];
    if (isMissing(value)) {
      errors.push({ field, code: 'required' });
      continue;
    }
    const code = rules[field].map((rule) => rule(value)).find((result) => result !== null);
    if (code) {
      errors.push({ field, code });
    }
  }
  return { errors, values: input as Record<K, number> };
};
