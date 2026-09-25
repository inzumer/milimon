import { isLocale, type Locale } from '@utils/locale';

/** Route slugs are always English and identical in every locale. */
export const ROUTES = {
  home: '',
  calculator: 'calculator',
  formulas: 'formulas',
  learn: 'learn',
  privacy: 'privacy',
} as const;

export type RouteName = keyof typeof ROUTES;

const join = (...parts: string[]): string =>
  `/${parts.filter((part) => part.length > 0).join('/')}`;

/** Builds `/{lang}/{route}[/...rest]`. */
export const localizedPath = (lang: Locale, route: RouteName, ...rest: string[]): string =>
  join(lang, ROUTES[route], ...rest);

/** Swaps the locale prefix of a pathname, keeping the rest of the route. */
export const switchLocalePath = (pathname: string, lang: Locale): string => {
  const segments = pathname.split('/').filter((segment) => segment.length > 0);
  const rest = isLocale(segments[0]) ? segments.slice(1) : segments;
  return join(lang, ...rest);
};

const normalize = (value: string): string => value.replace(/\/+$/, '') || '/';

/** Whether `pathname` is `href` (or inside it, for sections such as `/es/formulas/x`). */
export const isActivePath = (pathname: string, href: string): boolean => {
  const current = normalize(pathname);
  const target = normalize(href);
  const isLocaleRoot = target.split('/').filter(Boolean).length === 1;
  if (isLocaleRoot) {
    return current === target;
  }
  return current === target || current.startsWith(`${target}/`);
};
