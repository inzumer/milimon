import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { DEFAULT_SETTINGS, isDraft, type CalculatorDrafts } from '@repositories';
import { isLocale } from '@utils';
import type { AccountBackend, AccountUser, RemoteProfile } from './account-backend';
import { AUTH_STORAGE_KEY, type AccountConfig } from './account-config';

/** Columns of the tables created by `supabase/migrations/*_accounts.sql`. */
export interface ProfileRow {
  currency: string;
  locale: string | null;
  color_scheme: string | null;
}

interface DraftRow {
  formula_id: string;
  draft: unknown;
}

const metadataText = (user: User, ...keys: string[]): string | null => {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const value = keys.map((key) => metadata[key]).find((item) => typeof item === 'string');
  return typeof value === 'string' && value.length > 0 ? value : null;
};

export const toAccountUser = (user: User): AccountUser => ({
  id: user.id,
  name: metadataText(user, 'full_name', 'name'),
  email: user.email ?? null,
  avatarUrl: metadataText(user, 'avatar_url', 'picture'),
});

export const fromProfileRow = (row: ProfileRow): RemoteProfile => ({
  currency: /^[A-Z]{3}$/.test(row.currency) ? row.currency : DEFAULT_SETTINGS.currency,
  locale: isLocale(row.locale) ? row.locale : null,
  colorScheme:
    row.color_scheme === 'light' || row.color_scheme === 'dark' ? row.color_scheme : null,
});

/** Supabase answers `{ data, error }` instead of throwing; the sync layer expects exceptions. */
const check = (error: unknown): void => {
  if (error) {
    throw error;
  }
};

export const createSupabaseClient = (config: AccountConfig): SupabaseClient =>
  createClient(config.url, config.key, {
    auth: {
      // PKCE: the provider redirects back with a one-time code, never with tokens in the URL.
      flowType: 'pkce',
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

/** Supabase implementation of `AccountBackend` (Auth with Google/Facebook + Postgres with RLS). */
export const createSupabaseBackend = (client: SupabaseClient): AccountBackend => {
  const currentUser = async (): Promise<User | null> => {
    const { data, error } = await client.auth.getSession();
    check(error);
    return data.session?.user ?? null;
  };

  const userId = async (): Promise<string> => {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not signed in');
    }
    return user.id;
  };

  return {
    getUser: async () => {
      const user = await currentUser();
      return user ? toAccountUser(user) : null;
    },
    onUserChange: (listener) => {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        listener(session ? toAccountUser(session.user) : null);
      });
      return () => data.subscription.unsubscribe();
    },
    signIn: async (provider, redirectTo) => {
      const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo } });
      check(error);
    },
    signOut: async () => {
      const { error } = await client.auth.signOut();
      check(error);
    },
    deleteAccount: async () => {
      const { error } = await client.rpc('delete_own_account');
      check(error);
      // The session belongs to a user that no longer exists: drop it on this device only.
      await client.auth.signOut({ scope: 'local' });
    },
    fetchProfile: async () => {
      const { data, error } = await client
        .from('profiles')
        .select('currency, locale, color_scheme')
        .eq('id', await userId())
        .maybeSingle<ProfileRow>();
      check(error);
      return data ? fromProfileRow(data) : null;
    },
    saveProfile: async (profile) => {
      const { error } = await client.from('profiles').upsert({
        id: await userId(),
        currency: profile.currency,
        locale: profile.locale,
        color_scheme: profile.colorScheme,
      });
      check(error);
    },
    fetchDrafts: async () => {
      const { data, error } = await client
        .from('calculator_drafts')
        .select('formula_id, draft')
        .eq('user_id', await userId())
        .overrideTypes<DraftRow[], { merge: false }>();
      check(error);
      const drafts: CalculatorDrafts = {};
      for (const row of data ?? []) {
        if (isDraft(row.draft)) {
          drafts[row.formula_id] = row.draft;
        }
      }
      return drafts;
    },
    saveDraft: async (formulaId, draft) => {
      const { error } = await client
        .from('calculator_drafts')
        .upsert({ user_id: await userId(), formula_id: formulaId, draft });
      check(error);
    },
    deleteDraft: async (formulaId) => {
      const { error } = await client
        .from('calculator_drafts')
        .delete()
        .eq('user_id', await userId())
        .eq('formula_id', formulaId);
      check(error);
    },
  };
};
