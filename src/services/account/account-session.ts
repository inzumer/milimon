import { getBrowserStorage } from '@utils';
import type { AccountBackend } from './account-backend';
import { readAccountConfig, type AccountConfig } from './account-config';
import { createAccountSync, type AccountSync } from './account-sync';
import { createApiBackend } from './api-backend';

export interface AccountSession {
  config: AccountConfig;
  backend: AccountBackend;
  sync: AccountSync;
}

let current: AccountSession | null = null;

/** The page’s single account session (one client, one sync); `null` without accounts. */
export const getAccountSession = (
  config: AccountConfig | null = readAccountConfig(import.meta.env),
  createBackend: (config: AccountConfig) => AccountBackend = createApiBackend,
): AccountSession | null => {
  if (!config) {
    return null;
  }

  if (!current) {
    const backend = createBackend(config);
    current = {
      config,
      backend,
      sync: createAccountSync({
        backend,
        session: getBrowserStorage('session'),
      }),
    };
  }

  return current;
};

export const resetAccountSession = (): void => {
  current = null;
};
