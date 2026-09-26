import { CONSENT_WAIT_FOR_UPDATE_MS, GTM_CONTAINER_ID_PATTERN, GTM_SCRIPT_URL } from '@constants';
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

export interface TagManager {
  applyConsent: (consent: AnalyticsConsent | null) => void;
}

export const createTagManager = (containerId: string): TagManager => {
  const dataLayer = (window.dataLayer = window.dataLayer ?? []);
  // Consent commands must be pushed as `arguments` objects (the gtag.js format GTM reads).
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
    script.src = `${GTM_SCRIPT_URL}?id=${encodeURIComponent(containerId)}`;
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

/**
 * Starts GTM on a page: applies the stored consent and follows later changes (banner or privacy
 * page). Does nothing without a valid container id. Returns the unsubscribe function.
 */
export const startTagManager = (containerId: unknown): (() => void) => {
  if (!isContainerId(containerId)) {
    return () => undefined;
  }
  const tagManager = createTagManager(containerId);
  tagManager.applyConsent(useSettingsStore.getState().analyticsConsent);
  return useSettingsStore.subscribe((next, previous) => {
    if (next.analyticsConsent !== previous.analyticsConsent) {
      tagManager.applyConsent(next.analyticsConsent);
    }
  });
};
