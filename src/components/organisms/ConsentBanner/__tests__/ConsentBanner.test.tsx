import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createLocalSettingsRepository } from '@repositories';
import { createMemoryStorage } from '@test/memory-storage';
import { ConsentBanner } from '../ConsentBanner';

const labels = {
  title: 'Cookies',
  message: 'We use analytics to improve the site.',
  accept: 'Accept',
  reject: 'Reject',
  'privacy-link': 'Privacy policy',
};

const renderBanner = () => {
  const repository = createLocalSettingsRepository(createMemoryStorage());
  const view = render(
    <ConsentBanner labels={labels} privacyHref="/en/privacy" repository={repository} />,
  );
  return { repository, ...view };
};

describe('ConsentBanner', () => {
  it('should ask for consent with a link to the privacy page', () => {
    renderBanner();
    expect(screen.getByRole('region', { name: 'Cookies' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute(
      'href',
      '/en/privacy',
    );
  });

  it.each([
    ['Accept', 'granted'],
    ['Reject', 'denied'],
  ] as const)('should store the answer and hide when clicking %s', async (button, consent) => {
    const user = userEvent.setup();
    const { repository } = renderBanner();
    await user.click(screen.getByRole('button', { name: button }));
    expect(repository.load().analyticsConsent).toBe(consent);
    expect(screen.queryByRole('region', { name: 'Cookies' })).not.toBeInTheDocument();
  });

  it('should stay hidden once the person has answered', () => {
    const repository = createLocalSettingsRepository(createMemoryStorage());
    repository.save({ analyticsConsent: 'denied' });
    render(<ConsentBanner labels={labels} privacyHref="/en/privacy" repository={repository} />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
