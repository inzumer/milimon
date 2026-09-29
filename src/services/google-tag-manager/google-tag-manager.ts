import {
  CONSENT_WAIT_FOR_UPDATE_MS,
  GTM_AUTH_PATTERN,
  GTM_CONTAINER_ID_PATTERN,
  GTM_PREVIEW_PATTERN,
  GTM_SCRIPT_URL,
} from '@constants';
import { useSettingsStore, type AnalyticsConsent } from '@stores';
import { setAnalyticsSink } from '@utils';

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export const isContainerId = (value: unknown): value is string =>
  typeof value === 'string' && GTM_CONTAINER_ID_PATTERN.test(value);

/** A GTM environment (Admin → Environments), so staging loads its own container version. */
export interface GtmEnvironment {
  auth: string;
  preview: string;
}

/** The environment when both values are valid, otherwise `undefined` (the live container). */
export const gtmEnvironment = (auth: unknown, preview: unknown): GtmEnvironment | undefined =>
  typeof auth === 'string' &&
  typeof preview === 'string' &&
  GTM_AUTH_PATTERN.test(auth) &&
  GTM_PREVIEW_PATTERN.test(preview)
    ? { auth, preview }
    : undefined;

const containerUrl = (containerId: string, environment?: GtmEnvironment) => {
  const params = new URLSearchParams({ id: containerId });
  if (environment) {
    params.set('gtm_auth', environment.auth);
    params.set('gtm_preview', environment.preview);
    params.set('gtm_cookies_win', 'x');
  }
  return `${GTM_SCRIPT_URL}?${params.toString()}`;
};

export interface TagManager {
  applyConsent: (consent: AnalyticsConsent | null) => void;
}

export const createTagManager = (containerId: string, environment?: GtmEnvironment): TagManager => {
  const dataLayer = (window.dataLayer = window.dataLayer ?? []);
  const gtag: Gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params -- the consent API requires `arguments`.
    dataLayer.push(arguments);
  };
  window.gtag = gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: CONSENT_WAIT_FOR_UPDATE_MS,
  });

  let loaded = false;
  const load = () => {
    if (loaded) {
      return;
    }
    loaded = true;
    dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = containerUrl(containerId, environment);
    document.head.append(script);
  };

  return {
    applyConsent: (consent) => {
      if (consent === 'granted') {
        gtag('consent', 'update', { analytics_storage: 'granted' });
        load();
        setAnalyticsSink((event, props) => {
          dataLayer.push({ event, ...props });
        });
        return;
      }
      if (loaded) {
        gtag('consent', 'update', { analytics_storage: 'denied' });
      }
      setAnalyticsSink(null);
    },
  };
};

/** Starts GTM with the stored consent and follows its changes; returns the unsubscribe. */
export const startTagManager = (
  containerId: unknown,
  environment?: GtmEnvironment,
): (() => void) => {
  if (!isContainerId(containerId)) {
    return () => undefined;
  }
  const tagManager = createTagManager(containerId, environment);
  tagManager.applyConsent(useSettingsStore.getState().analyticsConsent);
  return useSettingsStore.subscribe((next, previous) => {
    if (next.analyticsConsent !== previous.analyticsConsent) {
      tagManager.applyConsent(next.analyticsConsent);
    }
  });
};
