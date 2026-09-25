import type { CalculatorDraft, CalculatorDrafts, ColorScheme } from '@repositories';
import type { Locale } from '@utils';

export type AuthProvider = 'google' | 'facebook';

export const AUTH_PROVIDERS: readonly AuthProvider[] = ['google', 'facebook'];

/** The signed-in person, as shown on the account page. */
export interface AccountUser {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

/** Preferences stored in the person's profile (same meaning as in `Settings`). */
export interface RemoteProfile {
  currency: string;
  locale: Locale | null;
  colorScheme: ColorScheme | null;
}

/**
 * Everything the app needs from the account provider. Supabase implements it
 * (`supabase-backend.ts`); tests use an in-memory fake. Every data method acts on the signed-in
 * person only (row level security enforces it on the server as well).
 */
export interface AccountBackend {
  getUser: () => Promise<AccountUser | null>;
  /** Called on sign-in, sign-out and token refresh; returns the unsubscribe function. */
  onUserChange: (listener: (user: AccountUser | null) => void) => () => void;
  /** Redirects to the provider; the person comes back to `redirectTo`. */
  signIn: (provider: AuthProvider, redirectTo: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Deletes the account and every row that belongs to it, then signs out. */
  deleteAccount: () => Promise<void>;
  fetchProfile: () => Promise<RemoteProfile | null>;
  saveProfile: (profile: RemoteProfile) => Promise<void>;
  fetchDrafts: () => Promise<CalculatorDrafts>;
  saveDraft: (formulaId: string, draft: CalculatorDraft) => Promise<void>;
  deleteDraft: (formulaId: string) => Promise<void>;
}
