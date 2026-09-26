import { AUTH_STORAGE_KEY } from '@constants';
import { createMemoryStorage } from '@test/memory-storage';
import { createSessionStore, type StoredSession } from '../session-store';

const SESSION: StoredSession = {
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresAt: 1_000,
  user: { id: 'u1', name: 'Ada', email: null, avatarUrl: null, role: 'user' },
};

describe('session store', () => {
  it('should write, read and clear the session, announcing each change', () => {
    const store = createSessionStore(createMemoryStorage());
    const listener = vi.fn();
    const stop = store.subscribe(listener);

    expect(store.read()).toBeNull();
    store.write(SESSION);
    expect(store.read()).toStrictEqual(SESSION);
    store.clear();
    expect(store.read()).toBeNull();
    stop();
    store.write(SESSION);

    expect(listener.mock.calls).toStrictEqual([[SESSION], [null]]);
  });

  it('should read sessions saved before roles existed as plain users', () => {
    const storage = createMemoryStorage();
    const { role: _role, ...legacyUser } = SESSION.user;
    storage.setItem('milimon:auth', JSON.stringify({ ...SESSION, user: legacyUser }));
    expect(createSessionStore(storage).read()?.user.role).toBe('user');
  });

  it('should ignore stored data that is not a session', () => {
    const storage = createMemoryStorage();
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...SESSION, user: { id: '' } }));
    expect(createSessionStore(storage).read()).toBeNull();
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...SESSION, expiresAt: 'soon' }));
    expect(createSessionStore(storage).read()).toBeNull();
  });

  it('should follow sign-in and sign-out in other tabs', () => {
    const store = createSessionStore(createMemoryStorage());
    const listener = vi.fn();
    const stop = store.subscribe(listener);
    window.dispatchEvent(new StorageEvent('storage', { key: AUTH_STORAGE_KEY }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'other' }));
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    stop();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should not fail when storage is blocked', () => {
    const store = createSessionStore({
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => {
        throw new Error('blocked');
      },
    });
    expect(() => store.clear()).not.toThrow();
    expect(createSessionStore(null).read()).toBeNull();
  });
});
