interface ImportMetaEnv {
  readonly PUBLIC_GTM_ID?: string;
  readonly PUBLIC_API_URL?: string;
  readonly PUBLIC_API_KEY?: string;
  readonly PUBLIC_API_APP_ID?: string;
  readonly PUBLIC_GOOGLE_CLIENT_ID?: string;
  readonly PUBLIC_FACEBOOK_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
