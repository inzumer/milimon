import {
  FORMULA_IDS,
  getFormula,
  initialValues,
  type StandardFormulaDefinition,
} from '@domain/registry';
import { LOCALES } from '@utils';
import { getFormulaTranslation, toKebabCase } from '../formulas';

const standardFormulas = FORMULA_IDS.map(getFormula).filter(
  (formula): formula is StandardFormulaDefinition => formula.layout === 'standard',
);

const cases = LOCALES.flatMap((lang) =>
  standardFormulas.map((formula) => [lang, formula.id, formula] as const),
);

const placeholders = (template: string): string[] =>
  [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? '');

describe('formula translations', () => {
  it('should convert registry keys to kebab-case', () => {
    expect(toKebabCase('grossWeight')).toBe('gross-weight');
    expect(toKebabCase('areaPerCustomerWithCirculation')).toBe(
      'area-per-customer-with-circulation',
    );
    expect(toKebabCase('rent')).toBe('rent');
  });

  it.each(LOCALES.flatMap((lang) => FORMULA_IDS.map((id) => [lang, id] as const)))(
    'should load a valid %s translation for %s',
    (lang, id) => {
      const translation = getFormulaTranslation(lang, id);
      expect(translation.title.length).toBeGreaterThan(0);
      for (const example of getFormula(id).examples) {
        expect(translation.examples[example.id]?.title).toBeTruthy();
      }
    },
  );

  it('should throw a helpful error for a missing translation', () => {
    expect(() => getFormulaTranslation('es', 'unknown' as never)).toThrow(
      'Missing translation src/i18n/formulas/unknown/es.json',
    );
  });

  it.each(cases)(
    'should give every input of %s/%s a label and a placeholder, and every output a label',
    (lang, id, formula) => {
      const translation = getFormulaTranslation(lang, id);
      for (const input of formula.inputs) {
        const text = translation.inputs[toKebabCase(input.key)];
        expect(text?.label, `${input.key} label`).toBeTruthy();
        expect(text?.placeholder, `${input.key} placeholder`).toBeTruthy();
      }
      for (const output of formula.outputs) {
        expect(translation.outputs[toKebabCase(output.key)], `${output.key} label`).toBeTruthy();
      }
    },
  );

  it.each(cases)(
    'should have a template for every step of the %s/%s examples, using only known values',
    (lang, id, formula) => {
      const translation = getFormulaTranslation(lang, id);
      for (const example of formula.examples) {
        const result = formula.calculate({ ...initialValues(formula), ...example.values });
        const steps = result.ok ? result.steps : [];
        expect(steps.length).toBeGreaterThan(0);
        for (const step of steps) {
          const template = translation.steps[step.id];
          expect(template, `step ${step.id}`).toBeTruthy();
          for (const name of placeholders(template ?? '')) {
            expect(Object.keys(step.values), `{${name}} in step ${step.id}`).toContain(name);
          }
        }
      }
    },
  );

  it.each(cases)('should label every text result of %s/%s', (lang, id, formula) => {
    const translation = getFormulaTranslation(lang, id);
    const textOutputs = formula.outputs.filter((output) => output.kind === 'text');
    for (const example of formula.examples) {
      const result = formula.calculate({ ...initialValues(formula), ...example.values });
      const value = result.ok ? (result.value as Record<string, unknown>) : {};
      for (const output of textOutputs) {
        expect(translation.choices?.[String(value[output.key])]).toBeTruthy();
      }
    }
  });
});
