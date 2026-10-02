import { useEffect, useMemo, useState } from 'react';
import { useCurrency } from '@hooks/useCurrency';
import { useDraft } from '@hooks/useDraft';
import type { CalculatorDraft } from '@stores';
import { parseDecimal, track, type Locale } from '@utils';
import type { ErrorCode } from '@utils/calculation';
import { formatInputValue } from '@utils/format-value';
import type { FormulaValues, StandardFormulaDefinition } from '@utils/formulas';

export type FieldErrorCode = ErrorCode | 'invalid-number';

export interface UseFormulaCalculatorOptions {
  formula: StandardFormulaDefinition;
  lang: Locale;
}

const toDraft = (values: Record<string, number | boolean | null>, lang: Locale): CalculatorDraft =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === 'number' ? formatInputValue(value, lang) : (value ?? ''),
    ]),
  );

const defaultDraft = (formula: StandardFormulaDefinition, lang: Locale): CalculatorDraft =>
  toDraft(
    Object.fromEntries(formula.inputs.map((input) => [input.key, input.defaultValue ?? null])),
    lang,
  );

/** Standard calculator state: raw fields, parsing, live result, errors on blur, examples, drafts. */
export const useFormulaCalculator = ({ formula, lang }: UseFormulaCalculatorOptions) => {
  const { draft, setDraft, resetDraft } = useDraft(formula.id, defaultDraft(formula, lang));
  const currency = useCurrency();
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());

  const setField = (key: string, value: string | boolean) => setDraft({ ...draft, [key]: value });

  const touch = (key: string) => setTouched((current) => new Set(current).add(key));

  const loadExample = (exampleId: string) => {
    const example = formula.examples.find((item) => item.id === exampleId);
    if (!example) {
      return;
    }

    setDraft({ ...defaultDraft(formula, lang), ...toDraft(example.values, lang) });
    setTouched(new Set(formula.inputs.map((input) => input.key)));
    track('example_loaded', { formula: formula.id, example: exampleId });
  };

  const reset = () => {
    resetDraft();
    setTouched(new Set());
    track('calculator_reset', { formula: formula.id });
  };

  const { result, errors } = useMemo(() => {
    const values: FormulaValues = {};
    const invalid: Record<string, FieldErrorCode> = {};
    for (const input of formula.inputs) {
      const raw = draft[input.key];
      if (typeof raw === 'boolean') {
        values[input.key] = raw;
        continue;
      }

      const parsed = parseDecimal(raw ?? '', lang);
      values[input.key] = parsed;
      if (parsed === null && (raw ?? '').trim() !== '') {
        invalid[input.key] = 'invalid-number';
      }
    }
    const calculation = formula.calculate(values);
    const fieldErrors: Record<string, FieldErrorCode> = calculation.ok
      ? {}
      : Object.fromEntries(calculation.errors.map((error) => [error.field, error.code]));

    return { result: calculation, errors: { ...fieldErrors, ...invalid } };
  }, [draft, formula, lang]);

  const ok = result.ok && Object.keys(errors).length === 0;

  useEffect(() => {
    if (ok) {
      track('calculation_completed', { formula: formula.id });
    }
  }, [ok, formula.id]);

  const visibleErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => touched.has(key)),
  );

  return {
    draft,
    setField,
    touch,
    loadExample,
    reset,
    currency,
    result: ok && result.ok ? result : null,
    errors: visibleErrors,
  };
};
