import { Switch } from '@inzumer/ui-library';
import { useColorScheme } from '@hooks';
import type { SettingsRepository } from '@repositories';
import { trackingId } from '@utils';

export interface ThemeToggleProps {
  label: string;
  repository?: SettingsRepository;
}

/** Dark mode switch (ui-library `Switch`), persisted through the settings repository. */
export const ThemeToggle = ({ label, repository }: ThemeToggleProps) => {
  const { scheme, setScheme } = useColorScheme(repository);

  return (
    <Switch
      id={trackingId('settings', 'switch', 'dark-mode')}
      label={label}
      checked={scheme === 'dark'}
      onCheckedChange={(dark) => setScheme(dark ? 'dark' : 'light')}
    />
  );
};
