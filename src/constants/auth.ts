/** Where the session (tokens + user) is kept, so pages can tell there is one without the SDKs. */
export const AUTH_STORAGE_KEY = 'milimon:auth';

/** Fired on `window` when the session is created, refreshed or cleared. */
export const SESSION_CHANGED_EVENT = 'milimon:session-changed';

/** Refresh the access token when it expires in less than this. */
export const ACCESS_TOKEN_REFRESH_MARGIN_MS = 60_000;

export const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export const FACEBOOK_SDK_URL = 'https://connect.facebook.net/{locale}/sdk.js';

/** Graph API version for the JavaScript SDK; keep it equal to the app's version in Meta for Developers. */
export const FACEBOOK_API_VERSION = 'v23.0';

export const FACEBOOK_LOGIN_SCOPE = 'public_profile,email';

export const PROVIDER_LOCALES = {
  es: { google: 'es-419', facebook: 'es_LA' },
  en: { google: 'en', facebook: 'en_US' },
} as const;

/** Width (px) of the sign-in buttons: Google renders its own at this size and Facebook's matches it. */
export const PROVIDER_BUTTON_WIDTH = 320;
