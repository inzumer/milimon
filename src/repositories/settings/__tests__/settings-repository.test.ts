import { createMemoryStorage } from '@test/memory-storage';
import {
  createLocalSettingsRepository,
  CURRENCIES,
  DEFAULT_SETTINGS,
  onSettingsChange,
  SETTINGS_STORAGE_KEY,
} from '../settings-repository';

describe('settings repository (local)', () => {
  it('should return defaults when nothing is stored', () => {
    const repository = createLocalSettingsRepository(createMemoryStorage());
    expect(repository.load()).toStrictEqual(DEFAULT_SETTINGS);
  });

  it('should default to Argentine pesos and follow the system color scheme', () => {
    expect(DEFAULT_SETTINGS.currency).toBe('ARS');
    expect(DEFAULT_SETTINGS.colorScheme).toBeNull();
  });

  it('should persist partial updates and keep the other fields', () => {
    const storage = createMemoryStorage();
    const repository = createLocalSettingsRepository(storage);

    repository.save({ colorScheme: 'dark' });
    const saved = repository.save({ locale: 'en' });

    expect(saved).toStrictEqual({
      colorScheme: 'dark',
      locale: 'en',
      currency: 'ARS',
      analyticsConsent: null,
    });
    expect(createLocalSettingsRepository(storage).load()).toStrictEqual(saved);
  });

  it('should discard invalid or unknown stored values', () => {
    const storage = createMemoryStorage();
    storage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ colorScheme: 'sepia', locale: 'fr', currency: 'pesos', extra: true }),
    );
    expect(createLocalSettingsRepository(storage).load()).toStrictEqual(DEFAULT_SETTINGS);
  });

  it('should handle non-object stored data', () => {
    const storage = createMemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, '42');
    expect(createLocalSettingsRepository(storage).load()).toStrictEqual(DEFAULT_SETTINGS);
  });

  it('should store the analytics consent and discard unknown values', () => {
    const storage = createMemoryStorage();
    const repository = createLocalSettingsRepository(storage);
    expect(repository.save({ analyticsConsent: 'granted' }).analyticsConsent).toBe('granted');
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ analyticsConsent: 'maybe' }));
    expect(repository.load().analyticsConsent).toBeNull();
  });

  it('should accept any ISO 4217 currency code', () => {
    const repository = createLocalSettingsRepository(createMemoryStorage());
    expect(repository.save({ currency: 'USD' }).currency).toBe('USD');
  });

  it('should work without storage (private mode)', () => {
    const repository = createLocalSettingsRepository(null);
    expect(repository.save({ colorScheme: 'light' }).colorScheme).toBe('light');
    expect(repository.load()).toStrictEqual(DEFAULT_SETTINGS);
  });
});

describe('settings change notifications', () => {
  it('should notify subscribers after every save until they unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = onSettingsChange(listener);
    const repository = createLocalSettingsRepository(createMemoryStorage());

    repository.save({ currency: 'EUR' });
    expect(listener).toHaveBeenCalledExactlyOnceWith({
      colorScheme: null,
      locale: null,
      currency: 'EUR',
      analyticsConsent: null,
    });

    unsubscribe();
    repository.save({ currency: 'USD' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should offer Argentine pesos first among the currencies', () => {
    expect(CURRENCIES[0]).toBe('ARS');
  });
});
