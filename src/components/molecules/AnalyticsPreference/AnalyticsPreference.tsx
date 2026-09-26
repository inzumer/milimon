import { useEffect, useRef, useState } from 'react';
import { Switch } from '@inzumer/ui-library';
import {
  createLocalSettingsRepository,
  onSettingsChange,
  type SettingsRepository,
} from '@repositories';
import { trackingId } from '@utils';

export interface AnalyticsPreferenceProps {
  label: string;
  repository?: SettingsRepository;
}

/**
 * Lets people change their analytics answer at any time (privacy page). Off until they accept;
 * stays in sync with the consent banner through the settings-changed event.
 */
export const AnalyticsPreference = ({
  label,
  repository = createLocalSettingsRepository(),
}: AnalyticsPreferenceProps) => {
  const settingsRef = useRef(repository);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    setGranted(settingsRef.current.load().analyticsConsent === 'granted');
    return onSettingsChange((next) => setGranted(next.analyticsConsent === 'granted'));
  }, []);

  return (
    <Switch
      id={trackingId('privacy', 'switch', 'analytics')}
      label={label}
      checked={granted}
      onCheckedChange={(checked) =>
        settingsRef.current.save({ analyticsConsent: checked ? 'granted' : 'denied' })
      }
    />
  );
};
