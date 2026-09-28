import { ACCESS_TOKEN_REFRESH_MARGIN_MS, API_HEADERS } from '@constants';
import { isDraft, normalizeHistory, type CalculatorDrafts, type HistoryEntry } from '@stores';
import { HttpError, isLocale, requestJson, type RequestOptions } from '@utils';
import {
  isAccountRole,
  type AccountBackend,
  type AccountUser,
  type AdminUser,
  type AdminUserPage,
  type AgendaEntry,
  type RemoteProfile,
  type RoleChange,
} from './account-backend';
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

/** The session user as the API sends it; accounts from before roles existed read as "user". */
export const toAccountUser = (user: AccountUser): AccountUser => ({
  ...user,
  role: isAccountRole(user.role) ? user.role : 'user',
});

/** `AccountBackend` over HTTP: client headers, token refresh ahead of expiry and once on a 401. */
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
    const user = toAccountUser(response.user);
    const session: StoredSession = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: now() + response.expiresIn * 1000,
      user,
    };
    store.write(session);
    return session;
  };

  const refresh = (session: StoredSession): Promise<StoredSession> => {
    refreshing ??= call<SessionResponse>(
      '/auth/refresh',
      { method: 'POST', body: { refreshToken: session.refreshToken } },
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
    fetchMe: async () => {
      const user = toAccountUser(await authed<AccountUser>('/me'));
      const session = store.read();
      if (session) {
        store.write({ ...session, user });
      }
      return user;
    },
    listUsers: async (search, page) => {
      const query = new URLSearchParams({ page: String(page) });
      if (search.trim()) {
        query.set('search', search.trim());
      }
      return authed<AdminUserPage>(`/admin/users?${query.toString()}`);
    },
    setUserRole: async (userId, role) =>
      authed<AdminUser>(`/admin/users/${encodeURIComponent(userId)}/role`, {
        method: 'PATCH',
        body: { role },
      }),
    listRoleChanges: async (page) => authed<RoleChange[]>(`/admin/role-changes?page=${page}`),
    listAgenda: async (from, to) =>
      authed<AgendaEntry[]>(`/admin/agenda?${new URLSearchParams({ from, to }).toString()}`),
    createAgendaEntry: async (entry) =>
      authed<AgendaEntry>('/admin/agenda', { method: 'POST', body: entry }),
    updateAgendaEntry: async (id, entry) =>
      authed<AgendaEntry>(`/admin/agenda/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: entry,
      }),
    deleteAgendaEntry: async (id) => {
      await authed(`/admin/agenda/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
  };
};
