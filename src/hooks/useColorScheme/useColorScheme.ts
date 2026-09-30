import { useCallback, useEffect, useState } from 'react';
import { useSettingsStore, type ColorScheme } from '@stores';
import { track } from '@utils';

/** Scheme currently applied by the inline head script (or by a previous toggle). */
const readAppliedColorScheme = (): ColorScheme =>
  document.documentElement.dataset['colorScheme'] === 'dark' ? 'dark' : 'light';

const applyColorScheme = (scheme: ColorScheme): void => {
  document.documentElement.dataset['colorScheme'] = scheme;
};

/** Color scheme: starts `light` to match the server markup, synced after hydration. */
export const useColorScheme = (): {
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => void;
} => {
  const [scheme, setSchemeState] = useState<ColorScheme>('light');

  useEffect(() => {
    setSchemeState(readAppliedColorScheme());
  }, []);

  const setScheme = useCallback((next: ColorScheme) => {
    applyColorScheme(next);
    useSettingsStore.getState().update({ colorScheme: next });
    setSchemeState(next);
    track('theme_changed', { scheme: next });
  }, []);

  return { scheme, setScheme };
};
