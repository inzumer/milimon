/** A formula result: values and worked steps, or field errors; ids that i18n turns into text. */

export type ErrorCode =
  | 'required'
  | 'must-be-positive'
  | 'must-be-non-negative'
  | 'must-be-below-100'
  | 'must-be-at-most-100'
  | 'must-not-exceed-gross'
  | 'must-be-integer'
  | 'needs-at-least-two';

export interface FieldError<K extends string = string> {
  field: K;
  code: ErrorCode;
}

export interface Step {
  id: string;
  values: Record<string, number>;
}

export type CalculationResult<R, K extends string = string> =
  { ok: true; value: R; steps: Step[] } | { ok: false; errors: FieldError<K>[] };

export const success = <R>(value: R, steps: Step[] = []): CalculationResult<R, never> => ({
  ok: true,
  value,
  steps,
});

export const failure = <K extends string>(
  errors: FieldError<K>[],
): CalculationResult<never, K> => ({ ok: false, errors });
