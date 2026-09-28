import { GTM_SCRIPT_URL } from '@constants';
import { useSettingsStore } from '@stores';
import { setAnalyticsSink, track } from '@utils';
import {
  createTagManager,
  gtmEnvironment,
  isContainerId,
  startTagManager,
} from '../google-tag-manager';

const ID = 'GTM-TEST123';

/** Consent commands are `arguments` objects; events are plain objects. */
const entries = () =>
  (window.dataLayer ?? []).map((entry) =>
    Object.prototype.toString.call(entry) === '[object Arguments]'
      ? Array.from(entry as ArrayLike<unknown>)
      : entry,
  );

const consentCalls = () => entries().filter((entry) => Array.isArray(entry));

const gtmScripts = () => document.head.querySelectorAll(`script[src^="${GTM_SCRIPT_URL}"]`);

describe('google tag manager', () => {
  beforeEach(() => {
    delete window.dataLayer;
    delete window.gtag;
    document.head.innerHTML = '';
  });

  afterEach(() => {
    setAnalyticsSink(null);
  });

  it('should accept only GTM container ids', () => {
    expect(isContainerId('GTM-ABC1234')).toBe(true);
    expect(isContainerId('G-ABC1234')).toBe(false);
    expect(isContainerId('')).toBe(false);
    expect(isContainerId(undefined)).toBe(false);
  });

  it('should default every consent signal to denied without loading the container', () => {
    createTagManager(ID);
    expect(consentCalls()).toEqual([
      [
        'consent',
        'default',
        {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
          wait_for_update: 500,
        },
      ],
    ]);
    expect(gtmScripts()).toHaveLength(0);
  });

  it('should load the container once and push events after consent is granted', () => {
    const tagManager = createTagManager(ID);
    tagManager.applyConsent('granted');
    tagManager.applyConsent('granted');
    expect(gtmScripts()).toHaveLength(1);
    expect(gtmScripts()[0]?.getAttribute('src')).toBe(`${GTM_SCRIPT_URL}?id=${ID}`);
    expect(entries()).toContainEqual(expect.objectContaining({ event: 'gtm.js' }));

    track('calculation_completed', { formula: 'waste-factor' });
    expect(entries()).toContainEqual({ event: 'calculation_completed', formula: 'waste-factor' });
  });

  it('should stop pushing events and deny storage when consent is withdrawn', () => {
    const tagManager = createTagManager(ID);
    tagManager.applyConsent('granted');
    tagManager.applyConsent('denied');
    expect(consentCalls()).toContainEqual(['consent', 'update', { analytics_storage: 'denied' }]);

    track('menu_opened', {});
    expect(entries()).not.toContainEqual({ event: 'menu_opened' });
  });

  it('should not load anything while the person has not answered', () => {
    const tagManager = createTagManager(ID);
    tagManager.applyConsent(null);
    tagManager.applyConsent('denied');
    expect(gtmScripts()).toHaveLength(0);
    expect(entries()).toHaveLength(1);
  });

  it('should accept a GTM environment only when both values are valid', () => {
    expect(gtmEnvironment('aBc_123-xyz', 'env-3')).toEqual({
      auth: 'aBc_123-xyz',
      preview: 'env-3',
    });
    expect(gtmEnvironment('aBc_123-xyz', 'live')).toBeUndefined();
    expect(gtmEnvironment('', 'env-3')).toBeUndefined();
    expect(gtmEnvironment(undefined, undefined)).toBeUndefined();
  });

  it('should load the environment version of the container', () => {
    const tagManager = createTagManager(ID, { auth: 'aBc_123-xyz', preview: 'env-3' });
    tagManager.applyConsent('granted');
    expect(gtmScripts()[0]?.getAttribute('src')).toBe(
      `${GTM_SCRIPT_URL}?id=${ID}&gtm_auth=aBc_123-xyz&gtm_preview=env-3&gtm_cookies_win=x`,
    );
  });

  it('should do nothing without a valid container id', () => {
    useSettingsStore.getState().update({ analyticsConsent: 'granted' });
    const stop = startTagManager(undefined);
    expect(window.dataLayer).toBeUndefined();
    expect(() => stop()).not.toThrow();
  });

  it('should apply the stored consent and follow later changes', () => {
    useSettingsStore.getState().update({ analyticsConsent: 'granted' });
    const stop = startTagManager(ID);
    expect(gtmScripts()).toHaveLength(1);

    useSettingsStore.getState().update({ analyticsConsent: 'denied' });
    expect(consentCalls()).toContainEqual(['consent', 'update', { analytics_storage: 'denied' }]);

    stop();
    useSettingsStore.getState().update({ analyticsConsent: 'granted' });
    expect(consentCalls().filter(([, action]) => action === 'update')).toHaveLength(2);
  });
});
