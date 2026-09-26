import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTranslations } from '@i18n';
import {
  createLocalCalculationsRepository,
  createLocalHistoryRepository,
  createLocalSettingsRepository,
} from '@repositories';
import { createAccountSync, SessionExpiredError, type AccountSession } from '@services/account';
import { createFakeAccountBackend, TEST_USER } from '@test/fake-account-backend';
import { createMemoryStorage } from '@test/memory-storage';
import { AccountPanel } from '../AccountPanel';

const page = getTranslations('en', 'account-page');
const labels = page.panel;
const migration = getTranslations('en', 'common').migration;

const CONFIG = {
  apiUrl: 'https://api.example.com',
  apiKey: 'k',
  appId: 'web',
  googleClientId: 'g',
  facebookAppId: 'f',
};

const setup = (remote: Parameters<typeof createFakeAccountBackend>[0] = {}) => {
  const backend = createFakeAccountBackend(remote);
  const settings = createLocalSettingsRepository(createMemoryStorage());
  const session: AccountSession = {
    config: CONFIG,
    backend,
    sync: createAccountSync({
      backend,
      settings,
      calculations: createLocalCalculationsRepository(createMemoryStorage()),
      history: createLocalHistoryRepository(createMemoryStorage()),
      session: createMemoryStorage(),
      debounceMs: 0,
    }),
  };
  const renderPanel = (loadSession: () => AccountSession | null = () => session) =>
    render(
      <AccountPanel
        labels={labels}
        migrationLabels={migration}
        unavailableLabel={page.disabled}
        loginHref="/en/login"
        loadSession={loadSession}
      />,
    );
  return { backend, settings, session, user: userEvent.setup(), renderPanel };
};

describe('AccountPanel', () => {
  it('should explain that accounts are not available when the API is not configured', () => {
    const { renderPanel } = setup();
    renderPanel(() => null);
    expect(screen.getByText(page.disabled)).toBeInTheDocument();
  });

  it('should send signed-out people to the sign-in page', async () => {
    const { renderPanel } = setup();
    renderPanel();
    expect(screen.getByText(labels.loading)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: labels['sign-in'] })).toHaveAttribute(
      'href',
      '/en/login',
    );
  });

  it('should show the signed-in person and sign out', async () => {
    const { user, renderPanel, backend } = setup({ user: TEST_USER });
    renderPanel();
    expect(await screen.findByText('Ada Cook')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: labels['sign-out'] }));
    expect(backend.signOut).toHaveBeenCalledOnce();
    expect(await screen.findByRole('status')).toHaveTextContent(labels['signed-out']);
  });

  it('should show the avatar and fall back to the email when there is no name', async () => {
    const { renderPanel } = setup({
      user: { ...TEST_USER, name: null, avatarUrl: 'https://example.com/a.png' },
    });
    const { container } = renderPanel();
    expect(await screen.findByText('ada@example.com')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.png');
  });

  it('should follow a sign-in made in another tab', async () => {
    const { backend, renderPanel } = setup();
    renderPanel();
    await screen.findByRole('link', { name: labels['sign-in'] });
    await act(async () => {
      backend.setUser(TEST_USER);
    });
    expect(await screen.findByText('Ada Cook')).toBeInTheDocument();
  });

  it.each([
    [migration.import, 'USD'],
    [migration.fresh, 'ARS'],
  ])('should resolve the first sign-in with "%s"', async (button, currency) => {
    const { backend, settings, user, renderPanel } = setup({ user: TEST_USER });
    settings.save({ currency: 'USD' });
    renderPanel();
    expect(await screen.findByRole('heading', { name: migration.title })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: button }));
    expect(await screen.findByText('Ada Cook')).toBeInTheDocument();
    expect(backend.remote.profile?.currency).toBe(currency);
  });

  it('should ask for confirmation before deleting the account', async () => {
    const { backend, user, renderPanel } = setup({ user: TEST_USER });
    renderPanel();
    await user.click(await screen.findByRole('button', { name: labels.delete }));
    await user.click(screen.getByRole('button', { name: labels['delete-cancel'] }));
    expect(backend.deleteAccount).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: labels.delete }));
    expect(screen.getByRole('alert')).toHaveTextContent(labels['delete-question']);
    await user.click(screen.getByRole('button', { name: labels['delete-confirm'] }));
    expect(backend.deleteAccount).toHaveBeenCalledOnce();
    expect(await screen.findByRole('status')).toHaveTextContent(labels.deleted);
  });

  it('should show an error with a retry when syncing fails', async () => {
    const { backend, user, renderPanel } = setup({ user: TEST_USER });
    vi.mocked(backend.fetchProfile).mockRejectedValueOnce(new Error('offline'));
    renderPanel();
    expect(await screen.findByRole('alert')).toHaveTextContent(labels.error);
    await user.click(screen.getByRole('button', { name: labels.retry }));
    expect(await screen.findByText('Ada Cook')).toBeInTheDocument();
  });

  it('should ask to sign in again when the session expired', async () => {
    const { backend, renderPanel } = setup({ user: TEST_USER });
    vi.mocked(backend.fetchProfile).mockRejectedValueOnce(new SessionExpiredError());
    renderPanel();
    expect(await screen.findByRole('status')).toHaveTextContent(labels['session-expired']);
  });

  it('should show an error when an action fails', async () => {
    const { backend, user, renderPanel } = setup({ user: TEST_USER });
    vi.mocked(backend.signOut).mockRejectedValueOnce(new Error('offline'));
    renderPanel();
    await user.click(await screen.findByRole('button', { name: labels['sign-out'] }));
    expect(await screen.findByRole('alert')).toHaveTextContent(labels.error);
  });
});
