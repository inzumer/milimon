import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  createSupabaseBackend,
  createSupabaseClient,
  fromProfileRow,
  toAccountUser,
} from '../supabase-backend';

const USER = {
  id: 'user-1',
  email: 'ada@example.com',
  user_metadata: { full_name: 'Ada Cook', avatar_url: 'https://example.com/ada.png' },
} as unknown as User;

type Result = { data?: unknown; error?: unknown };

/**
 * Minimal stand-in for the Supabase client: every query builder method records its call and
 * returns the builder, which resolves to the next queued result when awaited.
 */
const createClientMock = (session: { user: User } | null = { user: USER }) => {
  const results: Result[] = [];
  const calls: [string, ...unknown[]][] = [];
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'upsert', 'delete', 'maybeSingle', 'overrideTypes']) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, ...args]);
      return builder;
    };
  }
  builder['then'] = (resolve: (value: Result) => void) =>
    resolve({ data: null, error: null, ...results.shift() });
  const unsubscribe = vi.fn();
  let authListener: ((event: string, session: { user: User } | null) => void) | undefined;
  const client = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session }, error: null })),
      onAuthStateChange: vi.fn((listener: typeof authListener) => {
        authListener = listener;
        return { data: { subscription: { unsubscribe } } };
      }),
      signInWithOAuth: vi.fn(async () => ({ data: {}, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    rpc: vi.fn(async () => ({ data: null, error: null, ...results.shift() })),
    from: vi.fn((table: string) => {
      calls.push(['from', table]);
      return builder;
    }),
  };
  return {
    backend: createSupabaseBackend(client as unknown as SupabaseClient),
    client,
    calls,
    queue: (...next: Result[]) => results.push(...next),
    emit: (nextSession: { user: User } | null) => authListener?.('SIGNED_IN', nextSession),
    unsubscribe,
  };
};

describe('supabase backend', () => {
  it('should map the provider user to the account user', () => {
    expect(toAccountUser(USER)).toStrictEqual({
      id: 'user-1',
      name: 'Ada Cook',
      email: 'ada@example.com',
      avatarUrl: 'https://example.com/ada.png',
    });
    expect(
      toAccountUser({ id: 'x', user_metadata: { name: 'Bo', picture: '' } } as unknown as User),
    ).toStrictEqual({ id: 'x', name: 'Bo', email: null, avatarUrl: null });
  });

  it('should sanitize profile rows', () => {
    expect(fromProfileRow({ currency: 'EUR', locale: 'en', color_scheme: 'dark' })).toStrictEqual({
      currency: 'EUR',
      locale: 'en',
      colorScheme: 'dark',
    });
    expect(fromProfileRow({ currency: 'euro', locale: 'fr', color_scheme: 'blue' })).toStrictEqual({
      currency: 'ARS',
      locale: null,
      colorScheme: null,
    });
  });

  it('should create a PKCE client that stores the session under the app key', () => {
    const client = createSupabaseClient({ url: 'https://demo.supabase.co', key: 'public-key' });
    expect(client.auth).toBeDefined();
  });

  it('should read the current user and follow auth changes', async () => {
    const { backend, emit, unsubscribe } = createClientMock();
    await expect(backend.getUser()).resolves.toMatchObject({ id: 'user-1' });

    const listener = vi.fn();
    const stop = backend.onUserChange(listener);
    emit(null);
    emit({ user: USER });
    expect(listener.mock.calls).toStrictEqual([[null], [toAccountUser(USER)]]);
    stop();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('should return no user and refuse data calls while signed out', async () => {
    const { backend } = createClientMock(null);
    await expect(backend.getUser()).resolves.toBeNull();
    await expect(backend.fetchProfile()).rejects.toThrow('Not signed in');
  });

  it('should sign in with the provider and a redirect', async () => {
    const { backend, client } = createClientMock();
    await backend.signIn('google', 'https://site/es/account');
    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://site/es/account' },
    });
  });

  it('should throw the provider errors', async () => {
    const { backend, client } = createClientMock();
    const failure = new Error('provider down');
    client.auth.signOut.mockResolvedValueOnce({ error: failure } as never);
    await expect(backend.signOut()).rejects.toBe(failure);
  });

  it('should delete the account and drop the local session', async () => {
    const { backend, client } = createClientMock();
    await backend.deleteAccount();
    expect(client.rpc).toHaveBeenCalledWith('delete_own_account');
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('should read and write the profile of the signed-in person', async () => {
    const { backend, calls, queue } = createClientMock();
    queue({ data: { currency: 'USD', locale: 'es', color_scheme: null } }, { data: null });
    await expect(backend.fetchProfile()).resolves.toStrictEqual({
      currency: 'USD',
      locale: 'es',
      colorScheme: null,
    });
    await expect(backend.fetchProfile()).resolves.toBeNull();
    expect(calls).toContainEqual(['eq', 'id', 'user-1']);

    await backend.saveProfile({ currency: 'EUR', locale: null, colorScheme: 'light' });
    expect(calls).toContainEqual([
      'upsert',
      { id: 'user-1', currency: 'EUR', locale: null, color_scheme: 'light' },
    ]);
  });

  it('should read, save and delete drafts, skipping invalid rows', async () => {
    const { backend, calls, queue } = createClientMock();
    queue({
      data: [
        { formula_id: 'pricing', draft: { unitCost: '12' } },
        { formula_id: 'broken', draft: [1, 2] },
      ],
    });
    await expect(backend.fetchDrafts()).resolves.toStrictEqual({ pricing: { unitCost: '12' } });

    await backend.saveDraft('pricing', { unitCost: '1' });
    expect(calls).toContainEqual([
      'upsert',
      { user_id: 'user-1', formula_id: 'pricing', draft: { unitCost: '1' } },
    ]);

    await backend.deleteDraft('pricing');
    expect(calls.slice(-3)).toStrictEqual([
      ['delete'],
      ['eq', 'user_id', 'user-1'],
      ['eq', 'formula_id', 'pricing'],
    ]);
  });

  it('should treat an empty draft list as no drafts', async () => {
    const { backend } = createClientMock();
    await expect(backend.fetchDrafts()).resolves.toStrictEqual({});
  });
});
