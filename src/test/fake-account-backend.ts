import type { CalculatorDrafts } from '@repositories';
import type { AccountBackend, AccountUser, RemoteProfile } from '@services/account';

export interface FakeAccountBackend extends AccountBackend {
  /** Remote state, readable and editable by tests. */
  remote: { user: AccountUser | null; profile: RemoteProfile | null; drafts: CalculatorDrafts };
  /** Simulates the provider signing someone in or out (fires `onUserChange`). */
  setUser: (user: AccountUser | null) => void;
}

export const TEST_USER: AccountUser = {
  id: 'user-1',
  name: 'Ada Cook',
  email: 'ada@example.com',
  avatarUrl: null,
};

/** In-memory `AccountBackend` with vi.fn spies on every method. */
export const createFakeAccountBackend = (
  initial: Partial<FakeAccountBackend['remote']> = {},
): FakeAccountBackend => {
  const remote: FakeAccountBackend['remote'] = {
    user: null,
    profile: null,
    drafts: {},
    ...initial,
  };
  const listeners = new Set<(user: AccountUser | null) => void>();
  const setUser = (user: AccountUser | null) => {
    remote.user = user;
    listeners.forEach((listener) => listener(user));
  };
  return {
    remote,
    setUser,
    getUser: vi.fn(async () => remote.user),
    onUserChange: vi.fn((listener: (user: AccountUser | null) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }),
    signIn: vi.fn(async () => undefined),
    signOut: vi.fn(async () => setUser(null)),
    deleteAccount: vi.fn(async () => {
      remote.profile = null;
      remote.drafts = {};
      setUser(null);
    }),
    fetchProfile: vi.fn(async () => remote.profile),
    saveProfile: vi.fn(async (profile: RemoteProfile) => {
      remote.profile = profile;
    }),
    fetchDrafts: vi.fn(async () => remote.drafts),
    saveDraft: vi.fn(async (formulaId: string, draft: CalculatorDrafts[string]) => {
      remote.drafts = { ...remote.drafts, [formulaId]: draft };
    }),
    deleteDraft: vi.fn(async (formulaId: string) => {
      const { [formulaId]: _removed, ...rest } = remote.drafts;
      remote.drafts = rest;
    }),
  };
};
