import { defineMiddleware } from 'astro:middleware';
import { CMS_TITLES } from '@constants/cms';
import { cmsTitleScript } from '@utils/inline-scripts';

const CMS_HEAD = `<meta charset="utf-8"><title>${CMS_TITLES.suffix}</title><script>${cmsTitleScript(CMS_TITLES)}</script>`;

/** Gives the Keystatic screens a tab title (its page renders no <head> of its own). */
export const onRequest = defineMiddleware(async ({ url }, next) => {
  const response = await next();
  if (!url.pathname.startsWith('/keystatic') || url.pathname.startsWith('/keystatic-')) {
    return response;
  }

  if (!response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }

  const html = (await response.text()).replace(/^(<!DOCTYPE html>)?/i, `$1${CMS_HEAD}`);
  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');

  return new Response(html, { status: response.status, headers });
});
