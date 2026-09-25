interface ImportMetaEnv {
  /** GA4 measurement ID (`G-XXXXXXXXXX`). Analytics and the consent banner are off without it. */
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
