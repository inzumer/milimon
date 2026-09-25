import { Switch } from '@inzumer/ui-library';
import { useColorScheme } from '@hooks';
import type { SettingsRepository } from '@repositories';

export interface ThemeToggleProps {
  label: string;
  /** Injected in tests; defaults to the localStorage repository. */
  repository?: SettingsRepository;
}

/** Dark mode switch (ui-library `Switch`), persisted through the settings repository. */
export const ThemeToggle = ({ label, repository }: ThemeToggleProps) => {
  const { scheme, setScheme } = useColorScheme(repository);

  return (
    <Switch
      label={label}
      checked={scheme === 'dark'}
      onCheckedChange={(dark) => setScheme(dark ? 'dark' : 'light')}
    />
  );
};
