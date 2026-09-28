import { isLocale, type Locale } from '@utils/locale';

/** Route slugs are always English and identical in every locale. */
export const ROUTES = {
  home: '',
  calculator: 'calculator',
  formulas: 'formulas',
  learn: 'learn',
  privacy: 'privacy',
  terms: 'terms',
  account: 'account',
  login: 'login',
  history: 'history',
  recipes: 'recipes',
  blog: 'blog',
  about: 'about',
  admin: 'admin',
} as const;

export type RouteName = keyof typeof ROUTES;

/** Astro `base` without the trailing slash; every internal URL goes through `withBase`. */
export const SITE_BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');

const join = (...parts: string[]): string =>
  `/${parts.filter((part) => part.length > 0).join('/')}`;

/** Prefixes a root-relative path with the site base: `/og/og-home-es.png` → `/milimon/og/og-home-es.png`. */
export const withBase = (path: string, base: string = SITE_BASE): string =>
  `${base}${path.startsWith('/') ? path : `/${path}`}`;

/** Removes the site base from a pathname: `/milimon/es/learn` → `/es/learn`. */
export const stripBase = (pathname: string, base: string = SITE_BASE): string =>
  base && (pathname === base || pathname.startsWith(`${base}/`))
    ? pathname.slice(base.length) || '/'
    : pathname;

/** Clean public path of a built page: `/es/blog.html` → `/es/blog`. */
export const canonicalPath = (pathname: string): string =>
  pathname.replace(/\.html$/, '').replace(/\/index$/, '') || '/';

/** Builds `{base}/{lang}/{route}[/...rest]`. */
export const localizedPath = (lang: Locale, route: RouteName, ...rest: string[]): string =>
  withBase(join(lang, ROUTES[route], ...rest));

/** Swaps the locale prefix of a pathname, keeping the rest of the route (and the base). */
export const switchLocalePath = (
  pathname: string,
  lang: Locale,
  base: string = SITE_BASE,
): string => {
  const segments = stripBase(pathname, base)
    .split('/')
    .filter((segment) => segment.length > 0);
  const rest = isLocale(segments[0]) ? segments.slice(1) : segments;
  return withBase(join(lang, ...rest), base);
};

const normalize = (value: string): string => value.replace(/\/+$/, '') || '/';

/** Whether `pathname` is `href` (or inside it, for sections such as `/es/formulas/x`). */
export const isActivePath = (pathname: string, href: string, base: string = SITE_BASE): boolean => {
  const current = normalize(stripBase(pathname, base));
  const target = normalize(stripBase(href, base));
  const isLocaleRoot = target.split('/').filter(Boolean).length === 1;
  if (isLocaleRoot) {
    return current === target;
  }
  return current === target || current.startsWith(`${target}/`);
};
