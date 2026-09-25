import {
  DEFAULT_SETTINGS,
  onCalculationsChange,
  onHistoryChange,
  onSettingsChange,
  type CalculationsRepository,
  type HistoryRepository,
  type Settings,
  type SettingsRepository,
} from '@repositories';
import { readJson, writeJson, type KeyValueStorage } from '@utils';
import type { AccountBackend, AccountUser, RemoteProfile } from './account-backend';

/**
 * Keeps the local repositories (what the UI reads, synchronously and offline) in sync with the
 * signed-in person's profile:
 *
 * 1. On sign-in (once per browser session) the remote profile wins and is copied locally.
 * 2. On the first sign-in there is no profile yet: if this device has data worth keeping
 *    (drafts, saved calculations or a non-default currency) the person decides between importing it or starting
 *    fresh; otherwise the local preferences simply become the profile.
 * 3. While signed in, every local change is pushed (debounced per item).
 * 4. On sign-out this device goes back to guest mode without the person's data.
 */
export type SignInOutcome = 'restored' | 'created' | 'needs-migration';

export interface AccountSyncOptions {
  backend: AccountBackend;
  settings: SettingsRepository;
  calculations: CalculationsRepository;
  history: HistoryRepository;
  /** Remembers, per browser session, that the remote profile was already pulled. */
  session: KeyValueStorage | null;
  debounceMs?: number;
}

export interface AccountSync {
  /** Pulls the profile (once per session) and starts pushing changes. `null` when signed out. */
  start: () => Promise<{ user: AccountUser; outcome: SignInOutcome } | null>;
  /** First sign-in: keeps this device's data and saves it to the new profile. */
  importLocal: () => Promise<void>;
  /** First sign-in: discards this device's data and starts an empty profile. */
  startFresh: () => Promise<void>;
  /** Signs out and removes the person's data from this device. */
  signOut: () => Promise<void>;
  /** Deletes the account and removes the person's data from this device. */
  deleteAccount: () => Promise<void>;
  stop: () => void;
}

const SYNCED_KEY = 'milimon:account-synced';

export const toRemoteProfile = ({ currency, locale, colorScheme }: Settings): RemoteProfile => ({
  currency,
  locale,
  colorScheme,
});

export const createAccountSync = ({
  backend,
  settings,
  calculations,
  history,
  session,
  debounceMs = 800,
}: AccountSyncOptions): AccountSync => {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  let unsubscribe: (() => void) | null = null;
  let applyingRemote = false;
  let pending: Promise<SignInOutcome> | null = null;

  const report = (error: unknown) => {
    console.warn('[account] sync failed', error);
  };

  const later = (key: string, task: () => Promise<void>) => {
    clearTimeout(timers.get(key));
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        task().catch(report);
      }, debounceMs),
    );
  };

  const watch = () => {
    if (unsubscribe) {
      return;
    }
    const stopSettings = onSettingsChange((next) => {
      if (!applyingRemote) {
        later('profile', () => backend.saveProfile(toRemoteProfile(next)));
      }
    });
    const stopDrafts = onCalculationsChange((formulaId) => {
      later(`draft:${formulaId}`, () => {
        const draft = calculations.loadDraft(formulaId);
        return draft ? backend.saveDraft(formulaId, draft) : backend.deleteDraft(formulaId);
      });
    });
    const stopHistory = onHistoryChange((change) => {
      if (change.type === 'added') {
        backend.saveHistoryEntry(change.entry).catch(report);
      } else if (change.type === 'removed') {
        backend.deleteHistoryEntry(change.id).catch(report);
      }
    });
    unsubscribe = () => {
      stopSettings();
      stopDrafts();
      stopHistory();
    };
  };

  const stop = () => {
    unsubscribe?.();
    unsubscribe = null;
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
  };

  const uploadLocal = async () => {
    await backend.saveProfile(toRemoteProfile(settings.load()));
    await Promise.all(
      Object.entries(calculations.loadAll()).map(([formulaId, draft]) =>
        backend.saveDraft(formulaId, draft),
      ),
    );
    // Oldest first, so the server keeps the same latest entries if it has to trim.
    for (const entry of [...history.list()].reverse()) {
      await backend.saveHistoryEntry(entry);
    }
  };

  const hasLocalData = () =>
    settings.load().currency !== DEFAULT_SETTINGS.currency ||
    Object.keys(calculations.loadAll()).length > 0 ||
    history.list().length > 0;

  const resolveSignIn = async (): Promise<SignInOutcome> => {
    if (readJson<boolean>(session, SYNCED_KEY) === true) {
      return 'restored';
    }
    const profile = await backend.fetchProfile();
    if (profile) {
      const [drafts, entries] = await Promise.all([backend.fetchDrafts(), backend.fetchHistory()]);
      applyingRemote = true;
      try {
        settings.save(profile);
        calculations.replaceAll(drafts);
        history.replaceAll(entries);
      } finally {
        applyingRemote = false;
      }
      writeJson(session, SYNCED_KEY, true);
      return 'restored';
    }
    if (hasLocalData()) {
      return 'needs-migration';
    }
    await uploadLocal();
    writeJson(session, SYNCED_KEY, true);
    return 'created';
  };

  const clearDevice = () => {
    stop();
    session?.removeItem(SYNCED_KEY);
    pending = null;
    applyingRemote = true;
    try {
      settings.save({ currency: DEFAULT_SETTINGS.currency });
      calculations.replaceAll({});
      history.replaceAll([]);
    } finally {
      applyingRemote = false;
    }
  };

  const finishMigration = async () => {
    writeJson(session, SYNCED_KEY, true);
    pending = Promise.resolve('created');
    watch();
  };

  return {
    start: async () => {
      const user = await backend.getUser();
      if (!user) {
        return null;
      }
      pending ??= resolveSignIn();
      let outcome: SignInOutcome;
      try {
        outcome = await pending;
      } catch (error) {
        pending = null;
        throw error;
      }
      if (outcome !== 'needs-migration') {
        watch();
      }
      return { user, outcome };
    },
    importLocal: async () => {
      await uploadLocal();
      await finishMigration();
    },
    startFresh: async () => {
      clearDevice();
      await uploadLocal();
      await finishMigration();
    },
    signOut: async () => {
      await backend.signOut();
      clearDevice();
    },
    deleteAccount: async () => {
      await backend.deleteAccount();
      clearDevice();
    },
    stop,
  };
};
