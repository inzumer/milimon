import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { getTranslations } from '@i18n';
import { useSettingsStore } from '@stores';
import { AnalyticsPreference } from '../AnalyticsPreference';

const labels = getTranslations('en', 'common').consent;
const analyticsSwitch = () =>
  screen.getByRole('switch', { name: labels.categories.analytics.title });

describe('AnalyticsPreference', () => {
  it('should show the necessary cookies as always on', () => {
    render(<AnalyticsPreference labels={labels} />);
    expect(screen.getByText(labels.categories.necessary.title)).toBeInTheDocument();
    expect(screen.getByText(labels.required)).toBeInTheDocument();
    expect(analyticsSwitch()).toHaveAttribute('id', 'privacy-switch-analytics');
  });

  it('should be off until the person accepts and save each change', async () => {
    const user = userEvent.setup();
    render(<AnalyticsPreference labels={labels} />);
    expect(analyticsSwitch()).not.toBeChecked();

    await user.click(analyticsSwitch());
    expect(analyticsSwitch()).toBeChecked();
    expect(useSettingsStore.getState().analyticsConsent).toBe('granted');

    await user.click(analyticsSwitch());
    expect(analyticsSwitch()).not.toBeChecked();
    expect(useSettingsStore.getState().analyticsConsent).toBe('denied');
  });

  it('should reflect answers given elsewhere, such as the banner', () => {
    render(<AnalyticsPreference labels={labels} />);
    act(() => {
      useSettingsStore.getState().update({ analyticsConsent: 'granted' });
    });
    expect(analyticsSwitch()).toBeChecked();
  });
});
