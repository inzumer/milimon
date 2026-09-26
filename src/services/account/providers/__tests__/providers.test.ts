import { FacebookLoginCancelledError, loginWithFacebook } from '../facebook-login';
import { disableGoogleAutoSelect, renderGoogleButton } from '../google-identity';

vi.mock('@utils', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  loadScript: vi.fn(async () => undefined),
}));

describe('Google Identity Services', () => {
  afterEach(() => {
    delete window.google;
  });

  it('should render Google’s button and hand back the credential', async () => {
    const initialize = vi.fn();
    const renderButton = vi.fn();
    window.google = {
      accounts: { id: { initialize, renderButton, disableAutoSelect: vi.fn() } },
    };
    const onCredential = vi.fn();
    const container = document.createElement('div');

    await renderGoogleButton(container, {
      clientId: 'client-id',
      lang: 'es',
      width: 320,
      theme: 'dark',
      onCredential,
    });

    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'client-id' }));
    expect(renderButton).toHaveBeenCalledWith(
      container,
      expect.objectContaining({ theme: 'filled_black', locale: 'es-419', width: 320 }),
    );
    const { callback } = initialize.mock.calls[0]?.[0] as { callback: (r: object) => void };
    callback({});
    callback({ credential: 'id-token' });
    expect(onCredential.mock.calls).toStrictEqual([['id-token']]);
  });

  it('should fail when the script did not define the API', async () => {
    await expect(
      renderGoogleButton(document.createElement('div'), {
        clientId: 'c',
        lang: 'en',
        width: 320,
        theme: 'light',
        onCredential: vi.fn(),
      }),
    ).rejects.toThrow('not available');
    expect(() => disableGoogleAutoSelect()).not.toThrow();
  });
});

describe('Facebook Login', () => {
  afterEach(() => {
    delete window.FB;
  });

  it('should initialize the SDK once and resolve with the access token', async () => {
    const init = vi.fn();
    const login = vi.fn((callback: (response: object) => void) =>
      callback({ status: 'connected', authResponse: { accessToken: 'fb-token' } }),
    );
    window.FB = { init, login };

    await expect(loginWithFacebook('app-1', 'es')).resolves.toBe('fb-token');
    await expect(loginWithFacebook('app-1', 'es')).resolves.toBe('fb-token');
    expect(init).toHaveBeenCalledOnce();
    expect(login).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ scope: 'public_profile,email' }),
    );
  });

  it('should reject when the person cancels', async () => {
    window.FB = {
      init: vi.fn(),
      login: vi.fn((callback: (response: object) => void) => callback({ status: 'unknown' })),
    };
    await expect(loginWithFacebook('app-2', 'en')).rejects.toBeInstanceOf(
      FacebookLoginCancelledError,
    );
  });

  it('should fail when the SDK did not load', async () => {
    await expect(loginWithFacebook('app-3', 'en')).rejects.toThrow('not available');
  });
});
