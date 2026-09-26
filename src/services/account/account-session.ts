import {
  createLocalCalculationsRepository,
  createLocalHistoryRepository,
  createLocalSettingsRepository,
} from '@repositories';
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

/**
 * The single account session of the page, shared by the layout script and the account islands
 * (one API client, one sync). `null` when accounts aren't configured.
 */
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
        settings: createLocalSettingsRepository(),
        calculations: createLocalCalculationsRepository(),
        history: createLocalHistoryRepository(),
        session: getBrowserStorage('session'),
      }),
    };
  }
  return current;
};

export const resetAccountSession = (): void => {
  current = null;
};
