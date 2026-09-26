import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSettingsStore } from '@stores';
import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle', () => {
  afterEach(() => {
    delete document.documentElement.dataset['colorScheme'];
  });

  it('should be a labelled switch reflecting the applied scheme', () => {
    document.documentElement.dataset['colorScheme'] = 'dark';
    render(<ThemeToggle label="Modo oscuro" />);
    expect(screen.getByRole('switch', { name: 'Modo oscuro' })).toBeChecked();
  });

  it('should toggle between dark and light and persist the choice', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle label="Modo oscuro" />);
    const toggle = screen.getByRole('switch', { name: 'Modo oscuro' });

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(document.documentElement.dataset['colorScheme']).toBe('dark');
    expect(useSettingsStore.getState().colorScheme).toBe('dark');

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(document.documentElement.dataset['colorScheme']).toBe('light');
    expect(useSettingsStore.getState().colorScheme).toBe('light');
  });
});
