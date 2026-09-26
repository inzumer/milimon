import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { blogFeedItems, getTranslations } from '@i18n';
import { LOCALES, localizedPath, toLocale } from '@utils';

export const getStaticPaths = () => LOCALES.map((lang) => ({ params: { lang } }));

export const GET: APIRoute = ({ params, site, url }) => {
  const lang = toLocale(params['lang']);
  const blog = getTranslations(lang, 'blog');
  const common = getTranslations(lang, 'common');
  return rss({
    title: `${blog.index.title} · ${common['app-name']}`,
    description: blog.index.description,
    site: new URL(localizedPath(lang, 'blog'), site ?? url.origin).href,
    trailingSlash: false,
    items: blogFeedItems(lang, (id) => localizedPath(lang, 'blog', id)),
    customData: `<language>${lang}</language>`,
  });
};
