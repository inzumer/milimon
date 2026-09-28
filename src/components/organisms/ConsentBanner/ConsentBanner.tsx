import { useEffect, useState } from 'react';
import { CookieConsent } from '@inzumer/ui-library';
import { OPEN_COOKIE_PREFERENCES_EVENT } from '@constants';
import { useHydrated } from '@hooks';
import { useSettingsStore } from '@stores';
import {
  choicesToConsent,
  consentCategories,
  consentLabels,
  consentToChoices,
  trackingId,
  type ConsentLabels,
} from '@utils';

export type ConsentBannerLabels = ConsentLabels;

export interface ConsentBannerProps {
  labels: ConsentBannerLabels;
  privacyHref: string;
}

/** Cookie banner (`CookieConsent` banner mode); GTM loads only after `granted`. */
export const ConsentBanner = ({ labels, privacyHref }: ConsentBannerProps) => {
  const consent = useSettingsStore((state) => state.analyticsConsent);
  const hydrated = useHydrated();
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    const openPreferences = () => setPreferencesOpen(true);
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
  }, []);

  return (
    <CookieConsent
      mode="banner"
      categories={consentCategories(labels)}
      // Until the stored answer is loaded, act as answered so the banner doesn't flash.
      value={hydrated ? consentToChoices(consent) : {}}
      onChange={(choices) =>
        useSettingsStore.getState().update({ analyticsConsent: choicesToConsent(choices) })
      }
      open={preferencesOpen}
      onOpenChange={setPreferencesOpen}
      getId={(kind, name) => trackingId('consent', kind, name)}
      labels={consentLabels(
        labels,
        <>
          {labels.message}{' '}
          <a
            id={trackingId('consent', 'link', 'privacy')}
            href={privacyHref}
            className="font-semibold text-[var(--text-link)] underline"
          >
            {labels['privacy-link']}
          </a>
        </>,
      )}
    />
  );
};
