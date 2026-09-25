import { createLocalSettingsRepository } from '@repositories';
import { createMemoryStorage } from '@test/memory-storage';
import { setAnalyticsSink, track } from '@utils';
import {
  createGoogleAnalytics,
  GTAG_SCRIPT_URL,
  isMeasurementId,
  startGoogleAnalytics,
} from '../google-analytics';

const ID = 'G-TEST1234';

/** dataLayer entries are `arguments` objects; this turns them into plain arrays. */
const calls = () =>
  (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));

const gtagScripts = () => document.head.querySelectorAll(`script[src^="${GTAG_SCRIPT_URL}"]`);

describe('google analytics', () => {
  beforeEach(() => {
    delete window.dataLayer;
    delete window.gtag;
    document.head.innerHTML = '';
  });

  afterEach(() => {
    setAnalyticsSink(null);
  });

  it('should accept only GA4 measurement IDs', () => {
    expect(isMeasurementId('G-ABC123XYZ')).toBe(true);
    expect(isMeasurementId('UA-12345-1')).toBe(false);
    expect(isMeasurementId('')).toBe(false);
    expect(isMeasurementId(undefined)).toBe(false);
  });

  it('should default every consent signal to denied without loading the script', () => {
    createGoogleAnalytics(ID);
    expect(calls()).toEqual([
      [
        'consent',
        'default',
        {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
        },
      ],
    ]);
    expect(gtagScripts()).toHaveLength(0);
  });

  it('should load the script once and forward events after consent is granted', () => {
    const analytics = createGoogleAnalytics(ID);
    analytics.applyConsent('granted');
    analytics.applyConsent('granted');
    expect(gtagScripts()).toHaveLength(1);
    expect(gtagScripts()[0]?.getAttribute('src')).toBe(`${GTAG_SCRIPT_URL}?id=${ID}`);
    expect(calls()).toContainEqual(['config', ID]);

    track('calculation_completed', { formula: 'waste-factor' });
    expect(calls()).toContainEqual(['event', 'calculation_completed', { formula: 'waste-factor' }]);
  });

  it('should stop forwarding events and deny storage when consent is withdrawn', () => {
    const analytics = createGoogleAnalytics(ID);
    analytics.applyConsent('granted');
    analytics.applyConsent('denied');
    expect(calls()).toContainEqual(['consent', 'update', { analytics_storage: 'denied' }]);

    track('menu_opened', {});
    expect(calls().some(([command]) => command === 'event')).toBe(false);
  });

  it('should not load anything while the person has not answered', () => {
    const analytics = createGoogleAnalytics(ID);
    analytics.applyConsent(null);
    analytics.applyConsent('denied');
    expect(gtagScripts()).toHaveLength(0);
    expect(calls()).toHaveLength(1);
  });

  it('should do nothing without a valid measurement ID', () => {
    const settings = createLocalSettingsRepository(createMemoryStorage());
    settings.save({ analyticsConsent: 'granted' });
    const stop = startGoogleAnalytics(undefined, settings);
    expect(window.dataLayer).toBeUndefined();
    expect(() => stop()).not.toThrow();
  });

  it('should apply the stored consent and follow later changes', () => {
    const settings = createLocalSettingsRepository(createMemoryStorage());
    settings.save({ analyticsConsent: 'granted' });
    const stop = startGoogleAnalytics(ID, settings);
    expect(gtagScripts()).toHaveLength(1);

    settings.save({ analyticsConsent: 'denied' });
    expect(calls()).toContainEqual(['consent', 'update', { analytics_storage: 'denied' }]);

    stop();
    settings.save({ analyticsConsent: 'granted' });
    expect(calls().filter(([, action]) => action === 'update')).toHaveLength(2);
  });
});
