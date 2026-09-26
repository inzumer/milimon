import type { CalculatorDraft, CalculatorDrafts, ColorScheme, HistoryEntry } from '@stores';
import type { Locale } from '@utils';

export type AuthProvider = 'google' | 'facebook';

export const AUTH_PROVIDERS: readonly AuthProvider[] = ['google', 'facebook'];

export interface AccountUser {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface RemoteProfile {
  currency: string;
  locale: Locale | null;
  colorScheme: ColorScheme | null;
}

/**
 * Everything the app needs from the accounts API (`api-milimon-cost-lab`). `api-backend.ts`
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
}
