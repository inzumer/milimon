import { Switch } from '@inzumer/ui-library';
import { useSettingsStore } from '@stores';
import { trackingId } from '@utils';

export interface AnalyticsPreferenceProps {
  label: string;
}

/**
 * Lets people change their analytics answer at any time (privacy page). Off until they accept;
 * stays in sync with the consent banner through the settings store.
 */
export const AnalyticsPreference = ({ label }: AnalyticsPreferenceProps) => {
  const granted = useSettingsStore((state) => state.analyticsConsent === 'granted');
  const update = useSettingsStore((state) => state.update);

  return (
    <Switch
      id={trackingId('privacy', 'switch', 'analytics')}
      label={label}
      checked={granted}
      onCheckedChange={(checked) => update({ analyticsConsent: checked ? 'granted' : 'denied' })}
    />
  );
};
