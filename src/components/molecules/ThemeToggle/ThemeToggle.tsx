import { Switch } from '@inzumer/ui-library';
import { useColorScheme } from '@hooks';
import { trackingId } from '@utils';

export interface ThemeToggleProps {
  label: string;
}

/** Dark mode switch (ui-library `Switch`), saved in the settings store. */
export const ThemeToggle = ({ label }: ThemeToggleProps) => {
  const { scheme, setScheme } = useColorScheme();

  return (
    <Switch
      id={trackingId('settings', 'switch', 'dark-mode')}
      label={label}
      checked={scheme === 'dark'}
      onCheckedChange={(dark) => setScheme(dark ? 'dark' : 'light')}
    />
  );
};
