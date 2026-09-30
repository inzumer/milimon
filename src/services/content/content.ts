import { getCollection, type CollectionEntry } from 'astro:content';
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
  featured: boolean;
}

/** Every published article in `lang` (English falls back to Spanish), newest first. */
export const getBlogIndex = async (lang: Locale): Promise<BlogIndexItem[]> =>
  (await getPublishedPosts()).map(({ id, data }) => ({
    id,
    title: lang === 'en' ? data.title : data.titleEs,
    description: (lang === 'en' && data.description.en) || data.description.es,
    date: data.date,
    featured: data.featured,
  }));
