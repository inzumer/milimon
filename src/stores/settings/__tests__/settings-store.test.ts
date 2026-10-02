import { CURRENCIES, SETTINGS_STORAGE_KEY } from '@constants';
import { DEFAULT_SETTINGS, sanitizeSettings, useSettingsStore } from '../settings-store';

const stored = () => JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? 'null');

const hydrateFrom = async (raw: string) => {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, raw);
  await useSettingsStore.persist.rehydrate();

  return useSettingsStore.getState();
};

describe('useSettingsStore', () => {
  it('should default to Argentine pesos and follow the system color scheme', () => {
    expect(useSettingsStore.getState()).toMatchObject(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toStrictEqual({
      colorScheme: null,
      locale: null,
      currency: 'ARS',
      analyticsConsent: null,
    });
  });

  it('should persist partial updates as plain JSON and keep the other fields', () => {
    useSettingsStore.getState().update({ colorScheme: 'dark' });
    useSettingsStore.getState().update({ locale: 'en', currency: 'USD' });
    expect(stored()).toStrictEqual({
      colorScheme: 'dark',
      locale: 'en',
      currency: 'USD',
      analyticsConsent: null,
    });
  });

  it('should load what an earlier visit saved', async () => {
    const saved = {
      colorScheme: 'dark',
      locale: 'es',
      currency: 'EUR',
      analyticsConsent: 'granted',
    };
    expect(await hydrateFrom(JSON.stringify(saved))).toMatchObject(saved);
  });

  it('should discard invalid or unknown stored values', async () => {
    const state = await hydrateFrom(
      JSON.stringify({
        colorScheme: 'blue',
        locale: 'fr',
        currency: 'pesos',
        analyticsConsent: 'yes',
        extra: 1,
      }),
    );
    expect(state).toMatchObject(DEFAULT_SETTINGS);
    expect(state).not.toHaveProperty('extra');
  });

  it('should ignore corrupted stored data', async () => {
    expect(await hydrateFrom('not json')).toMatchObject(DEFAULT_SETTINGS);
    expect(sanitizeSettings(null)).toStrictEqual(DEFAULT_SETTINGS);
  });

  it('should accept only the offered currencies and fall back to pesos otherwise', () => {
    useSettingsStore.getState().update({ currency: 'EUR' });
    expect(useSettingsStore.getState().currency).toBe('EUR');
    useSettingsStore.getState().update({ currency: 'MXN' });
    expect(useSettingsStore.getState().currency).toBe('ARS');
  });

  it('should notify subscribers with the new and previous settings', () => {
    const listener = vi.fn();
    const stop = useSettingsStore.subscribe(listener);
    useSettingsStore.getState().update({ analyticsConsent: 'denied' });
    stop();
    useSettingsStore.getState().update({ analyticsConsent: 'granted' });
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ analyticsConsent: 'denied' });
    expect(listener.mock.calls[0]?.[1]).toMatchObject({ analyticsConsent: null });
  });

  it('should offer Argentine pesos first among the currencies', () => {
    expect(CURRENCIES[0]).toBe('ARS');
  });
});
