/**
 * Numeric helpers. Formulas always compute with full precision; rounding happens only for display
 * or when the manual explicitly rounds (e.g. buying whole kilograms).
 */

/** Rounds half away from zero to `decimals` places, avoiding binary artifacts (1.005 → 1.01). */
export const roundTo = (value: number, decimals: number): number => {
  // Shift the decimal point through exponent notation instead of multiplying:
  // 1.005 * 100 is 100.49999… in binary, while Number('1.005e2') is exactly 100.5.
  const shift = (number: number, places: number): number => {
    const [mantissa, exponent = '0'] = String(number).split('e');
    return Number(`${mantissa}e${Number(exponent) + places}`);
  };
  return Math.sign(value) * shift(Math.round(shift(Math.abs(value), decimals)), -decimals);
};

/** Rounds up to the next multiple of `step` (e.g. 51.429 kg with step 1 → 52 kg). */
export const ceilToStep = (value: number, step: number): number => {
  const scaled = roundTo(value / step, 9);
  return roundTo(Math.ceil(scaled) * step, 9);
};

/** `part` as a percentage of `whole` (0–100 scale). */
export const percentage = (part: number, whole: number): number => (part / whole) * 100;

/** `rate` percent of `base` (rate on the 0–100 scale). */
export const percentOf = (base: number, rate: number): number => (base * rate) / 100;

export const sum = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0);
