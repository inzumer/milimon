import type { FormulaId } from '@utils/formulas';
import type { Locale } from '@utils/locale';
import type { CalculatorText } from './formula-text';
import type { FormulaTranslation } from './formulas';

/**
 * Lazy loaders for every formula translation: Vite emits one small chunk per file, so the general
 * calculator page only downloads the texts of the formula the person picks. Content is validated
 * at build time (i18n tests + static pages), so it isn't re-validated here to keep zod out of the
 * client bundle.
 */
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
