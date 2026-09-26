import { AUTH_STORAGE_KEY } from '@constants';
import { createMemoryStorage } from '@test/memory-storage';
import { hasStoredSession, readAccountConfig } from '../account-config';

describe('account config', () => {
  it('should enable accounts with the API address and key, and each provider with its id', () => {
    expect(
      readAccountConfig({
        PUBLIC_API_URL: ' https://api.example.com/ ',
        PUBLIC_API_KEY: 'key',
        PUBLIC_GOOGLE_CLIENT_ID: 'google-id',
      }),
    ).toStrictEqual({
      apiUrl: 'https://api.example.com',
      apiKey: 'key',
      appId: 'web',
      googleClientId: 'google-id',
      facebookAppId: null,
    });
    expect(
      readAccountConfig({
        PUBLIC_API_URL: 'http://localhost:3000',
        PUBLIC_API_KEY: 'key',
        PUBLIC_API_APP_ID: 'swagger',
        PUBLIC_FACEBOOK_APP_ID: 'fb-id',
      }),
    ).toMatchObject({ appId: 'swagger', googleClientId: null, facebookAppId: 'fb-id' });
  });

  it('should keep accounts off without a valid address or key', () => {
    expect(readAccountConfig({})).toBeNull();
    expect(
      readAccountConfig({ PUBLIC_API_URL: 'https://api.example.com', PUBLIC_API_KEY: ' ' }),
    ).toBeNull();
    expect(
      readAccountConfig({ PUBLIC_API_URL: 'api.example.com', PUBLIC_API_KEY: 'key' }),
    ).toBeNull();
  });

  it('should tell whether a session is stored without calling the API', () => {
    const storage = createMemoryStorage();
    expect(hasStoredSession(storage)).toBe(false);
    storage.setItem(AUTH_STORAGE_KEY, '{"accessToken":"x"}');
    expect(hasStoredSession(storage)).toBe(true);
    expect(hasStoredSession(null)).toBe(false);
  });
});
