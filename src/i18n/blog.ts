import type { Locale } from '@utils/locale';
import { getTranslations, type Translations } from './translations';

/** Published articles, newest first. Until the CMS arrives they live in `blog/{es,en}.json`. */
export const BLOG_ARTICLE_IDS = ['milicitos'] as const;

export type BlogArticleId = (typeof BLOG_ARTICLE_IDS)[number];

export type BlogArticle = Translations<'blog'>['articles'][BlogArticleId];

export const getBlogArticle = (lang: Locale, id: BlogArticleId): BlogArticle =>
  getTranslations(lang, 'blog').articles[id];

export interface BlogFeedItem {
  title: string;
  description: string;
  pubDate: Date;
  link: string;
}

/** Articles for the RSS feed of one language, newest first. */
export const blogFeedItems = (lang: Locale, link: (id: BlogArticleId) => string): BlogFeedItem[] =>
  BLOG_ARTICLE_IDS.map((id) => {
    const article = getBlogArticle(lang, id);
    return {
      title: article.title,
      description: article.description,
      pubDate: new Date(`${article.date}T12:00:00Z`),
      link: link(id),
    };
  });
