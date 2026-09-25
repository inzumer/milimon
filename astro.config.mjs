// @ts-check
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// Public URL of the deployed site (canonical URLs, hreflang, sitemap, Open Graph).
// Set SITE_URL in the hosting provider; the fallback is only a placeholder for local builds.
const site = process.env.SITE_URL ?? 'https://milimon-cost-lab.vercel.app';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',
  integrations: [
    react(),
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es-AR', en: 'en-US' } },
      // The root only redirects by language, 404 isn't a real page and the account page is personal.
      filter: (page) => {
        const { pathname } = new URL(page);
        return pathname !== '/' && !pathname.includes('404') && !pathname.endsWith('/account');
      },
    }),
  ],
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
