import { getCollection, type CollectionEntry } from 'astro:content';
import { BLOG_ARTICLE_IDS, getBlogArticle } from '@i18n';
import { publishedRecipes, type Locale } from '@utils';

/** Published recipes (no drafts), featured first. */
export const getPublishedRecipes = async (): Promise<CollectionEntry<'recipes'>[]> =>
  publishedRecipes(await getCollection('recipes'));

/** Published CMS blog posts (no drafts), newest first. */
export const getPublishedPosts = async (): Promise<CollectionEntry<'blog'>[]> =>
  (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

export interface BlogIndexItem {
  id: string;
  title: string;
  description: string;
  date: Date;
}

/** Every blog article of `lang` (site texts and CMS posts), newest first. */
export const getBlogIndex = async (lang: Locale): Promise<BlogIndexItem[]> => {
  const site = BLOG_ARTICLE_IDS.map((id) => {
    const article = getBlogArticle(lang, id);
    return {
      id,
      title: article.title,
      description: article.description,
      date: new Date(`${article.date}T12:00:00Z`),
    };
  });
  const cms = (await getPublishedPosts()).map(({ id, data }) => ({
    id,
    title: lang === 'en' ? data.title : data.titleEs,
    description: (lang === 'en' && data.description.en) || data.description.es,
    date: data.date,
  }));
  return [...site, ...cms].sort((a, b) => b.date.getTime() - a.date.getTime());
};
