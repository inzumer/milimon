import type { Locale } from '@utils/locale';
import { getTranslations, type Translations } from './translations';

/** Articles written in the site texts (`blog/{es,en}.json`); CMS posts come from Keystatic. */
export const BLOG_ARTICLE_IDS = ['milicitos'] as const;

export type BlogArticleId = (typeof BLOG_ARTICLE_IDS)[number];

export type BlogArticle = Translations<'blog'>['articles'][BlogArticleId];

export const getBlogArticle = (lang: Locale, id: BlogArticleId): BlogArticle =>
  getTranslations(lang, 'blog').articles[id];
