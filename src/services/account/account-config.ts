import { getBrowserStorage, readJson, type KeyValueStorage } from '@utils';

export interface AccountConfig {
  url: string;
  /** Supabase publishable (or legacy anon) key: public by design, data is protected by RLS. */
  key: string;
}

/** Where the auth SDK keeps the session, so pages can tell there is one without loading the SDK. */
export const AUTH_STORAGE_KEY = 'milimon:auth';

/** Accounts exist only when both public variables are set; otherwise the login UI is hidden. */
export const readAccountConfig = (env: {
  PUBLIC_SUPABASE_URL?: string | undefined;
  PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string | undefined;
}): AccountConfig | null => {
  const url = env.PUBLIC_SUPABASE_URL?.trim();
  const key = env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key || !/^https:\/\/\S+$/.test(url)) {
    return null;
  }
  return { url, key };
};

export const hasStoredSession = (storage: KeyValueStorage | null = getBrowserStorage()): boolean =>
  readJson<unknown>(storage, AUTH_STORAGE_KEY) !== null;
