import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OPEN_COOKIE_PREFERENCES_EVENT } from '@constants';
import { getTranslations } from '@i18n';
import { createLocalSettingsRepository } from '@repositories';
import { createMemoryStorage } from '@test/memory-storage';
import { ConsentBanner } from '../ConsentBanner';

const labels = getTranslations('en', 'common').consent;

const renderBanner = (consent?: 'granted' | 'denied') => {
  const repository = createLocalSettingsRepository(createMemoryStorage());
  if (consent) {
    repository.save({ analyticsConsent: consent });
  }
  render(<ConsentBanner labels={labels} privacyHref="/en/privacy" repository={repository} />);
  return { repository, user: userEvent.setup() };
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
    const { repository, user } = renderBanner();
    await user.click(screen.getByRole('button', { name: button }));
    expect(repository.load().analyticsConsent).toBe(consent);
    expect(screen.queryByRole('region', { name: labels.title })).not.toBeInTheDocument();
  });

  it('should let people choose per category, with necessary cookies always on', async () => {
    const { repository, user } = renderBanner();
    await user.click(screen.getByRole('button', { name: labels.customize }));

    expect(screen.getByRole('dialog', { name: labels['preferences-title'] })).toBeInTheDocument();
    expect(screen.getByText(labels.required)).toBeInTheDocument();
    const analytics = screen.getByRole('switch', { name: labels.categories.analytics.title });
    expect(analytics).not.toBeChecked();

    await user.click(analytics);
    await user.click(screen.getByRole('button', { name: labels.save }));
    expect(repository.load().analyticsConsent).toBe('granted');
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('should reopen the preferences from the footer with the current answer', async () => {
    const { repository, user } = renderBanner('granted');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();

    openFromFooter();
    const analytics = screen.getByRole('switch', { name: labels.categories.analytics.title });
    expect(analytics).toBeChecked();

    await user.click(analytics);
    await user.click(screen.getByRole('button', { name: labels.save }));
    expect(repository.load().analyticsConsent).toBe('denied');
  });

  it('should close the preferences without saving on cancel', async () => {
    const { repository, user } = renderBanner('denied');
    openFromFooter();
    await user.click(screen.getByRole('switch', { name: labels.categories.analytics.title }));
    await user.click(screen.getByRole('button', { name: labels.cancel }));
    expect(repository.load().analyticsConsent).toBe('denied');
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
