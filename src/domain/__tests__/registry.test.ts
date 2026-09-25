import type { CalculationResult } from '@domain/shared';
import {
  FORMULA_GROUPS,
  FORMULA_IDS,
  FORMULAS,
  formulasByGroup,
  getFormula,
  initialValues,
  isFormulaId,
  type StandardFormulaDefinition,
} from '../registry';

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Fails the test with the validation errors when the calculation did not succeed. */
const expectSuccess = <R>(result: CalculationResult<R>): R => {
  if (!result.ok) {
    throw new Error(`Expected success, got errors: ${JSON.stringify(result.errors)}`);
  }
  return result.value;
};

const standardFormulas = FORMULA_IDS.map(getFormula).filter(
  (formula): formula is StandardFormulaDefinition => formula.layout === 'standard',
);

describe('formula registry', () => {
  it('has one definition per id, keyed by its own id', () => {
    expect(Object.keys(FORMULAS).sort()).toStrictEqual([...FORMULA_IDS].sort());
    for (const id of FORMULA_IDS) {
      expect(FORMULAS[id].id).toBe(id);
      expect(id).toMatch(KEBAB_CASE);
    }
  });

  it('assigns every formula to a known group, and every group has formulas', () => {
    const groups = formulasByGroup();
    expect(Object.keys(groups)).toStrictEqual([...FORMULA_GROUPS]);
    expect(Object.values(groups).flat()).toHaveLength(FORMULA_IDS.length);
    for (const group of FORMULA_GROUPS) {
      expect(groups[group].length).toBeGreaterThan(0);
    }
  });

  it('recognizes formula ids', () => {
    expect(isFormulaId('cooking-loss')).toBe(true);
    expect(isFormulaId('calc-merma')).toBe(false);
    expect(isFormulaId(42)).toBe(false);
  });

  it('has at least one example per formula, with kebab-case ids', () => {
    for (const id of FORMULA_IDS) {
      const { examples } = getFormula(id);
      expect(examples.length).toBeGreaterThan(0);
      for (const example of examples) {
        expect(example.id).toMatch(KEBAB_CASE);
      }
    }
  });

  it.each(standardFormulas.map((formula) => [formula.id, formula] as const))(
    '%s: examples only use declared inputs, cover the required ones and calculate successfully',
    (_id, formula) => {
      const keys = formula.inputs.map((input) => input.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const example of formula.examples) {
        const values = { ...initialValues(formula), ...example.values };
        for (const key of Object.keys(example.values)) {
          expect(keys).toContain(key);
        }
        const value = expectSuccess(formula.calculate(values));
        for (const output of formula.outputs) {
          expect(value).toHaveProperty(output.key);
        }
      }
      expect(formula.outputs.some((output) => output.primary)).toBe(true);
    },
  );

  it.each(standardFormulas.map((formula) => [formula.id, formula] as const))(
    '%s: reports errors when the form is empty',
    (_id, formula) => {
      const empty = Object.fromEntries(formula.inputs.map((input) => [input.key, null]));
      expect(formula.calculate(empty).ok).toBe(false);
    },
  );

  it('pre-fills only the parameters the manual gives', () => {
    const pricing = getFormula('pricing') as StandardFormulaDefinition;
    const values = initialValues(pricing);
    expect(values['vatRate']).toBe(21);
    expect(values['incomeTaxRate']).toBe(35);
    expect(values['includeCardFee']).toBe(true);
    expect(values['unitCost']).toBeNull();
  });

  it('passes the card-fee toggle through to the pricing formula', () => {
    const pricing = getFormula('pricing') as StandardFormulaDefinition;
    const example = pricing.examples[0];
    const withoutCards = pricing.calculate({
      ...initialValues(pricing),
      ...example?.values,
      includeCardFee: false,
    });
    const withCards = pricing.calculate({
      ...initialValues(pricing),
      ...example?.values,
      includeCardFee: true,
    });
    expect(withoutCards.ok && withoutCards.value).toMatchObject({ salesTaxRate: 24.5 });
    expect(withCards.ok && withCards.value).toMatchObject({ salesTaxRate: 29.5 });
  });
});
