import type {
  AccountBackend,
  AccountUser,
  AdminUser,
  AgendaEntry,
  AgendaEntryInput,
  RemoteProfile,
  RoleChange,
} from '@services/account';
import type { CalculatorDrafts, HistoryEntry } from '@stores';

export interface FakeAccountBackend extends AccountBackend {
  remote: {
    user: AccountUser | null;
    profile: RemoteProfile | null;
    drafts: CalculatorDrafts;
    history: HistoryEntry[];
    users: AdminUser[];
    roleChanges: RoleChange[];
    agenda: AgendaEntry[];
  };
  setUser: (user: AccountUser | null) => void;
}

export const TEST_USER: AccountUser = {
  id: 'user-1',
  name: 'Ada Cook',
  email: 'ada@example.com',
  avatarUrl: null,
  role: 'user',
};

/** In-memory `AccountBackend` with vi.fn spies on every method. */
export const createFakeAccountBackend = (
  initial: Partial<FakeAccountBackend['remote']> = {},
): FakeAccountBackend => {
  const remote: FakeAccountBackend['remote'] = {
    user: null,
    profile: null,
    drafts: {},
    history: [],
    users: [],
    roleChanges: [],
    agenda: [],
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
    signInWithGoogle: vi.fn(async () => {
      setUser(TEST_USER);
      return TEST_USER;
    }),
    signInWithFacebook: vi.fn(async () => {
      setUser(TEST_USER);
      return TEST_USER;
    }),
    signOut: vi.fn(async () => setUser(null)),
    deleteAccount: vi.fn(async () => {
      remote.profile = null;
      remote.drafts = {};
      remote.history = [];
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
    fetchHistory: vi.fn(async () => remote.history),
    saveHistoryEntry: vi.fn(async (entry: HistoryEntry) => {
      remote.history = [entry, ...remote.history.filter((item) => item.id !== entry.id)];
    }),
    deleteHistoryEntry: vi.fn(async (id: string) => {
      remote.history = remote.history.filter((item) => item.id !== id);
    }),
    fetchMe: vi.fn(async () => {
      if (!remote.user) {
        throw new Error('signed out');
      }
      return remote.user;
    }),
    listUsers: vi.fn(async (search: string, page: number) => {
      const items = remote.users.filter((user) =>
        `${user.name ?? ''} ${user.email ?? ''}`.toLowerCase().includes(search.toLowerCase()),
      );
      return { items, total: items.length, page, pageSize: 20 };
    }),
    setUserRole: vi.fn(async (userId: string, role: AdminUser['role']) => {
      const user = remote.users.find((item) => item.id === userId);
      if (!user) {
        throw new Error('not found');
      }
      user.role = role;
      return { ...user };
    }),
    listRoleChanges: vi.fn(async () => remote.roleChanges),
    listAgenda: vi.fn(async (from: string, to: string) =>
      remote.agenda
        .filter((entry) => entry.date >= from && entry.date <= to)
        .sort((a, b) => a.date.localeCompare(b.date)),
    ),
    createAgendaEntry: vi.fn(async (input: AgendaEntryInput) => {
      const entry: AgendaEntry = {
        ...input,
        id: `entry-${remote.agenda.length + 1}`,
        updatedByEmail: remote.user?.email ?? null,
        updatedAt: '2026-09-27T12:00:00.000Z',
      };
      remote.agenda.push(entry);
      return { ...entry };
    }),
    updateAgendaEntry: vi.fn(async (id: string, input: AgendaEntryInput) => {
      const entry = remote.agenda.find((item) => item.id === id);
      if (!entry) {
        throw new Error('not found');
      }
      Object.assign(entry, input);
      return { ...entry };
    }),
    deleteAgendaEntry: vi.fn(async (id: string) => {
      remote.agenda = remote.agenda.filter((item) => item.id !== id);
    }),
  };
};
