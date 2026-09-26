import type { CalculatorDraft, CalculatorDrafts, ColorScheme, HistoryEntry } from '@stores';
import type { Locale } from '@utils';

export type AuthProvider = 'google' | 'facebook';

export const AUTH_PROVIDERS: readonly AuthProvider[] = ['google', 'facebook'];

export const ACCOUNT_ROLES = ['user', 'editor', 'admin'] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];

/** Roles that can open the administration section (content); only admins manage roles. */
export const ADMIN_SECTION_ROLES: readonly AccountRole[] = ['editor', 'admin'];

export const isAccountRole = (value: unknown): value is AccountRole =>
  ACCOUNT_ROLES.some((role) => role === value);

export interface AccountUser {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: AccountRole;
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  role: AccountRole;
  createdAt: string;
}

export interface AdminUserPage {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RoleChange {
  id: string;
  userEmail: string | null;
  changedByEmail: string | null;
  fromRole: AccountRole;
  toRole: AccountRole;
  reason: 'bootstrap' | 'admin';
  createdAt: string;
}

export interface RemoteProfile {
  currency: string;
  locale: Locale | null;
  colorScheme: ColorScheme | null;
}

/**
 * Everything the app needs from the accounts API (`api-milimon`). `api-backend.ts`
 * implements it over HTTP; tests use an in-memory fake. Every data method acts on the signed-in
 * person only.
 */
export interface AccountBackend {
  getUser: () => Promise<AccountUser | null>;
  onUserChange: (listener: (user: AccountUser | null) => void) => () => void;
  signInWithGoogle: (credential: string) => Promise<AccountUser>;
  signInWithFacebook: (accessToken: string) => Promise<AccountUser>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  fetchProfile: () => Promise<RemoteProfile | null>;
  saveProfile: (profile: RemoteProfile) => Promise<void>;
  fetchDrafts: () => Promise<CalculatorDrafts>;
  saveDraft: (formulaId: string, draft: CalculatorDraft) => Promise<void>;
  deleteDraft: (formulaId: string) => Promise<void>;
  fetchHistory: () => Promise<HistoryEntry[]>;
  saveHistoryEntry: (entry: HistoryEntry) => Promise<void>;
  deleteHistoryEntry: (id: string) => Promise<void>;
  fetchMe: () => Promise<AccountUser>;
  listUsers: (search: string, page: number) => Promise<AdminUserPage>;
  setUserRole: (userId: string, role: AccountRole) => Promise<AdminUser>;
  listRoleChanges: (page: number) => Promise<RoleChange[]>;
}
