import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createLocalSettingsRepository } from '@repositories';
import { createMemoryStorage } from '@test/memory-storage';
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
    const repository = createLocalSettingsRepository(createMemoryStorage());
    render(<ThemeToggle label="Modo oscuro" repository={repository} />);
    const toggle = screen.getByRole('switch', { name: 'Modo oscuro' });

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(document.documentElement.dataset['colorScheme']).toBe('dark');
    expect(repository.load().colorScheme).toBe('dark');

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(document.documentElement.dataset['colorScheme']).toBe('light');
    expect(repository.load().colorScheme).toBe('light');
  });
});
