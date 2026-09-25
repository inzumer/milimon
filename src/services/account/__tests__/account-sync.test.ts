import { createLocalCalculationsRepository, createLocalSettingsRepository } from '@repositories';
import { createFakeAccountBackend, TEST_USER } from '@test/fake-account-backend';
import { createMemoryStorage } from '@test/memory-storage';
import { createAccountSync } from '../account-sync';

const setup = (remote: Parameters<typeof createFakeAccountBackend>[0] = { user: TEST_USER }) => {
  const backend = createFakeAccountBackend(remote);
  const settings = createLocalSettingsRepository(createMemoryStorage());
  const calculations = createLocalCalculationsRepository(createMemoryStorage());
  const session = createMemoryStorage();
  const sync = createAccountSync({ backend, settings, calculations, session, debounceMs: 10 });
  return { backend, settings, calculations, session, sync };
};

describe('account sync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should do nothing while signed out', async () => {
    const { sync, backend } = setup({ user: null });
    await expect(sync.start()).resolves.toBeNull();
    expect(backend.fetchProfile).not.toHaveBeenCalled();
  });

  it('should copy an existing profile and its drafts to this device', async () => {
    const { sync, settings, calculations } = setup({
      user: TEST_USER,
      profile: { currency: 'EUR', locale: 'en', colorScheme: 'dark' },
      drafts: { pricing: { unitCost: '12' } },
    });
    calculations.saveDraft('waste-factor', { wastePercentage: '1' });

    await expect(sync.start()).resolves.toStrictEqual({ user: TEST_USER, outcome: 'restored' });
    expect(settings.load()).toMatchObject({ currency: 'EUR', locale: 'en', colorScheme: 'dark' });
    expect(calculations.loadAll()).toStrictEqual({ pricing: { unitCost: '12' } });
  });

  it('should pull only once per browser session', async () => {
    const { sync, backend } = setup({
      user: TEST_USER,
      profile: { currency: 'USD', locale: null, colorScheme: null },
    });
    await sync.start();
    await sync.start();
    expect(backend.fetchProfile).toHaveBeenCalledOnce();
  });

  it('should create the profile from local preferences when there is nothing to keep', async () => {
    const { sync, backend, settings } = setup();
    settings.save({ colorScheme: 'dark' });
    await expect(sync.start()).resolves.toMatchObject({ outcome: 'created' });
    expect(backend.remote.profile).toStrictEqual({
      currency: 'ARS',
      locale: null,
      colorScheme: 'dark',
    });
  });

  it('should ask what to do with local data on the first sign-in', async () => {
    const { sync, backend, calculations } = setup();
    calculations.saveDraft('pricing', { unitCost: '12' });
    await expect(sync.start()).resolves.toMatchObject({ outcome: 'needs-migration' });
    expect(backend.saveProfile).not.toHaveBeenCalled();
  });

  it('should import local data into the new profile', async () => {
    const { sync, backend, settings, calculations } = setup();
    settings.save({ currency: 'USD' });
    calculations.saveDraft('pricing', { unitCost: '12' });
    await sync.start();
    await sync.importLocal();
    expect(backend.remote.profile?.currency).toBe('USD');
    expect(backend.remote.drafts).toStrictEqual({ pricing: { unitCost: '12' } });
    await expect(sync.start()).resolves.toMatchObject({ outcome: 'created' });
  });

  it('should start fresh by discarding local data', async () => {
    const { sync, backend, settings, calculations } = setup();
    settings.save({ currency: 'USD' });
    calculations.saveDraft('pricing', { unitCost: '12' });
    await sync.start();
    await sync.startFresh();
    expect(settings.load().currency).toBe('ARS');
    expect(calculations.loadAll()).toStrictEqual({});
    expect(backend.remote.profile?.currency).toBe('ARS');
    expect(backend.remote.drafts).toStrictEqual({});
  });

  it('should push local changes, debounced, while signed in', async () => {
    const { sync, backend, settings, calculations } = setup();
    await sync.start();
    settings.save({ currency: 'EUR' });
    settings.save({ currency: 'USD' });
    calculations.saveDraft('pricing', { unitCost: '1' });
    calculations.saveDraft('pricing', { unitCost: '12' });
    await vi.runAllTimersAsync();
    expect(backend.remote.profile?.currency).toBe('USD');
    // Profile creation plus a single debounced push.
    expect(backend.saveProfile).toHaveBeenCalledTimes(2);
    expect(backend.remote.drafts).toStrictEqual({ pricing: { unitCost: '12' } });

    calculations.clearDraft('pricing');
    await vi.runAllTimersAsync();
    expect(backend.remote.drafts).toStrictEqual({});
  });

  it('should keep working when a push fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { sync, backend, settings } = setup();
    await sync.start();
    vi.mocked(backend.saveProfile).mockRejectedValueOnce(new Error('offline'));
    settings.save({ currency: 'EUR' });
    await vi.runAllTimersAsync();
    expect(warn).toHaveBeenCalledWith('[account] sync failed', expect.any(Error));
    warn.mockRestore();
  });

  it('should retry the pull after a failure', async () => {
    const { sync, backend } = setup();
    vi.mocked(backend.fetchProfile).mockRejectedValueOnce(new Error('offline'));
    await expect(sync.start()).rejects.toThrow('offline');
    await expect(sync.start()).resolves.toMatchObject({ outcome: 'created' });
  });

  it.each(['signOut', 'deleteAccount'] as const)(
    'should remove the personal data from this device on %s',
    async (action) => {
      const { sync, backend, settings, calculations, session } = setup({
        user: TEST_USER,
        profile: { currency: 'EUR', locale: 'es', colorScheme: 'dark' },
        drafts: { pricing: { unitCost: '12' } },
      });
      await sync.start();
      await sync[action]();
      expect(backend[action]).toHaveBeenCalledOnce();
      expect(settings.load()).toMatchObject({ currency: 'ARS', locale: 'es', colorScheme: 'dark' });
      expect(calculations.loadAll()).toStrictEqual({});
      expect(session.getItem('milimon:account-synced')).toBeNull();

      settings.save({ currency: 'USD' });
      await vi.runAllTimersAsync();
      expect(backend.saveProfile).not.toHaveBeenCalled();
    },
  );
});
