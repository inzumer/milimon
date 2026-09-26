import { languageRedirectScript, notFoundLanguageScript, themeScript } from '../inline-scripts';

const run = (script: string) => new Function(script)();

describe('inline scripts', () => {
  afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['colorScheme'];
    vi.unstubAllGlobals();
  });

  it('should apply the saved color scheme, or follow the OS', () => {
    const listeners: (() => void)[] = [];
    let dark = true;
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return dark;
      },
      addEventListener: (_event: string, listener: () => void) => listeners.push(listener),
    }));

    run(themeScript('milimon:settings'));
    expect(document.documentElement.dataset['colorScheme']).toBe('dark');
    dark = false;
    listeners.forEach((listener) => listener());
    expect(document.documentElement.dataset['colorScheme']).toBe('light');

    localStorage.setItem('milimon:settings', JSON.stringify({ colorScheme: 'dark' }));
    run(themeScript('milimon:settings'));
    expect(document.documentElement.dataset['colorScheme']).toBe('dark');
    listeners.forEach((listener) => listener());
    expect(document.documentElement.dataset['colorScheme']).toBe('dark');

    localStorage.setItem('milimon:settings', '{broken');
    run(themeScript('milimon:settings'));
    expect(document.documentElement.dataset['colorScheme']).toBe('light');
  });

  it('should redirect to the saved language, then the browser language, under the base', () => {
    const replace = vi.fn();
    vi.stubGlobal('location', { replace });
    const options = {
      storageKey: 'milimon:settings',
      locales: ['es', 'en'],
      fallbackLocale: 'es',
      base: '/milimon',
    };

    localStorage.setItem('milimon:settings', JSON.stringify({ locale: 'en' }));
    run(languageRedirectScript(options));
    expect(replace).toHaveBeenLastCalledWith('/milimon/en');

    localStorage.clear();
    vi.stubGlobal('navigator', { languages: ['fr-FR', 'en-US'], language: 'fr' });
    run(languageRedirectScript({ ...options, base: '' }));
    expect(replace).toHaveBeenLastCalledWith('/en');

    vi.stubGlobal('navigator', { languages: [], language: 'de' });
    localStorage.setItem('milimon:settings', '{broken');
    run(languageRedirectScript(options));
    expect(replace).toHaveBeenLastCalledWith('/milimon/es');
  });

  it('should show the 404 message in the language of the requested URL, under the base', () => {
    document.body.innerHTML =
      '<section data-not-found="es"></section><section data-not-found="en" hidden></section>';
    const [es, en] = document.querySelectorAll<HTMLElement>('[data-not-found]');
    const script = notFoundLanguageScript({ locales: ['es', 'en'], base: '/milimon' });

    window.history.replaceState(null, '', '/milimon/en/missing');
    run(script);
    expect(document.documentElement.lang).toBe('en');
    expect([es?.hidden, en?.hidden]).toStrictEqual([true, false]);

    window.history.replaceState(null, '', '/milimon/unknown');
    document.documentElement.lang = 'es';
    run(script);
    expect(document.documentElement.lang).toBe('es');
    window.history.replaceState(null, '', '/');
    document.body.innerHTML = '';
  });
});
