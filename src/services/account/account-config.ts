import { AUTH_STORAGE_KEY } from '@constants';
import { getBrowserStorage, readJson, type KeyValueStorage } from '@utils';

export interface AccountConfig {
  apiUrl: string;
  apiKey: string;
  appId: string;
  googleClientId: string | null;
  facebookAppId: string | null;
}

export interface AccountEnv {
  PUBLIC_API_URL?: string | undefined;
  PUBLIC_API_KEY?: string | undefined;
  PUBLIC_API_APP_ID?: string | undefined;
  PUBLIC_GOOGLE_CLIENT_ID?: string | undefined;
  PUBLIC_FACEBOOK_APP_ID?: string | undefined;
}

const clean = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * Accounts are on when the API address and key are set; each sign-in provider is offered only
 * when its id is set. The API key ships in the public bundle on purpose: it identifies this
 * client, it doesn't protect data (the access token does).
 */
export const readAccountConfig = (env: AccountEnv): AccountConfig | null => {
  const apiUrl = clean(env.PUBLIC_API_URL)?.replace(/\/+$/, '') ?? null;
  const apiKey = clean(env.PUBLIC_API_KEY);
  if (!apiUrl || !apiKey || !/^https?:\/\/\S+$/.test(apiUrl)) {
    return null;
  }
  return {
    apiUrl,
    apiKey,
    appId: clean(env.PUBLIC_API_APP_ID) ?? 'web',
    googleClientId: clean(env.PUBLIC_GOOGLE_CLIENT_ID),
    facebookAppId: clean(env.PUBLIC_FACEBOOK_APP_ID),
  };
};

export const hasStoredSession = (storage: KeyValueStorage | null = getBrowserStorage()): boolean =>
  readJson<unknown>(storage, AUTH_STORAGE_KEY) !== null;
