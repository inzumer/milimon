import { createMemoryStorage } from '@test/memory-storage';
import { createApiBackend, SessionExpiredError } from '../api-backend';
import { createSessionStore, type StoredSession } from '../session-store';

const CONFIG = {
  apiUrl: 'https://api.example.com',
  apiKey: 'web-key',
  appId: 'web',
  googleClientId: 'g',
  facebookAppId: 'f',
};
const NOW = 1_000_000;
const USER = {
  id: 'u1',
  name: 'Ada',
  email: 'ada@example.com',
  avatarUrl: null,
  role: 'user' as const,
};

const sessionResponse = (suffix = '1') => ({
  accessToken: `access-${suffix}`,
  refreshToken: `refresh-${suffix}`,
  expiresIn: 900,
  user: USER,
});

const reply = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

const setup = (session: StoredSession | null = null) => {
  const store = createSessionStore(createMemoryStorage());
  if (session) {
    store.write(session);
  }
  const replies: Response[] = [];
  const calls: Call[] = [];
  const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({
      url,
      method: init.method ?? 'GET',
      headers: init.headers as Record<string, string>,
      body: init.body ? JSON.parse(init.body as string) : undefined,
    });
    return replies.shift() ?? reply(204);
  }) as unknown as typeof fetch;
  const backend = createApiBackend(CONFIG, {
    store,
    now: () => NOW,
    request: { fetchImpl, sleep: async () => undefined },
  });
  return { backend, store, calls, queue: (...next: Response[]) => replies.push(...next) };
};

const fresh: StoredSession = {
  accessToken: 'access-0',
  refreshToken: 'refresh-0',
  expiresAt: NOW + 10 * 60_000,
  user: USER,
};

