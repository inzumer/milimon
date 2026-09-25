import { onSettingsChange, type AnalyticsConsent, type SettingsRepository } from '@repositories';
import { setAnalyticsSink } from '@utils';

/**
 * Google Analytics 4 with Consent Mode v2.
 *
 * - Nothing is sent and no cookie is written until the person accepts the consent banner: the
 *   Google script is only injected after `granted`.
 * - Every consent signal starts `denied`; accepting only grants `analytics_storage` (no ads).
 * - Once loaded, `track()` events are forwarded to GA4 as custom events.
 * - Rejecting after accepting switches consent back to `denied` and stops forwarding events.
 */
type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export const GTAG_SCRIPT_URL = 'https://www.googletagmanager.com/gtag/js';

/** GA4 measurement IDs look like `G-XXXXXXXXXX`. */
export const isMeasurementId = (value: unknown): value is string =>
  typeof value === 'string' && /^G-[A-Z0-9]{4,}$/.test(value);

export interface GoogleAnalytics {
  applyConsent: (consent: AnalyticsConsent | null) => void;
}

export const createGoogleAnalytics = (measurementId: string): GoogleAnalytics => {
  window.dataLayer = window.dataLayer ?? [];
  // gtag.js reads `arguments` objects from the dataLayer, not plain arrays.
  const gtag: Gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params -- gtag.js requires the `arguments` object.
    window.dataLayer?.push(arguments);
  };
  window.gtag = gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });

  let loaded = false;
  const load = () => {
    if (loaded) {
      return;
    }
    loaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `${GTAG_SCRIPT_URL}?id=${encodeURIComponent(measurementId)}`;
    document.head.append(script);
    gtag('js', new Date());
    gtag('config', measurementId);
  };

  return {
    applyConsent: (consent) => {
      if (consent === 'granted') {
        gtag('consent', 'update', { analytics_storage: 'granted' });
        load();
        setAnalyticsSink((event, props) => gtag('event', event, props));
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
 * Starts analytics on a page: applies the stored consent and follows later changes (banner or
 * privacy page). Does nothing without a valid measurement ID. Returns the unsubscribe function.
 */
export const startGoogleAnalytics = (
  measurementId: unknown,
  settings: SettingsRepository,
): (() => void) => {
  if (!isMeasurementId(measurementId)) {
    return () => undefined;
  }
  const analytics = createGoogleAnalytics(measurementId);
  analytics.applyConsent(settings.load().analyticsConsent);
  return onSettingsChange((next) => analytics.applyConsent(next.analyticsConsent));
};
