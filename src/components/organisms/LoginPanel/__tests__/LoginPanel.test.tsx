import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTranslations } from '@i18n';
import {
  createAccountSync,
  FacebookLoginCancelledError,
  type AccountSession,
  type GoogleButtonOptions,
} from '@services/account';
import { useSettingsStore } from '@stores';
import { createFakeAccountBackend, TEST_USER } from '@test/fake-account-backend';
import { createMemoryStorage } from '@test/memory-storage';
import { setAnalyticsSink } from '@utils';
import { LoginPanel } from '../LoginPanel';

const labels = getTranslations('en', 'login-page').panel;
const migration = getTranslations('en', 'common').migration;

const setup = (
  remote: Parameters<typeof createFakeAccountBackend>[0] = {},
  providers: { google?: string | null; facebook?: string | null } = {},
) => {
  const backend = createFakeAccountBackend(remote);
  const session: AccountSession = {
    config: {
      apiUrl: 'https://api.example.com',
      apiKey: 'k',
      appId: 'web',
      googleClientId: providers.google === undefined ? 'google-id' : providers.google,
      facebookAppId: providers.facebook === undefined ? 'fb-id' : providers.facebook,
    },
    backend,
    sync: createAccountSync({
      backend,
      session: createMemoryStorage(),
      debounceMs: 0,
    }),
  };
  let googleOptions: GoogleButtonOptions | undefined;
  const renderGoogle = vi.fn(async (_container: HTMLElement, options: GoogleButtonOptions) => {
    googleOptions = options;
  });
  const facebookLogin = vi.fn(async () => 'fb-token');
  const navigate = vi.fn();
  const renderPanel = (loadSession: () => AccountSession | null = () => session) =>
    render(
      <LoginPanel
        lang="en"
        labels={labels}
        migrationLabels={migration}
        accountHref="/en/account"
        termsHref="/en/terms"
        privacyHref="/en/privacy"
        loadSession={loadSession}
        renderGoogle={renderGoogle}
        facebookLogin={facebookLogin}
        navigate={navigate}
        slowAfterMs={50}
      />,
    );

  return {
    backend,
    renderGoogle,
    facebookLogin,
    navigate,
    google: async () => {
      await vi.waitFor(() => expect(googleOptions).toBeDefined());

      return googleOptions as GoogleButtonOptions;
    },
    user: userEvent.setup(),
    renderPanel,
  };
};

