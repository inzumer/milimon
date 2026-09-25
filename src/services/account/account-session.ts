import { createLocalCalculationsRepository, createLocalSettingsRepository } from '@repositories';
import { getBrowserStorage } from '@utils';
import type { AccountBackend } from './account-backend';
import { readAccountConfig, type AccountConfig } from './account-config';
import { createAccountSync, type AccountSync } from './account-sync';

export interface AccountSession {
  backend: AccountBackend;
  sync: AccountSync;
}

/** Downloads the Supabase SDK (its own chunk) only when an account feature is actually used. */
const defaultLoadBackend = async (config: AccountConfig): Promise<AccountBackend> => {
  const { createSupabaseBackend, createSupabaseClient } = await import('./supabase-backend');
  return createSupabaseBackend(createSupabaseClient(config));
};

let current: Promise<AccountSession | null> | null = null;

/**
 * The single account session of the page, shared by the layout script and the account page
 * island (one auth client, one sync). `null` when accounts aren't configured.
 */
export const getAccountSession = (
  config: AccountConfig | null = readAccountConfig(import.meta.env),
  loadBackend: (config: AccountConfig) => Promise<AccountBackend> = defaultLoadBackend,
): Promise<AccountSession | null> => {
  if (!config) {
    return Promise.resolve(null);
  }
  current ??= loadBackend(config).then((backend) => ({
    backend,
    sync: createAccountSync({
      backend,
      settings: createLocalSettingsRepository(),
      calculations: createLocalCalculationsRepository(),
      session: getBrowserStorage('session'),
    }),
  }));
  return current;
};

/** Test helper: forgets the page session. */
export const resetAccountSession = (): void => {
  current = null;
};
