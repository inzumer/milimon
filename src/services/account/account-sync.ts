import {
  DEFAULT_SETTINGS,
  useDraftsStore,
  useHistoryStore,
  useSettingsStore,
  type Settings,
} from '@stores';
import { readJson, writeJson, type KeyValueStorage } from '@utils';
import type { AccountBackend, AccountUser, RemoteProfile } from './account-backend';

/**
 * Keeps the local stores (what the UI reads, synchronously and offline) in sync with the
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
  session: KeyValueStorage | null;
  debounceMs?: number;
}

export interface AccountSync {
  start: () => Promise<{ user: AccountUser; outcome: SignInOutcome } | null>;
  importLocal: () => Promise<void>;
  startFresh: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  stop: () => void;
}

const SYNCED_KEY = 'milimon:account-synced';

export const toRemoteProfile = ({ currency, locale, colorScheme }: Settings): RemoteProfile => ({
  currency,
  locale,
  colorScheme,
});

const profileChanged = (next: Settings, previous: Settings) =>
  next.currency !== previous.currency ||
  next.locale !== previous.locale ||
  next.colorScheme !== previous.colorScheme;

export const createAccountSync = ({
  backend,
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
    const stopSettings = useSettingsStore.subscribe((next, previous) => {
      if (!applyingRemote && profileChanged(next, previous)) {
        later('profile', () => backend.saveProfile(toRemoteProfile(next)));
      }
    });
    const stopDrafts = useDraftsStore.subscribe(({ drafts }, previous) => {
      if (applyingRemote) {
        return;
      }
      const ids = new Set([...Object.keys(drafts), ...Object.keys(previous.drafts)]);
      for (const formulaId of ids) {
        if (drafts[formulaId] !== previous.drafts[formulaId]) {
          later(`draft:${formulaId}`, () => {
            const draft = useDraftsStore.getState().drafts[formulaId];
            return draft ? backend.saveDraft(formulaId, draft) : backend.deleteDraft(formulaId);
          });
        }
      }
    });
    const stopHistory = useHistoryStore.subscribe(({ entries }, previous) => {
      if (applyingRemote) {
        return;
      }
      const before = new Set(previous.entries.map((entry) => entry.id));
      const added = entries.filter((entry) => !before.has(entry.id));
      added.forEach((entry) => backend.saveHistoryEntry(entry).catch(report));
      if (added.length === 0) {
        const after = new Set(entries.map((entry) => entry.id));
        previous.entries
          .filter((entry) => !after.has(entry.id))
          .forEach((entry) => backend.deleteHistoryEntry(entry.id).catch(report));
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
    await backend.saveProfile(toRemoteProfile(useSettingsStore.getState()));
    await Promise.all(
      Object.entries(useDraftsStore.getState().drafts).map(([formulaId, draft]) =>
        backend.saveDraft(formulaId, draft),
      ),
    );
    for (const entry of [...useHistoryStore.getState().entries].reverse()) {
      await backend.saveHistoryEntry(entry);
    }
  };

  const hasLocalData = () =>
    useSettingsStore.getState().currency !== DEFAULT_SETTINGS.currency ||
    Object.keys(useDraftsStore.getState().drafts).length > 0 ||
    useHistoryStore.getState().entries.length > 0;

  const resolveSignIn = async (): Promise<SignInOutcome> => {
    if (readJson<boolean>(session, SYNCED_KEY) === true) {
      return 'restored';
    }
    const profile = await backend.fetchProfile();
    if (profile) {
      const [drafts, entries] = await Promise.all([backend.fetchDrafts(), backend.fetchHistory()]);
      applyingRemote = true;
      try {
        useSettingsStore.getState().update(profile);
        useDraftsStore.getState().replaceAll(drafts);
        useHistoryStore.getState().replaceAll(entries);
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
      useSettingsStore.getState().update({ currency: DEFAULT_SETTINGS.currency });
      useDraftsStore.getState().replaceAll({});
      useHistoryStore.getState().replaceAll([]);
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
