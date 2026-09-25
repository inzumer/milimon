import { createMemoryStorage } from '@test/memory-storage';
import {
  createLocalSettingsRepository,
  DEFAULT_SETTINGS,
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

    expect(saved).toStrictEqual({ colorScheme: 'dark', locale: 'en', currency: 'ARS' });
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
