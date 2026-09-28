// @ts-check
import { createHash } from 'node:crypto';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { SETTINGS_STORAGE_KEY } from './src/constants/storage.ts';
import {
  languageRedirectScript,
  notFoundLanguageScript,
  themeScript,
} from './src/utils/inline-scripts/inline-scripts.ts';
import { DEFAULT_LOCALE, LOCALES } from './src/utils/locale/locale.ts';

try {
  process.loadEnvFile();
} catch {
  // No .env file.
}

const site = process.env.SITE_URL ?? 'https://inzumer.github.io';
const base = process.env.BASE_PATH || '/';
/** The Keystatic admin (/keystatic) runs only with `astro dev`; the build stays static. */
const isDev = process.argv.includes('dev');

/** @param {string | undefined} url */
const origin = (url) => {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
};
const apiOrigin = origin(process.env.PUBLIC_API_URL);

/**
 * @param {string} text
 * @returns {`sha256-${string}`}
 */
const sha256 = (text) => `sha256-${createHash('sha256').update(text).digest('base64')}`;
const inlineScriptHashes = [
  sha256(themeScript(SETTINGS_STORAGE_KEY)),
  sha256(
    languageRedirectScript({
      storageKey: SETTINGS_STORAGE_KEY,
      locales: LOCALES,
      fallbackLocale: DEFAULT_LOCALE,
      base: base.replace(/\/+$/, ''),
    }),
  ),
  sha256(notFoundLanguageScript({ locales: LOCALES, base: base.replace(/\/+$/, '') })),
];

/** @type {`connect-src ${string}`} */
const connectSrc = /** @type {`connect-src ${string}`} */ (
  [
    "connect-src 'self'",
    apiOrigin,
    'https://accounts.google.com',
    'https://graph.facebook.com',
    'https://*.facebook.com',
    'https://www.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
  ]
    .filter(Boolean)
    .join(' ')
);

/** @type {Exclude<NonNullable<NonNullable<import('astro').AstroUserConfig['security']>['csp']>, boolean>} */
const csp = {
  directives: [
    "default-src 'self'",
    connectSrc,
    "img-src 'self' data: https://*.googleusercontent.com https://*.fbcdn.net https://platform-lookaside.fbsbx.com https://www.googletagmanager.com https://*.google-analytics.com",
    'frame-src https://accounts.google.com https://*.facebook.com https://www.googletagmanager.com',
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ],
  scriptDirective: {
    resources: [
      "'self'",
      'https://accounts.google.com',
      'https://connect.facebook.net',
      'https://www.googletagmanager.com',
    ],
    hashes: inlineScriptHashes,
  },
  styleDirective: {
    resources: [
      "'self'",
      'https://accounts.google.com',
      { resource: "'self'", kind: 'element' },
      { resource: "'unsafe-inline'", kind: 'element' },
      { resource: 'https://accounts.google.com', kind: 'element' },
      { resource: "'unsafe-inline'", kind: 'attribute' },
    ],
  },
};

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  security: { csp },
  integrations: [
    react(),
    ...(isDev ? [keystatic()] : []),
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es', en: 'en' } },
      filter: (page) => {
        const { pathname } = new URL(page);
        const route = pathname.slice(base.replace(/\/+$/, '').length) || '/';
        return (
          route !== '/' &&
          !route.includes('404') &&
          !/\/(account|history|login|recipes|admin)$/.test(route) &&
          !route.includes('/admin/')
        );
      },
    }),
  ],
  // Not in dev: its prefix check 404s /keystatic, and pages are [lang]/… routes anyway.
  ...(isDev
    ? {}
    : {
        i18n: {
          locales: ['es', 'en'],
          defaultLocale: 'es',
          routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
        },
      }),
  markdown: { syntaxHighlight: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
