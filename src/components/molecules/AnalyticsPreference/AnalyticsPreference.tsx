import { CookieConsent } from '@inzumer/ui-library';
import { useSettingsStore } from '@stores';
import {
  choicesToConsent,
  consentCategories,
  consentLabels,
  consentToChoices,
  trackingId,
  type ConsentLabels,
} from '@utils';

export interface AnalyticsPreferenceProps {
  labels: ConsentLabels;
}

/**
 * Lets people change their cookie choices at any time (privacy page): ui-library `CookieConsent`
 * in `inline` mode, saved on every change. Analytics is off until they accept; stays in sync
 * with the consent banner through the settings store.
 */
export const AnalyticsPreference = ({ labels }: AnalyticsPreferenceProps) => {
  const consent = useSettingsStore((state) => state.analyticsConsent);
  const update = useSettingsStore((state) => state.update);

  return (
    <CookieConsent
      mode="inline"
      categories={consentCategories(labels)}
      value={consentToChoices(consent)}
      onChange={(choices) => update({ analyticsConsent: choicesToConsent(choices) })}
      getId={(kind, name) => trackingId('privacy', kind, name)}
      labels={consentLabels(labels, labels.message)}
    />
  );
};
