import { AUTH_STORAGE_KEY, SESSION_CHANGED_EVENT } from '@constants';
import { getBrowserStorage, readJson, writeJson, type KeyValueStorage } from '@utils';
import { isAccountRole, type AccountUser } from './account-backend';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AccountUser;
}

export interface SessionStore {
  read: () => StoredSession | null;
  write: (session: StoredSession) => void;
  clear: () => void;
  subscribe: (listener: (session: StoredSession | null) => void) => () => void;
}

const isText = (value: unknown): value is string => typeof value === 'string' && value !== '';
const isNullableText = (value: unknown) => value === null || typeof value === 'string';

const isSession = (value: unknown): value is StoredSession => {
  const data = value as Partial<StoredSession> | null;
  const user = data?.user as Partial<AccountUser> | undefined;
  return (
    typeof data === 'object' &&
    data !== null &&
    isText(data.accessToken) &&
    isText(data.refreshToken) &&
    typeof data.expiresAt === 'number' &&
    typeof user === 'object' &&
    user !== null &&
    isText(user.id) &&
    isNullableText(user.name) &&
    isNullableText(user.email) &&
    isNullableText(user.avatarUrl)
  );
};

/**
 * The signed-in session in `localStorage` (a static site has no server of its own to keep an
 * httpOnly cookie). Changes are announced on `window`, also when another tab signs in or out.
 */
export const createSessionStore = (
  storage: KeyValueStorage | null = getBrowserStorage(),
): SessionStore => {
  const read = (): StoredSession | null => {
    const raw = readJson<unknown>(storage, AUTH_STORAGE_KEY);
    if (!isSession(raw)) {
      return null;
    }
    return {
      ...raw,
      user: { ...raw.user, role: isAccountRole(raw.user.role) ? raw.user.role : 'user' },
    };
  };
  const notify = () => {
    window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT));
  };
  return {
    read,
    write: (session) => {
      writeJson(storage, AUTH_STORAGE_KEY, session);
      notify();
    },
    clear: () => {
      try {
        storage?.removeItem(AUTH_STORAGE_KEY);
      } catch {
        // Storage blocked: nothing was saved either.
      }
      notify();
    },
    subscribe: (listener) => {
      const onChange = () => listener(read());
      const onStorage = (event: StorageEvent) => {
        if (event.key === AUTH_STORAGE_KEY || event.key === null) {
          onChange();
        }
      };
      window.addEventListener(SESSION_CHANGED_EVENT, onChange);
      window.addEventListener('storage', onStorage);
      return () => {
        window.removeEventListener(SESSION_CHANGED_EVENT, onChange);
        window.removeEventListener('storage', onStorage);
      };
    },
  };
};
