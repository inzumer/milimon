import { LOCALES, type Locale } from '@utils/locale';

/** `getStaticPaths` of a page that only varies by language. */
export const localePaths = () => LOCALES.map((lang) => ({ params: { lang } }));

/** `getStaticPaths` of a `[lang]/[key]` page: every language × every id. */
export const localeIdPaths =
  <K extends string>(key: K, ids: readonly string[]) =>
  () =>
    LOCALES.flatMap((lang) =>
      ids.map((id) => ({ params: { lang, [key]: id } as { lang: Locale } & Record<K, string> })),
    );
