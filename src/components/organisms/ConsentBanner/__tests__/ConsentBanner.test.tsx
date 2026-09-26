import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OPEN_COOKIE_PREFERENCES_EVENT } from '@constants';
import { getTranslations } from '@i18n';
import { useSettingsStore } from '@stores';
import { ConsentBanner } from '../ConsentBanner';

const labels = getTranslations('en', 'common').consent;

const renderBanner = (consent?: 'granted' | 'denied') => {
  if (consent) {
    useSettingsStore.getState().update({ analyticsConsent: consent });
  }
  render(<ConsentBanner labels={labels} privacyHref="/en/privacy" />);
  return { user: userEvent.setup() };
};

const openFromFooter = () =>
  act(() => {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_PREFERENCES_EVENT));
  });

describe('ConsentBanner', () => {
  it('should ask for consent with a link to the privacy page', () => {
    renderBanner();
    expect(screen.getByRole('region', { name: labels.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: labels['privacy-link'] })).toHaveAttribute(
      'href',
      '/en/privacy',
    );
    expect(screen.getByRole('button', { name: labels.accept })).toHaveAttribute(
      'id',
      'consent-button-accept',
    );
  });

  it.each([
    [labels.accept, 'granted'],
    [labels.reject, 'denied'],
  ] as const)('should store the answer and hide when clicking %s', async (button, consent) => {
    const { user } = renderBanner();
    await user.click(screen.getByRole('button', { name: button }));
    expect(useSettingsStore.getState().analyticsConsent).toBe(consent);
    expect(screen.queryByRole('region', { name: labels.title })).not.toBeInTheDocument();
  });

  it('should let people choose per category, with necessary cookies always on', async () => {
    const { user } = renderBanner();
    await user.click(screen.getByRole('button', { name: labels.customize }));

    expect(screen.getByRole('dialog', { name: labels['preferences-title'] })).toBeInTheDocument();
    expect(screen.getByText(labels.required)).toBeInTheDocument();
    const analytics = screen.getByRole('switch', { name: labels.categories.analytics.title });
    expect(analytics).not.toBeChecked();

    await user.click(analytics);
    await user.click(screen.getByRole('button', { name: labels.save }));
    expect(useSettingsStore.getState().analyticsConsent).toBe('granted');
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('should reopen the preferences from the footer with the current answer', async () => {
    const { user } = renderBanner('granted');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();

    openFromFooter();
    const analytics = screen.getByRole('switch', { name: labels.categories.analytics.title });
    expect(analytics).toBeChecked();

    await user.click(analytics);
    await user.click(screen.getByRole('button', { name: labels.save }));
    expect(useSettingsStore.getState().analyticsConsent).toBe('denied');
  });

  it('should close the preferences without saving on cancel', async () => {
    const { user } = renderBanner('denied');
    openFromFooter();
    await user.click(screen.getByRole('switch', { name: labels.categories.analytics.title }));
    await user.click(screen.getByRole('button', { name: labels.cancel }));
    expect(useSettingsStore.getState().analyticsConsent).toBe('denied');
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
