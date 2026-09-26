import { ACCESS_TOKEN_REFRESH_MARGIN_MS, API_HEADERS } from '@constants';
import { isDraft, normalizeHistory, type CalculatorDrafts, type HistoryEntry } from '@stores';
import { HttpError, isLocale, requestJson, type RequestOptions } from '@utils';
import type { AccountBackend, AccountUser, RemoteProfile } from './account-backend';
import type { AccountConfig } from './account-config';
import { createSessionStore, type SessionStore, type StoredSession } from './session-store';

interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AccountUser;
}

export class SessionExpiredError extends Error {
  constructor() {
    super('The session expired; sign in again');
    this.name = 'SessionExpiredError';
  }
}

const toProfile = (raw: unknown): RemoteProfile | null => {
  const data = raw as Partial<Record<keyof RemoteProfile, unknown>> | null;
  if (typeof data !== 'object' || data === null || typeof data.currency !== 'string') {
    return null;
  }
  return {
    currency: data.currency,
    locale: isLocale(data.locale) ? data.locale : null,
    colorScheme:
      data.colorScheme === 'light' || data.colorScheme === 'dark' ? data.colorScheme : null,
  };
};

export interface ApiBackendOptions {
  store?: SessionStore;
  request?: Pick<RequestOptions, 'fetchImpl' | 'sleep'>;
  now?: () => number;
}

/**
 * `AccountBackend` over the accounts API. Every call carries the client headers
 * (`request-app-id`, `x-api-key`, `request-id`); personal routes also carry the access token,
 * refreshed ahead of expiry (one refresh at a time) and once more on a 401. When the session
 * can't be refreshed it is cleared and `SessionExpiredError` is thrown.
 */
export const createApiBackend = (
  config: AccountConfig,
  { store = createSessionStore(), request = {}, now = Date.now }: ApiBackendOptions = {},
): AccountBackend => {
  let refreshing: Promise<StoredSession> | null = null;

  const call = <T>(
    path: string,
    init: { method?: string; body?: unknown; token?: string } = {},
    options: Pick<RequestOptions, 'retryAmbiguous'> = {},
  ): Promise<T> =>
    requestJson<T>(
      `${config.apiUrl}${path}`,
      {
        method: init.method ?? 'GET',
        headers: {
          [API_HEADERS.appId]: config.appId,
          [API_HEADERS.apiKey]: config.apiKey,
          [API_HEADERS.requestId]: crypto.randomUUID(),
          ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
          ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
        },
        ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      },
      { ...request, ...options },
    );

  const saveSession = (response: SessionResponse): StoredSession => {
    const session: StoredSession = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: now() + response.expiresIn * 1000,
      user: response.user,
    };
    store.write(session);
    return session;
  };

  const refresh = (session: StoredSession): Promise<StoredSession> => {
    refreshing ??= call<SessionResponse>(
      '/auth/refresh',
      { method: 'POST', body: { refreshToken: session.refreshToken } },
      // A refresh token works once: never resend one the server may already have used.
      { retryAmbiguous: false },
    )
      .then(saveSession)
      .catch((error: unknown) => {
        if (error instanceof HttpError && (error.status === 401 || error.status === 400)) {
          store.clear();
          throw new SessionExpiredError();
        }
        throw error;
      })
      .finally(() => {
        refreshing = null;
      });
    return refreshing;
  };

  const validSession = async (): Promise<StoredSession> => {
    const session = store.read();
    if (!session) {
      throw new SessionExpiredError();
    }
    return session.expiresAt - now() < ACCESS_TOKEN_REFRESH_MARGIN_MS ? refresh(session) : session;
  };

  const authed = async <T>(path: string, init: { method?: string; body?: unknown } = {}) => {
    const session = await validSession();
    try {
      return await call<T>(path, { ...init, token: session.accessToken });
    } catch (error) {
      if (!(error instanceof HttpError) || error.status !== 401) {
        throw error;
      }
      const renewed = await refresh(session);
      return call<T>(path, { ...init, token: renewed.accessToken });
    }
  };

  const signIn = async (path: string, body: object): Promise<AccountUser> =>
    saveSession(await call<SessionResponse>(path, { method: 'POST', body })).user;

  return {
    getUser: async () => store.read()?.user ?? null,
    onUserChange: (listener) => store.subscribe((session) => listener(session?.user ?? null)),
    signInWithGoogle: (credential) => signIn('/auth/google', { credential }),
    signInWithFacebook: (accessToken) => signIn('/auth/facebook', { accessToken }),
    signOut: async () => {
      const session = store.read();
      store.clear();
      if (session) {
        // Best effort: the session is already gone from this device.
        await call('/auth/sign-out', {
          method: 'POST',
          body: { refreshToken: session.refreshToken },
        }).catch(() => undefined);
      }
    },
    deleteAccount: async () => {
      await authed('/me', { method: 'DELETE' });
      store.clear();
    },
    fetchProfile: async () =>
      toProfile((await authed<{ profile: unknown }>('/me/profile')).profile),
    saveProfile: async (profile) => {
      await authed('/me/profile', { method: 'PUT', body: profile });
    },
    fetchDrafts: async () => {
      const { drafts } = await authed<{ drafts: Record<string, unknown> }>('/me/drafts');
      return Object.fromEntries(
        Object.entries(drafts ?? {}).filter(([, draft]) => isDraft(draft)),
      ) as CalculatorDrafts;
    },
    saveDraft: async (formulaId, draft) => {
      await authed(`/me/drafts/${encodeURIComponent(formulaId)}`, {
        method: 'PUT',
        body: { draft },
      });
    },
    deleteDraft: async (formulaId) => {
      await authed(`/me/drafts/${encodeURIComponent(formulaId)}`, { method: 'DELETE' });
    },
    fetchHistory: async () =>
      normalizeHistory((await authed<{ entries: unknown }>('/me/history')).entries),
    saveHistoryEntry: async ({ id, ...entry }: HistoryEntry) => {
      await authed(`/me/history/${encodeURIComponent(id)}`, { method: 'PUT', body: entry });
    },
    deleteHistoryEntry: async (id) => {
      await authed(`/me/history/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
  };
};
