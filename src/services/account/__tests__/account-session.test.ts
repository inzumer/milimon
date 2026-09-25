import { createFakeAccountBackend } from '@test/fake-account-backend';
import { getAccountSession, resetAccountSession } from '../account-session';

const CONFIG = { url: 'https://demo.supabase.co', key: 'key' };

describe('account session', () => {
  afterEach(() => {
    resetAccountSession();
  });

  it('should be null when accounts are not configured', async () => {
    await expect(getAccountSession(null)).resolves.toBeNull();
    await expect(getAccountSession()).resolves.toBeNull();
  });

  it('should load the backend once and share the session', async () => {
    const backend = createFakeAccountBackend();
    const load = vi.fn(async () => backend);
    const first = await getAccountSession(CONFIG, load);
    const second = await getAccountSession(CONFIG, load);
    expect(load).toHaveBeenCalledOnce();
    expect(first).toBe(second);
    expect(first?.backend).toBe(backend);
  });

  it('should load the Supabase backend by default', async () => {
    const session = await getAccountSession(CONFIG);
    expect(session?.backend.getUser).toBeTypeOf('function');
  });
});
