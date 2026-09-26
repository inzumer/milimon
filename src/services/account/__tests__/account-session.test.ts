import { createFakeAccountBackend } from '@test/fake-account-backend';
import { getAccountSession, resetAccountSession } from '../account-session';

const CONFIG = {
  apiUrl: 'https://api.example.com',
  apiKey: 'key',
  appId: 'web',
  googleClientId: null,
  facebookAppId: null,
};

describe('account session', () => {
  afterEach(() => {
    resetAccountSession();
  });

  it('should be null when accounts are not configured', () => {
    expect(getAccountSession(null)).toBeNull();
    expect(getAccountSession()).toBeNull();
  });

  it('should create the backend once and share the session', () => {
    const backend = createFakeAccountBackend();
    const create = vi.fn(() => backend);
    const first = getAccountSession(CONFIG, create);
    const second = getAccountSession(CONFIG, create);
    expect(create).toHaveBeenCalledOnce();
    expect(first).toBe(second);
    expect(first?.backend).toBe(backend);
    expect(first?.config).toBe(CONFIG);
  });

  it('should use the API backend by default', () => {
    expect(getAccountSession(CONFIG)?.backend.signInWithGoogle).toBeTypeOf('function');
  });
});
