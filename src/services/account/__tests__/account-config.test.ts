import { createMemoryStorage } from '@test/memory-storage';
import { AUTH_STORAGE_KEY, hasStoredSession, readAccountConfig } from '../account-config';

describe('account config', () => {
  it('should enable accounts only with an https URL and a key', () => {
    expect(
      readAccountConfig({
        PUBLIC_SUPABASE_URL: ' https://demo.supabase.co ',
        PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'key',
      }),
    ).toStrictEqual({ url: 'https://demo.supabase.co', key: 'key' });
    expect(readAccountConfig({})).toBeNull();
    expect(
      readAccountConfig({
        PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
        PUBLIC_SUPABASE_PUBLISHABLE_KEY: ' ',
      }),
    ).toBeNull();
    expect(
      readAccountConfig({
        PUBLIC_SUPABASE_URL: 'http://demo',
        PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'key',
      }),
    ).toBeNull();
  });

  it('should tell whether a session is stored without loading the SDK', () => {
    const storage = createMemoryStorage();
    expect(hasStoredSession(storage)).toBe(false);
    storage.setItem(AUTH_STORAGE_KEY, '{"access_token":"x"}');
    expect(hasStoredSession(storage)).toBe(true);
    expect(hasStoredSession(null)).toBe(false);
  });
});