describe('api backend', () => {
  it('should sign in with Google, store the session and send the client headers', async () => {
    const { backend, store, calls, queue } = setup();
    queue(reply(200, sessionResponse()));

    await expect(backend.signInWithGoogle('google-credential', 'en')).resolves.toStrictEqual(USER);

    expect(calls[0]).toMatchObject({
      url: 'https://api.example.com/auth/google',
      method: 'POST',
      body: { credential: 'google-credential', locale: 'en' },
      headers: {
        'request-app-id': 'web',
        'x-api-key': 'web-key',
        'content-type': 'application/json',
      },
    });
    expect(calls[0]?.headers['request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(calls[0]?.headers['authorization']).toBeUndefined();
    expect(store.read()).toMatchObject({ accessToken: 'access-1', expiresAt: NOW + 900_000 });
    await expect(backend.getUser()).resolves.toStrictEqual(USER);
  });

  it('should sign in with Facebook', async () => {
    const { backend, calls, queue } = setup();
    queue(reply(200, sessionResponse()));
    await backend.signInWithFacebook('fb-token', 'es');
    expect(calls[0]).toMatchObject({
      url: expect.stringContaining('/auth/facebook'),
      body: { accessToken: 'fb-token', locale: 'es' },
    });
  });

  it('should call personal routes with the access token', async () => {
    const { backend, calls, queue } = setup(fresh);
    queue(reply(200, { profile: { currency: 'USD', locale: 'fr', colorScheme: 'dark' } }));

    await expect(backend.fetchProfile()).resolves.toStrictEqual({
      currency: 'USD',
      locale: null,
      colorScheme: 'dark',
    });
    expect(calls[0]?.headers['authorization']).toBe('Bearer access-0');
  });

  it('should read accounts from before roles as plain users', async () => {
    const { backend, store, queue } = setup();
    const { role: _role, ...legacy } = USER;
    queue(reply(200, { ...sessionResponse(), user: legacy }));

    await expect(backend.signInWithGoogle('credential', 'es')).resolves.toMatchObject({ role: 'user' });
    expect(store.read()?.user.role).toBe('user');
  });

  it('should refresh the signed-in person and keep the stored session in step', async () => {
    const { backend, store, calls, queue } = setup(fresh);
    queue(reply(200, { ...USER, role: 'admin' }));

    await expect(backend.fetchMe()).resolves.toMatchObject({ role: 'admin' });
    expect(calls[0]?.url).toBe('https://api.example.com/me');
    expect(store.read()?.user.role).toBe('admin');
  });

  it('should call the admin routes', async () => {
    const { backend, calls, queue } = setup(fresh);
    queue(
      reply(200, { items: [], total: 0, page: 2, pageSize: 20 }),
      reply(200, { items: [], total: 0, page: 1, pageSize: 20 }),
      reply(200, { ...USER, role: 'editor', createdAt: '2026-09-27T00:00:00.000Z' }),
      reply(200, []),
    );

    await backend.listUsers(' ada ', 2);
    await backend.listUsers('', 1);
    await expect(backend.setUserRole('u 1', 'editor')).resolves.toMatchObject({ role: 'editor' });
    await backend.listRoleChanges(3);

    expect(calls.map((call) => `${call.method} ${call.url}`)).toStrictEqual([
      'GET https://api.example.com/admin/users?page=2&search=ada',
      'GET https://api.example.com/admin/users?page=1',
      'PATCH https://api.example.com/admin/users/u%201/role',
      'GET https://api.example.com/admin/role-changes?page=3',
    ]);
    expect(calls[2]?.body).toStrictEqual({ role: 'editor' });
  });

  it('should call the agenda routes', async () => {
    const { backend, calls, queue } = setup(fresh);
    const entry = {
      id: 'e 1',
      date: '2026-10-06',
      kind: 'recipe',
      status: 'planned',
      title: 'Budín de limón',
      notes: null,
      updatedByEmail: 'ada@example.com',
      updatedAt: '2026-09-27T12:00:00.000Z',
    } as const;
    const input = {
      date: entry.date,
      kind: entry.kind,
      status: entry.status,
      title: entry.title,
      notes: null,
    };
    queue(reply(200, [entry]), reply(201, entry), reply(200, entry), reply(204));

    await expect(backend.listAgenda('2026-10-01', '2026-10-31')).resolves.toStrictEqual([entry]);
    await expect(backend.createAgendaEntry(input)).resolves.toStrictEqual(entry);
    await backend.updateAgendaEntry('e 1', input);
    await backend.deleteAgendaEntry('e 1');

    expect(calls.map((call) => `${call.method} ${call.url}`)).toStrictEqual([
      'GET https://api.example.com/admin/agenda?from=2026-10-01&to=2026-10-31',
      'POST https://api.example.com/admin/agenda',
      'PATCH https://api.example.com/admin/agenda/e%201',
      'DELETE https://api.example.com/admin/agenda/e%201',
    ]);
    expect(calls[1]?.body).toStrictEqual(input);
  });

  it('should refresh ahead of expiry, once for concurrent calls', async () => {
    const { backend, calls, queue } = setup({ ...fresh, expiresAt: NOW + 30_000 });
    queue(
      reply(200, sessionResponse('2')),
      reply(200, { drafts: {} }),
      reply(200, { entries: [] }),
    );

    await Promise.all([backend.fetchDrafts(), backend.fetchHistory()]);

    expect(calls.filter((call) => call.url.endsWith('/auth/refresh'))).toHaveLength(1);
    expect(calls[0]?.body).toStrictEqual({ refreshToken: 'refresh-0' });
    expect(
      calls.slice(1).every((call) => call.headers['authorization'] === 'Bearer access-2'),
    ).toBe(true);
  });

  it('should refresh and retry once when the API answers 401', async () => {
    const { backend, calls, queue } = setup(fresh);
    queue(reply(401), reply(200, sessionResponse('2')), reply(204));

    await backend.saveProfile({ currency: 'ARS', locale: null, colorScheme: null });

    expect(calls.map((call) => call.url.replace(CONFIG.apiUrl, ''))).toStrictEqual([
      '/me/profile',
      '/auth/refresh',
      '/me/profile',
    ]);
    expect(calls[2]?.headers['authorization']).toBe('Bearer access-2');
  });

  it('should clear the session when it cannot be refreshed', async () => {
    const { backend, store, queue } = setup({ ...fresh, expiresAt: NOW });
    queue(reply(401, { message: 'Invalid refresh token' }));

    await expect(backend.fetchDrafts()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(store.read()).toBeNull();
  });

  it('should keep the session when the refresh fails for another reason', async () => {
    const { backend, store, queue } = setup({ ...fresh, expiresAt: NOW });
    queue(reply(500));
    await expect(backend.fetchDrafts()).rejects.toMatchObject({ status: 500 });
    expect(store.read()).not.toBeNull();
  });

  it('should refuse personal routes without a session', async () => {
    const { backend } = setup();
    await expect(backend.fetchProfile()).rejects.toBeInstanceOf(SessionExpiredError);
  });

  it('should not retry other errors of personal routes', async () => {
    const { backend, calls, queue } = setup(fresh);
    queue(reply(404));
    await expect(backend.fetchProfile()).rejects.toMatchObject({ status: 404 });
    expect(calls).toHaveLength(1);
  });

  it('should sanitize drafts and history from the API', async () => {
    const { backend, queue } = setup(fresh);
    queue(
      reply(200, { drafts: { pricing: { unitCost: '12' }, broken: [1] } }),
      reply(200, { entries: [{ id: 'x' }] }),
      reply(200, { profile: null }),
    );
    await expect(backend.fetchDrafts()).resolves.toStrictEqual({ pricing: { unitCost: '12' } });
    await expect(backend.fetchHistory()).resolves.toStrictEqual([]);
    await expect(backend.fetchProfile()).resolves.toBeNull();
  });

  it('should write drafts and history to their routes', async () => {
    const { backend, calls } = setup(fresh);
    await backend.saveDraft('waste-factor', { wastePercentage: '30' });
    await backend.deleteDraft('waste-factor');
    await backend.saveHistoryEntry({
      id: 'entry-1',
      formulaId: 'waste-factor',
      savedAt: '2026-09-26T12:00:00.000Z',
      draft: {},
      currency: 'ARS',
      result: { value: {}, steps: [] },
      headline: null,
    });
    await backend.deleteHistoryEntry('entry-1');

    expect(
      calls.map((call) => `${call.method} ${call.url.replace(CONFIG.apiUrl, '')}`),
    ).toStrictEqual([
      'PUT /me/drafts/waste-factor',
      'DELETE /me/drafts/waste-factor',
      'PUT /me/history/entry-1',
      'DELETE /me/history/entry-1',
    ]);
    expect(calls[0]?.body).toStrictEqual({ draft: { wastePercentage: '30' } });
    expect(calls[2]?.body).not.toHaveProperty('id');
  });

  it('should sign out locally even if the API call fails', async () => {
    const { backend, store, calls, queue } = setup(fresh);
    queue(reply(400));
    await backend.signOut();
    expect(store.read()).toBeNull();
    expect(calls[0]).toMatchObject({
      url: expect.stringContaining('/auth/sign-out'),
      body: { refreshToken: 'refresh-0' },
    });

    await backend.signOut();
    expect(calls).toHaveLength(1);
  });

  it('should delete the account and clear the session', async () => {
    const { backend, store, calls } = setup(fresh);
    await backend.deleteAccount();
    expect(calls[0]).toMatchObject({ method: 'DELETE', url: 'https://api.example.com/me' });
    expect(store.read()).toBeNull();
  });

  it('should report the signed-in person as the session changes', async () => {
    const { backend, store, queue } = setup();
    const listener = vi.fn();
    const stop = backend.onUserChange(listener);
    queue(reply(200, sessionResponse()));
    await backend.signInWithGoogle('c', 'es');
    store.clear();
    stop();
    expect(listener.mock.calls).toStrictEqual([[USER], [null]]);
  });
});
