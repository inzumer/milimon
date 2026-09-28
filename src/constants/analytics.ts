/** Google Tag Manager container script (loaded only after the person accepts analytics). */
export const GTM_SCRIPT_URL = 'https://www.googletagmanager.com/gtm.js';

/** GTM container ids look like `GTM-XXXXXXX`. */
export const GTM_CONTAINER_ID_PATTERN = /^GTM-[A-Z0-9]{4,}$/;

/** GTM environment snippet values (`gtm_auth`, `gtm_preview`), e.g. for staging. */
export const GTM_AUTH_PATTERN = /^[\w-]{8,}$/;
export const GTM_PREVIEW_PATTERN = /^env-\d+$/;

/** Consent Mode v2 `wait_for_update`, in milliseconds. */
export const CONSENT_WAIT_FOR_UPDATE_MS = 500;

/** Fired on `window` to open the cookie preferences (the footer button sends it). */
export const OPEN_COOKIE_PREFERENCES_EVENT = 'milimon:open-cookie-preferences';
