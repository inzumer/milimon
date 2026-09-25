import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatInputValue } from '@calculators/shared/format-value';
import type { FormulaValues, StandardFormulaDefinition } from '@domain/registry';
import type { ErrorCode } from '@domain/shared';
import {
  createLocalCalculationsRepository,
  createLocalSettingsRepository,
  DEFAULT_SETTINGS,
  type CalculationsRepository,
  type CalculatorDraft,
  type SettingsRepository,
} from '@repositories';
import { parseDecimal, track, type Locale } from '@utils';

export type FieldErrorCode = ErrorCode | 'invalid-number';

export interface UseFormulaCalculatorOptions {
  formula: StandardFormulaDefinition;
  lang: Locale;
  calculations?: CalculationsRepository;
  settings?: SettingsRepository;
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

/**
 * State and logic of a standard calculator: raw text per field, parsing (comma or dot decimals),
 * live calculation, errors shown only for fields the person already left, examples and persistence.
 * The first render always uses the defaults so server and client markup match; the saved draft
 * and currency are applied right after hydration.
 */
export const useFormulaCalculator = ({
  formula,
  lang,
  calculations = createLocalCalculationsRepository(),
  settings = createLocalSettingsRepository(),
}: UseFormulaCalculatorOptions) => {
  const [draft, setDraft] = useState<CalculatorDraft>(() => defaultDraft(formula, lang));
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [currency, setCurrency] = useState(DEFAULT_SETTINGS.currency);
  const repositories = useRef({ calculations, settings });

  useEffect(() => {
    const saved = repositories.current.calculations.loadDraft(formula.id);
    if (saved) {
      setDraft((current) => ({ ...current, ...saved }));
    }
    setCurrency(repositories.current.settings.load().currency);
  }, [formula.id]);

  const update = useCallback(
    (next: CalculatorDraft) => {
      setDraft(next);
      repositories.current.calculations.saveDraft(formula.id, next);
    },
    [formula.id],
  );

  const setField = (key: string, value: string | boolean) => update({ ...draft, [key]: value });

  const touch = (key: string) => setTouched((current) => new Set(current).add(key));

  const loadExample = (exampleId: string) => {
    const example = formula.examples.find((item) => item.id === exampleId);
    if (!example) {
      return;
    }
    update({ ...defaultDraft(formula, lang), ...toDraft(example.values, lang) });
    setTouched(new Set(formula.inputs.map((input) => input.key)));
    track('example_loaded', { formula: formula.id, example: exampleId });
  };

  const reset = () => {
    setDraft(defaultDraft(formula, lang));
    setTouched(new Set());
    repositories.current.calculations.clearDraft(formula.id);
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
