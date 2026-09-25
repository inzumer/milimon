import type { Locale } from '@utils/locale';
import commonEn from './common/en.json';
import commonEs from './common/es.json';
import homeEn from './home/en.json';
import homeEs from './home/es.json';

/**
 * Translations live in kebab-case folders, one JSON file per language: `src/i18n/<folder>/{es,en}.json`.
 * Spanish is the source language: each English file must match its shape (checked here by the
 * type system and, in both directions, by `__tests__/translations.test.ts`).
 */
const dictionaries = {
  common: { es: commonEs, en: commonEn satisfies typeof commonEs },
  home: { es: homeEs, en: homeEn satisfies typeof homeEs },
} as const;

export type Namespace = keyof typeof dictionaries;

export type Translations<N extends Namespace> = (typeof dictionaries)[N]['es'];

export const getTranslations = <N extends Namespace>(lang: Locale, namespace: N): Translations<N> =>
  dictionaries[namespace][lang];
