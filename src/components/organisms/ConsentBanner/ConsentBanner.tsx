import { useEffect, useState } from 'react';
import { CookieBanner, CookiePreferences } from '@inzumer/ui-library';
import { OPEN_COOKIE_PREFERENCES_EVENT } from '@constants';
import { useHydrated } from '@hooks';
import type { Translations } from '@i18n/translations';
import { useSettingsStore, type AnalyticsConsent } from '@stores';
import { trackingId } from '@utils';

export type ConsentBannerLabels = Translations<'common'>['consent'];

export interface ConsentBannerProps {
  labels: ConsentBannerLabels;
  privacyHref: string;
}

/**
 * Cookie consent (ui-library `CookieBanner` + `CookiePreferences`). The banner shows at the
 * bottom of every page until the person answers; "Customize" and the footer's "Cookie
 * preferences" open the per-category choices at any time. The answer is stored in the settings
 * store, which Google Tag Manager follows: nothing loads before `granted`.
 */
export const ConsentBanner = ({ labels, privacyHref }: ConsentBannerProps) => {
  const consent = useSettingsStore((state) => state.analyticsConsent);
  const hydrated = useHydrated();
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [analyticsDraft, setAnalyticsDraft] = useState(false);

  useEffect(() => {
    const openPreferences = () => {
      setAnalyticsDraft(useSettingsStore.getState().analyticsConsent === 'granted');
      setPreferencesOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
  }, []);

  const answer = (next: AnalyticsConsent) => {
    useSettingsStore.getState().update({ analyticsConsent: next });
  };

  return (
    <>
      {hydrated && consent === null && !preferencesOpen && (
        <CookieBanner
          title={labels.title}
          description={
            <>
              {labels.message}{' '}
              <a
                id={trackingId('consent', 'link', 'privacy')}
                href={privacyHref}
                className="font-semibold text-[var(--text-link)] underline"
              >
                {labels['privacy-link']}
              </a>
            </>
          }
          acceptLabel={labels.accept}
          rejectLabel={labels.reject}
          customizeLabel={labels.customize}
          onAccept={() => answer('granted')}
          onReject={() => answer('denied')}
          onCustomize={() => {
            setAnalyticsDraft(false);
            setPreferencesOpen(true);
          }}
          buttonIds={{
            accept: trackingId('consent', 'button', 'accept'),
            reject: trackingId('consent', 'button', 'reject'),
            customize: trackingId('consent', 'button', 'customize'),
          }}
        />
      )}
      <CookiePreferences
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        title={labels['preferences-title']}
        description={labels['preferences-description']}
        categories={[
          {
            id: 'necessary',
            title: labels.categories.necessary.title,
            description: labels.categories.necessary.description,
            required: true,
          },
          {
            id: 'analytics',
            title: labels.categories.analytics.title,
            description: labels.categories.analytics.description,
          },
        ]}
        value={{ analytics: analyticsDraft }}
        onChange={(_id, enabled) => setAnalyticsDraft(enabled)}
        onSave={() => {
          answer(analyticsDraft ? 'granted' : 'denied');
          setPreferencesOpen(false);
        }}
        saveLabel={labels.save}
        cancelLabel={labels.cancel}
        requiredLabel={labels.required}
        idPrefix={trackingId('consent', 'switch')}
      />
    </>
  );
};
