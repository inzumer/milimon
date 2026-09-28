import { localeIdPaths, localePaths } from '../static-paths';

describe('static paths', () => {
  it('should give one path per language', () => {
    expect(localePaths()).toEqual([{ params: { lang: 'es' } }, { params: { lang: 'en' } }]);
  });

  it('should give every language with every id under the given key', () => {
    expect(localeIdPaths('topic', ['a', 'b'])()).toEqual([
      { params: { lang: 'es', topic: 'a' } },
      { params: { lang: 'es', topic: 'b' } },
      { params: { lang: 'en', topic: 'a' } },
      { params: { lang: 'en', topic: 'b' } },
    ]);
  });
});
