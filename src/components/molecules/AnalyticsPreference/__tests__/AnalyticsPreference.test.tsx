import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { createLocalSettingsRepository } from '@repositories';
import { createMemoryStorage } from '@test/memory-storage';
import { AnalyticsPreference } from '../AnalyticsPreference';

describe('AnalyticsPreference', () => {
  it('should be off until the person accepts and save each change', async () => {
    const user = userEvent.setup();
    const repository = createLocalSettingsRepository(createMemoryStorage());
    render(<AnalyticsPreference label="Analytics cookies" repository={repository} />);
    const toggle = screen.getByRole('switch', { name: 'Analytics cookies' });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(repository.load().analyticsConsent).toBe('granted');

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(repository.load().analyticsConsent).toBe('denied');
  });

  it('should reflect answers given elsewhere, such as the banner', () => {
    const repository = createLocalSettingsRepository(createMemoryStorage());
    render(<AnalyticsPreference label="Analytics cookies" repository={repository} />);
    act(() => {
      repository.save({ analyticsConsent: 'granted' });
    });
    expect(screen.getByRole('switch', { name: 'Analytics cookies' })).toBeChecked();
  });
});
