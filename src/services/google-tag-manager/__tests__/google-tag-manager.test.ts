import { GTM_SCRIPT_URL } from '@constants';
import { createLocalSettingsRepository } from '@repositories';
import { createMemoryStorage } from '@test/memory-storage';
import { setAnalyticsSink, track } from '@utils';
import { createTagManager, isContainerId, startTagManager } from '../google-tag-manager';

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

  it('should do nothing without a valid container id', () => {
    const settings = createLocalSettingsRepository(createMemoryStorage());
    settings.save({ analyticsConsent: 'granted' });
    const stop = startTagManager(undefined, settings);
    expect(window.dataLayer).toBeUndefined();
    expect(() => stop()).not.toThrow();
  });

  it('should apply the stored consent and follow later changes', () => {
    const settings = createLocalSettingsRepository(createMemoryStorage());
    settings.save({ analyticsConsent: 'granted' });
    const stop = startTagManager(ID, settings);
    expect(gtmScripts()).toHaveLength(1);

    settings.save({ analyticsConsent: 'denied' });
    expect(consentCalls()).toContainEqual(['consent', 'update', { analytics_storage: 'denied' }]);

    stop();
    settings.save({ analyticsConsent: 'granted' });
    expect(consentCalls().filter(([, action]) => action === 'update')).toHaveLength(2);
  });
});
