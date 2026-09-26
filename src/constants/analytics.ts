/** Google Tag Manager container script (loaded only after the person accepts analytics). */
export const GTM_SCRIPT_URL = 'https://www.googletagmanager.com/gtm.js';

/** GTM container ids look like `GTM-XXXXXXX`. */
export const GTM_CONTAINER_ID_PATTERN = /^GTM-[A-Z0-9]{4,}$/;

/**
 * How long Google tags wait for the consent update before firing with the default (denied)
 * state, in milliseconds (Consent Mode v2 `wait_for_update`).
 */
export const CONSENT_WAIT_FOR_UPDATE_MS = 500;
