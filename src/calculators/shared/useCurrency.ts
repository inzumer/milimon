import { useEffect, useRef, useState } from 'react';
import {
  createLocalSettingsRepository,
  DEFAULT_SETTINGS,
  onSettingsChange,
  type SettingsRepository,
} from '@repositories';

/**
 * Currency configured in the settings. Starts with the default so server and client markup match,
 * reads the saved one after hydration and follows later changes (e.g. from the menu).
 */
export const useCurrency = (
  settings: SettingsRepository = createLocalSettingsRepository(),
): string => {
  const [currency, setCurrency] = useState(DEFAULT_SETTINGS.currency);
  const repositoryRef = useRef(settings);

  useEffect(() => {
    setCurrency(repositoryRef.current.load().currency);
    return onSettingsChange((next) => setCurrency(next.currency));
  }, []);

  return currency;
};
