import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getTranslations } from '@i18n';
import { getBlogIndex } from '@services/content';
import { localePaths, localizedPath, toLocale } from '@utils';

export const getStaticPaths = localePaths;

export const GET: APIRoute = async ({ params, site, url }) => {
  const lang = toLocale(params['lang']);
  const blog = getTranslations(lang, 'blog');
  const common = getTranslations(lang, 'common');

  return rss({
    title: `${blog.index.title} · ${common['app-name']}`,
    description: blog.index.description,
    site: new URL(localizedPath(lang, 'blog'), site ?? url.origin).href,
    trailingSlash: false,
    items: (await getBlogIndex(lang)).map(({ id, title, description, date }) => ({
      title,
      description,
      pubDate: date,
      link: localizedPath(lang, 'blog', id),
    })),
    customData: `<language>${lang}</language>`,
  });
};
