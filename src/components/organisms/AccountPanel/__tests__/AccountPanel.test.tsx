import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import labelsEn from '@i18n/account-page/en.json';
import {
  createLocalCalculationsRepository,
  createLocalHistoryRepository,
  createLocalSettingsRepository,
} from '@repositories';
import { createAccountSync, type AccountSession } from '@services/account';
import { createFakeAccountBackend, TEST_USER } from '@test/fake-account-backend';
import { createMemoryStorage } from '@test/memory-storage';
import { AccountPanel } from '../AccountPanel';

const labels = labelsEn.panel;

const setup = (remote: Parameters<typeof createFakeAccountBackend>[0] = {}) => {
  const backend = createFakeAccountBackend(remote);
  const settings = createLocalSettingsRepository(createMemoryStorage());
  const calculations = createLocalCalculationsRepository(createMemoryStorage());
  const session: AccountSession = {
    backend,
    sync: createAccountSync({
      backend,
      settings,
      calculations,
      history: createLocalHistoryRepository(createMemoryStorage()),
      session: createMemoryStorage(),
      debounceMs: 0,
    }),
  };
  const user = userEvent.setup();
  const renderPanel = (loadSession: () => Promise<AccountSession | null> = async () => session) =>
    render(<AccountPanel labels={labels} returnPath="/en/account" loadSession={loadSession} />);
  return { backend, settings, calculations, session, user, renderPanel };
};

describe('AccountPanel', () => {
  it('should offer Google and Facebook while signed out', async () => {
    const { backend, user, renderPanel } = setup();
    renderPanel();
    expect(screen.getByText(labels.loading)).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Continue with Google' }));
    expect(backend.signIn).toHaveBeenCalledWith('google', 'http://localhost:3000/en/account');
    expect(screen.getByRole('button', { name: 'Continue with Facebook' })).toBeDisabled();
  });

  it('should explain when the sign-in cannot start', async () => {
    const { backend, user, renderPanel } = setup();
    vi.mocked(backend.signIn).mockRejectedValueOnce(new Error('popup blocked'));
    renderPanel();
    await user.click(await screen.findByRole('button', { name: 'Continue with Facebook' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(labels['sign-in-error']);
    expect(screen.getByRole('button', { name: 'Continue with Facebook' })).toBeEnabled();
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

  it('should react when the provider finishes the sign-in', async () => {
    const { backend, renderPanel } = setup();
    renderPanel();
    await screen.findByRole('button', { name: 'Continue with Google' });
    await act(async () => {
      backend.setUser(TEST_USER);
    });
    expect(await screen.findByText('Ada Cook')).toBeInTheDocument();
  });

  it.each([
    [labels['migration-import'], 'USD'],
    [labels['migration-fresh'], 'ARS'],
  ])('should resolve the first sign-in with "%s"', async (button, currency) => {
    const { backend, settings, user, renderPanel } = setup({ user: TEST_USER });
    settings.save({ currency: 'USD' });
    renderPanel();
    expect(
      await screen.findByRole('heading', { name: labels['migration-title'] }),
    ).toBeInTheDocument();

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

  it('should show an error when an action fails', async () => {
    const { backend, user, renderPanel } = setup({ user: TEST_USER });
    vi.mocked(backend.signOut).mockRejectedValueOnce(new Error('offline'));
    renderPanel();
    await user.click(await screen.findByRole('button', { name: labels['sign-out'] }));
    expect(await screen.findByRole('alert')).toHaveTextContent(labels.error);
  });

  it('should show an error when the account service cannot load', async () => {
    const { renderPanel } = setup();
    renderPanel(() => Promise.reject(new Error('blocked')));
    expect(await screen.findByRole('alert')).toHaveTextContent(labels.error);
  });

  it('should stay loading when accounts are not configured', async () => {
    const { renderPanel } = setup();
    renderPanel(async () => null);
    await act(async () => undefined);
    expect(screen.getByText(labels.loading)).toBeInTheDocument();
  });
});
