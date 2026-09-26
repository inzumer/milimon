import { useCallback, useEffect, useState } from 'react';
import { useSettingsStore, type ColorScheme } from '@stores';
import { track } from '@utils';

/** Scheme currently applied by the inline head script (or by a previous toggle). */
export const readAppliedColorScheme = (): ColorScheme =>
  document.documentElement.dataset['colorScheme'] === 'dark' ? 'dark' : 'light';

export const applyColorScheme = (scheme: ColorScheme): void => {
  document.documentElement.dataset['colorScheme'] = scheme;
};

/**
 * Reads and changes the color scheme. The initial state is always `light` so the server-rendered
 * markup and the first client render match; the real value is synced right after hydration.
 */
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
