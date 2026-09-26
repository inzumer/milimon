interface ImportMetaEnv {
  /** Google Tag Manager container id (`GTM-XXXXXXX`). Analytics and the consent banner are off without it. */
  readonly PUBLIC_GTM_ID?: string;
  /** Supabase project URL. Accounts (and the login UI) are off unless both Supabase values are set. */
  readonly PUBLIC_SUPABASE_URL?: string;
  /** Supabase publishable key (safe to expose: data access is limited by row level security). */
  readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
