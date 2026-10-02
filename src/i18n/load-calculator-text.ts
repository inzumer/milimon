import type { FormulaId } from '@utils/formulas';
import type { Locale } from '@utils/locale';
import type { CalculatorText } from './formula-text';
import type { FormulaTranslation } from './formulas';

/** Lazy loaders, one chunk per formula text; validated at build time, so no zod on the client. */
const loaders = import.meta.glob<FormulaTranslation>('./formulas/*/*.json', { import: 'default' });

export type CalculatorTextLoader = (lang: Locale, id: FormulaId) => Promise<CalculatorText>;

export const loadCalculatorText: CalculatorTextLoader = async (lang, id) => {
  const load = loaders[`./formulas/${id}/${lang}.json`];
  if (!load) {
    throw new Error(`Missing translation src/i18n/formulas/${id}/${lang}.json`);
  }

  const { study: _study, ...text } = await load();

  return text;
};
