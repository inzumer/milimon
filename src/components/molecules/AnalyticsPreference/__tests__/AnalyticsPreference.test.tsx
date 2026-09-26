import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { useSettingsStore } from '@stores';
import { AnalyticsPreference } from '../AnalyticsPreference';

describe('AnalyticsPreference', () => {
  it('should be off until the person accepts and save each change', async () => {
    const user = userEvent.setup();
    render(<AnalyticsPreference label="Analytics cookies" />);
    const toggle = screen.getByRole('switch', { name: 'Analytics cookies' });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(useSettingsStore.getState().analyticsConsent).toBe('granted');

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(useSettingsStore.getState().analyticsConsent).toBe('denied');
  });

  it('should reflect answers given elsewhere, such as the banner', () => {
    render(<AnalyticsPreference label="Analytics cookies" />);
    act(() => {
      useSettingsStore.getState().update({ analyticsConsent: 'granted' });
    });
    expect(screen.getByRole('switch', { name: 'Analytics cookies' })).toBeChecked();
  });
});