describe('LoginPanel', () => {
  afterEach(() => {
    setAnalyticsSink(null);
  });

  it('should explain that sign-in is not available yet without the API', () => {
    const { renderPanel } = setup();
    renderPanel(() => null);
    expect(screen.getByText(labels.unavailable)).toBeInTheDocument();
  });

  it('should render Google’s button and the Facebook button with the legal links', async () => {
    const { renderPanel, renderGoogle } = setup();
    renderPanel();
    const facebook = await screen.findByRole('button', { name: labels['continue-with-facebook'] });
    expect(facebook.querySelector('img')).toHaveAttribute('alt', '');
    await vi.waitFor(() => expect(renderGoogle).toHaveBeenCalled());
    expect(renderGoogle).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ clientId: 'google-id', lang: 'en', theme: 'light' }),
    );
    expect(screen.getByRole('link', { name: labels.terms })).toHaveAttribute('href', '/en/terms');
    expect(screen.getByRole('link', { name: labels.privacy })).toHaveAttribute(
      'href',
      '/en/privacy',
    );
  });

  it('should only offer the configured providers', async () => {
    const { renderPanel, renderGoogle } = setup({}, { google: null });
    renderPanel();
    await screen.findByRole('button', { name: labels['continue-with-facebook'] });
    expect(renderGoogle).not.toHaveBeenCalled();
  });

  it('should keep the Facebook button disabled, saying it comes soon, without an app id', async () => {
    const { renderPanel, facebookLogin, user } = setup({}, { facebook: null });
    renderPanel();
    const facebook = await screen.findByRole('button', {
      name: labels['continue-with-facebook'],
    });
    expect(facebook).toBeDisabled();
    expect(facebook).toHaveAccessibleDescription(labels['facebook-soon']);
    await user.click(facebook);
    expect(facebookLogin).not.toHaveBeenCalled();
  });

  it('should sign in with Google and go to the account page', async () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const { renderPanel, backend, navigate, google } = setup();
    renderPanel();
    await screen.findByRole('button', { name: labels['continue-with-facebook'] });

    (await google()).onCredential('id-token');

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/en/account'));
    expect(backend.signInWithGoogle).toHaveBeenCalledWith('id-token', 'en');
    expect(sink).toHaveBeenCalledWith('sign_in', { provider: 'google' });
  });

  it('should sign in with Facebook from a click', async () => {
    const { renderPanel, backend, facebookLogin, navigate, user } = setup();
    renderPanel();
    await user.click(await screen.findByRole('button', { name: labels['continue-with-facebook'] }));
    expect(facebookLogin).toHaveBeenCalledWith('fb-id', 'en');
    expect(backend.signInWithFacebook).toHaveBeenCalledWith('fb-token', 'en');
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/en/account'));
  });

  it('should tell apart a cancelled Facebook dialog from a failure', async () => {
    const { renderPanel, facebookLogin, backend, user } = setup();
    renderPanel();
    const button = await screen.findByRole('button', { name: labels['continue-with-facebook'] });

    facebookLogin.mockRejectedValueOnce(new FacebookLoginCancelledError());
    await user.click(button);
    expect(await screen.findByRole('alert')).toHaveTextContent(labels.cancelled);

    vi.mocked(backend.signInWithFacebook).mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getByRole('button', { name: labels['continue-with-facebook'] }));
    expect(await screen.findByRole('alert')).toHaveTextContent(labels.error);
  });

  it('should say the server is waking up when sign-in is slow', { retry: 2 }, async () => {
    const { renderPanel, backend, google } = setup();
    let finish: (() => void) | undefined;
    vi.mocked(backend.signInWithGoogle).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = () => {
            backend.setUser(TEST_USER);
            resolve(TEST_USER);
          };
        }),
    );
    renderPanel();
    await screen.findByRole('button', { name: labels['continue-with-facebook'] });

    (await google()).onCredential('id-token');
    expect(await screen.findByRole('status')).toHaveTextContent(
      new RegExp(`${labels['signing-in']}|${labels['waking-up']}`),
    );
    await vi.waitFor(
      () => expect(screen.getByRole('status')).toHaveTextContent(labels['waking-up']),
      { timeout: 3_000 },
    );
    finish?.();
  });

  it('should ask about this device’s data on the first sign-in', async () => {
    const { renderPanel, navigate, backend, google, user } = setup();
    useSettingsStore.getState().update({ currency: 'EUR' });
    renderPanel();
    await screen.findByRole('button', { name: labels['continue-with-facebook'] });

    (await google()).onCredential('id-token');
    await user.click(await screen.findByRole('button', { name: migration.import }));

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/en/account'));
    expect(backend.remote.profile?.currency).toBe('EUR');
  });

  it('should explain when the migration fails', async () => {
    const { renderPanel, backend, google, user } = setup();
    useSettingsStore.getState().update({ currency: 'EUR' });
    renderPanel();
    await screen.findByRole('button', { name: labels['continue-with-facebook'] });
    (await google()).onCredential('id-token');
    const fresh = await screen.findByRole('button', { name: migration.fresh });
    vi.mocked(backend.saveProfile).mockRejectedValueOnce(new Error('offline'));
    await user.click(fresh);
    expect(await screen.findByRole('alert')).toHaveTextContent(labels.error);
  });

  it('should warn when Google’s button cannot load', async () => {
    const { renderPanel, renderGoogle } = setup();
    renderGoogle.mockRejectedValueOnce(new Error('blocked'));
    renderPanel();
    expect(await screen.findByRole('alert')).toHaveTextContent(labels['provider-error']);
  });

  it('should point signed-in people to their account', async () => {
    const { renderPanel } = setup({ user: TEST_USER });
    renderPanel();
    expect(await screen.findByText(/signed in as Ada Cook/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: labels['go-to-account'] })).toHaveAttribute(
      'href',
      '/en/account',
    );
  });
});
