import type { Locale } from '@utils/locale';
import aboutPageEn from './about-page/en.json';
import aboutPageEs from './about-page/es.json';
import accountPageEn from './account-page/en.json';
import accountPageEs from './account-page/es.json';
import adminDocsEn from './admin-docs/en.json';
import adminDocsEs from './admin-docs/es.json';
import adminPageEn from './admin-page/en.json';
import adminPageEs from './admin-page/es.json';
import agendaPageEn from './agenda-page/en.json';
import agendaPageEs from './agenda-page/es.json';
import blogEn from './blog/en.json';
import blogEs from './blog/es.json';
import calculatorPageEn from './calculator-page/en.json';
import calculatorPageEs from './calculator-page/es.json';
import calculatorEn from './calculator/en.json';
import calculatorEs from './calculator/es.json';
import comingSoonEn from './coming-soon/en.json';
import comingSoonEs from './coming-soon/es.json';
import commonEn from './common/en.json';
import commonEs from './common/es.json';
import formulaPageEn from './formula-page/en.json';
import formulaPageEs from './formula-page/es.json';
import historyPageEn from './history-page/en.json';
import historyPageEs from './history-page/es.json';
import homeEn from './home/en.json';
import homeEs from './home/es.json';
import learnPageEn from './learn-page/en.json';
import learnPageEs from './learn-page/es.json';
import loaderEn from './loader/en.json';
import loaderEs from './loader/es.json';
import loginPageEn from './login-page/en.json';
import loginPageEs from './login-page/es.json';
import privacyPageEn from './privacy-page/en.json';
import privacyPageEs from './privacy-page/es.json';
import recipePageEn from './recipe-page/en.json';
import recipePageEs from './recipe-page/es.json';
import termsPageEn from './terms-page/en.json';
import termsPageEs from './terms-page/es.json';

/** `src/i18n/<folder>/{es,en}.json`; Spanish is the source and English must match its shape. */
const dictionaries = {
  'about-page': { es: aboutPageEs, en: aboutPageEn satisfies typeof aboutPageEs },
  'admin-docs': { es: adminDocsEs, en: adminDocsEn satisfies typeof adminDocsEs },
  'admin-page': { es: adminPageEs, en: adminPageEn satisfies typeof adminPageEs },
  'agenda-page': { es: agendaPageEs, en: agendaPageEn satisfies typeof agendaPageEs },
  blog: { es: blogEs, en: blogEn satisfies typeof blogEs },
  common: { es: commonEs, en: commonEn satisfies typeof commonEs },
  'coming-soon': { es: comingSoonEs, en: comingSoonEn satisfies typeof comingSoonEs },
  home: { es: homeEs, en: homeEn satisfies typeof homeEs },
  'learn-page': { es: learnPageEs, en: learnPageEn satisfies typeof learnPageEs },
  calculator: { es: calculatorEs, en: calculatorEn satisfies typeof calculatorEs },
  'calculator-page': {
    es: calculatorPageEs,
    en: calculatorPageEn satisfies typeof calculatorPageEs,
  },
  'formula-page': { es: formulaPageEs, en: formulaPageEn satisfies typeof formulaPageEs },
  'account-page': { es: accountPageEs, en: accountPageEn satisfies typeof accountPageEs },
  'history-page': { es: historyPageEs, en: historyPageEn satisfies typeof historyPageEs },
  loader: { es: loaderEs, en: loaderEn satisfies typeof loaderEs },
  'login-page': { es: loginPageEs, en: loginPageEn satisfies typeof loginPageEs },
  'privacy-page': { es: privacyPageEs, en: privacyPageEn satisfies typeof privacyPageEs },
  'recipe-page': { es: recipePageEs, en: recipePageEn satisfies typeof recipePageEs },
  'terms-page': { es: termsPageEs, en: termsPageEn satisfies typeof termsPageEs },
} as const;

export type Namespace = keyof typeof dictionaries;

export type Translations<N extends Namespace> = (typeof dictionaries)[N]['es'];

export const getTranslations = <N extends Namespace>(lang: Locale, namespace: N): Translations<N> =>
  dictionaries[namespace][lang];
