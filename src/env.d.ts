interface ImportMetaEnv {
  readonly PUBLIC_GTM_ID?: string;
  readonly PUBLIC_GTM_AUTH?: string;
  readonly PUBLIC_GTM_PREVIEW?: string;
  readonly PUBLIC_API_URL?: string;
  readonly PUBLIC_API_KEY?: string;
  readonly PUBLIC_API_APP_ID?: string;
  readonly PUBLIC_GOOGLE_CLIENT_ID?: string;
  readonly PUBLIC_FACEBOOK_APP_ID?: string;
  /** `github` on staging: Keystatic online and drafts visible. */
  readonly PUBLIC_KEYSTATIC_STORAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
