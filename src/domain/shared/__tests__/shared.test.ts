import { ceilToStep, percentage, percentOf, roundTo, sum } from '../math';
import { failure, success } from '../result';
import {
  atMostHundred,
  belowHundred,
  integer,
  isMissing,
  nonNegative,
  positive,
  validate,
} from '../validation';

describe('math', () => {
  it('rounds half away from zero without binary artifacts', () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(29.166666, 2)).toBe(29.17);
    expect(roundTo(-2.5, 0)).toBe(-3);
    expect(roundTo(1.4285714, 3)).toBe(1.429);
  });

  it('rounds numbers written in exponent notation', () => {
    expect(roundTo(1e-7, 2)).toBe(0);
    expect(roundTo(1.23456e-5, 7)).toBe(0.0000123);
    expect(roundTo(1.5e21, 2)).toBe(1.5e21);
  });

  it('rounds up to the next step', () => {
    expect(ceilToStep(51.428571, 1)).toBe(52);
    expect(ceilToStep(52, 1)).toBe(52);
    expect(ceilToStep(1.21, 0.5)).toBe(1.5);
    expect(ceilToStep(0.3, 0.1)).toBe(0.3);
  });

  it('computes percentages and sums', () => {
    expect(percentage(0.7, 2.4)).toBeCloseTo(29.1667, 4);
    expect(percentOf(57_000, 48)).toBe(27_360);
    expect(sum([1, 2, 3.5])).toBe(6.5);
    expect(sum([])).toBe(0);
  });
});

describe('result', () => {
  it('builds success and failure results', () => {
    expect(success({ a: 1 })).toStrictEqual({ ok: true, value: { a: 1 }, steps: [] });
    expect(failure([{ field: 'a', code: 'required' }])).toStrictEqual({
      ok: false,
      errors: [{ field: 'a', code: 'required' }],
    });
  });
});

describe('validation', () => {
  it('detects missing values', () => {
    expect(isMissing(null)).toBe(true);
    expect(isMissing(undefined)).toBe(true);
    expect(isMissing(Number.NaN)).toBe(true);
    expect(isMissing(0)).toBe(false);
  });

  it('applies rules', () => {
    expect(positive(0)).toBe('must-be-positive');
    expect(positive(1)).toBeNull();
    expect(nonNegative(-1)).toBe('must-be-non-negative');
    expect(nonNegative(0)).toBeNull();
    expect(belowHundred(100)).toBe('must-be-below-100');
    expect(belowHundred(99.9)).toBeNull();
    expect(atMostHundred(100.1)).toBe('must-be-at-most-100');
    expect(atMostHundred(100)).toBeNull();
    expect(integer(1.5)).toBe('must-be-integer');
    expect(integer(2)).toBeNull();
  });

  it('reports the first failing rule per field and required fields', () => {
    const { errors } = validate(
      { a: -1, b: null, c: 5 },
      { a: [nonNegative, positive], b: [positive], c: [positive] },
    );
    expect(errors).toStrictEqual([
      { field: 'a', code: 'must-be-non-negative' },
      { field: 'b', code: 'required' },
    ]);
  });

  it('returns the values when valid', () => {
    expect(validate({ a: 2 }, { a: [positive] })).toStrictEqual({ errors: [], values: { a: 2 } });
  });
});
