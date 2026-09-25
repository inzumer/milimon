import type { Locale } from '@utils/locale';
import calculatorEn from './calculator/en.json';
import calculatorEs from './calculator/es.json';
import commonEn from './common/en.json';
import commonEs from './common/es.json';
import formulaPageEn from './formula-page/en.json';
import formulaPageEs from './formula-page/es.json';
import homeEn from './home/en.json';
import homeEs from './home/es.json';

/**
 * Translations live in kebab-case folders, one JSON file per language: `src/i18n/<folder>/{es,en}.json`.
 * Spanish is the source language: each English file must match its shape (checked here by the
 * type system and, in both directions, by `__tests__/translations.test.ts`).
 * Formula folders (`src/i18n/formulas/<id>/`) are loaded and validated by `formulas.ts`.
 */
const dictionaries = {
  common: { es: commonEs, en: commonEn satisfies typeof commonEs },
  home: { es: homeEs, en: homeEn satisfies typeof homeEs },
  calculator: { es: calculatorEs, en: calculatorEn satisfies typeof calculatorEs },
  'formula-page': { es: formulaPageEs, en: formulaPageEn satisfies typeof formulaPageEs },
} as const;

export type Namespace = keyof typeof dictionaries;

export type Translations<N extends Namespace> = (typeof dictionaries)[N]['es'];

export const getTranslations = <N extends Namespace>(lang: Locale, namespace: N): Translations<N> =>
  dictionaries[namespace][lang];
