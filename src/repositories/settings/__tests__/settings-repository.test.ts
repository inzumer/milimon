import { createMemoryStorage } from '@test/memory-storage';
import {
  createLocalSettingsRepository,
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
} from '../settings-repository';

describe('settings repository (local)', () => {
  it('returns defaults when nothing is stored', () => {
    const repository = createLocalSettingsRepository(createMemoryStorage());
    expect(repository.load()).toStrictEqual(DEFAULT_SETTINGS);
  });

  it('defaults to Argentine pesos and follows the system color scheme', () => {
    expect(DEFAULT_SETTINGS.currency).toBe('ARS');
    expect(DEFAULT_SETTINGS.colorScheme).toBeNull();
  });

  it('persists partial updates and keeps the other fields', () => {
    const storage = createMemoryStorage();
    const repository = createLocalSettingsRepository(storage);

    repository.save({ colorScheme: 'dark' });
    const saved = repository.save({ locale: 'en' });

    expect(saved).toStrictEqual({ colorScheme: 'dark', locale: 'en', currency: 'ARS' });
    expect(createLocalSettingsRepository(storage).load()).toStrictEqual(saved);
  });

  it('discards invalid or unknown stored values', () => {
    const storage = createMemoryStorage();
    storage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ colorScheme: 'sepia', locale: 'fr', currency: 'pesos', extra: true }),
    );
    expect(createLocalSettingsRepository(storage).load()).toStrictEqual(DEFAULT_SETTINGS);
  });

  it('handles non-object stored data', () => {
    const storage = createMemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, '42');
    expect(createLocalSettingsRepository(storage).load()).toStrictEqual(DEFAULT_SETTINGS);
  });

  it('accepts any ISO 4217 currency code', () => {
    const repository = createLocalSettingsRepository(createMemoryStorage());
    expect(repository.save({ currency: 'USD' }).currency).toBe('USD');
  });

  it('works without storage (private mode)', () => {
    const repository = createLocalSettingsRepository(null);
    expect(repository.save({ colorScheme: 'light' }).colorScheme).toBe('light');
    expect(repository.load()).toStrictEqual(DEFAULT_SETTINGS);
  });
});
