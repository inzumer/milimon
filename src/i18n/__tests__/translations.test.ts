import { LOCALES } from '@utils';
import { getTranslations } from '../translations';

/** Every translation file under src/i18n, keyed by path (e.g. `../home/es.json`). */
const files = import.meta.glob<Record<string, unknown>>('../**/*.json', {
  eager: true,
  import: 'default',
});

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const folders = [
  ...new Set(Object.keys(files).map((path) => path.replace(/^\.\.\//, '').replace(/\/[^/]+$/, ''))),
];

/** Flattens nested keys into dot paths: `{ nav: { home } }` → `nav.home`. */
const keyPaths = (value: unknown, prefix = ''): string[] => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
};

const leafValues = (value: unknown): unknown[] =>
  typeof value === 'object' && value !== null ? Object.values(value).flatMap(leafValues) : [value];

describe('translations', () => {
  it('should find translation folders', () => {
    expect(folders).toContain('common');
    expect(folders).toContain('home');
  });

  it.each(folders)('should name "%s" in kebab-case with exactly one file per locale', (folder) => {
    for (const segment of folder.split('/')) {
      expect(segment).toMatch(KEBAB_CASE);
    }
    const inFolder = Object.keys(files)
      .filter(
        (path) =>
          path.startsWith(`../${folder}/`) &&
          path.split('/').length === folder.split('/').length + 2,
      )
      .map((path) => path.split('/').at(-1));
    expect(inFolder.sort()).toStrictEqual(LOCALES.map((lang) => `${lang}.json`).sort());
  });

  it.each(folders)('should have the same kebab-case keys in every locale for "%s"', (folder) => {
    const [source, ...others] = LOCALES.map((lang) =>
      keyPaths(files[`../${folder}/${lang}.json`]).sort(),
    );
    for (const other of others) {
      expect(other).toStrictEqual(source);
    }
    for (const path of source ?? []) {
      for (const key of path.split('.')) {
        expect(key).toMatch(KEBAB_CASE);
      }
    }
  });

  it.each(folders)('should have no empty strings in "%s"', (folder) => {
    for (const lang of LOCALES) {
      for (const value of leafValues(files[`../${folder}/${lang}.json`])) {
        expect(typeof value === 'string' ? value.trim() : value).toBeTruthy();
      }
    }
  });

  it('should return the dictionary for the requested locale and namespace', () => {
    expect(getTranslations('es', 'common').nav.home).toBe('Inicio');
    expect(getTranslations('en', 'common').nav.home).toBe('Home');
    expect(getTranslations('en', 'home')['calculator-card'].title).toBe('Calculator');
  });
});
