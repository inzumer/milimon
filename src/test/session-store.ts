import { createSessionStore, type AccountRole } from '@services/account';
import { TEST_USER } from './fake-account-backend';
import { createMemoryStorage } from './memory-storage';

/** An in-memory session store, signed in as `TEST_USER` with the given role (or signed out). */
export const sessionStoreWith = (role: AccountRole | null) => {
  const store = createSessionStore(createMemoryStorage());
  if (role) {
    store.write({
      accessToken: 'a',
      refreshToken: 'r',
      expiresAt: Date.now() + 60_000,
      user: { ...TEST_USER, role },
    });
  }

  return store;
};
