import {
  useDraftsStore,
  useHistoryStore,
  useSavedRecipesStore,
  useSettingsStore,
  type HistoryEntry,
  type Settings,
} from '@stores';
import { createFakeAccountBackend, TEST_USER } from '@test/fake-account-backend';
import { createMemoryStorage } from '@test/memory-storage';
import { createAccountSync, type AccountSync } from '../account-sync';

const settings = {
  load: () => useSettingsStore.getState(),
  save: (patch: Partial<Settings>) => useSettingsStore.getState().update(patch),
};
const calculations = {
  loadAll: () => useDraftsStore.getState().drafts,
  saveDraft: useDraftsStore.getState().saveDraft,
  clearDraft: useDraftsStore.getState().clearDraft,
};
const history = {
  list: () => useHistoryStore.getState().entries,
  add: useHistoryStore.getState().add,
  remove: useHistoryStore.getState().remove,
};

const started: AccountSync[] = [];

const setup = (remote: Parameters<typeof createFakeAccountBackend>[0] = { user: TEST_USER }) => {
  const backend = createFakeAccountBackend(remote);
  const session = createMemoryStorage();
  const sync = createAccountSync({ backend, session, debounceMs: 10 });
  started.push(sync);
  return { backend, settings, calculations, history, session, sync };
};

const SAVED: HistoryEntry = {
  id: 'entry-1',
  formulaId: 'waste-factor',
  savedAt: '2026-09-20T10:00:00.000Z',
  draft: { wastePercentage: '30' },
  currency: 'ARS',
  result: { value: { wasteFactor: 1.429 }, steps: [] },
  headline: { output: 'waste-factor', value: 1.429, kind: 'factor' },
};

const NEW_ENTRY = {
  formulaId: 'pricing',
  draft: { unitCost: '12' },
  currency: 'ARS',
  result: { value: { price: 20 }, steps: [] },
  headline: null,
};

describe('account sync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    started.splice(0).forEach((sync) => sync.stop());
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
    expect(backend.saveProfile).toHaveBeenCalledTimes(2);
    expect(backend.remote.drafts).toStrictEqual({ pricing: { unitCost: '12' } });

    calculations.clearDraft('pricing');
    await vi.runAllTimersAsync();
    expect(backend.remote.drafts).toStrictEqual({});
  });

  it('should not push the profile when only the analytics consent changes', async () => {
    const { sync, backend } = setup();
    await sync.start();
    settings.save({ analyticsConsent: 'granted' });
    await vi.runAllTimersAsync();
    expect(backend.saveProfile).toHaveBeenCalledOnce();
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

  it('should copy the remote history to this device', async () => {
    const { sync, history } = setup({
      user: TEST_USER,
      profile: { currency: 'ARS', locale: null, colorScheme: null },
      history: [SAVED],
    });
    history.add(NEW_ENTRY);
    await sync.start();
    expect(history.list()).toStrictEqual([SAVED]);
  });

  it('should treat a local history as data worth importing, oldest first', async () => {
    const { sync, backend, history } = setup();
    const first = history.add(NEW_ENTRY);
    const second = history.add({ ...NEW_ENTRY, formulaId: 'rent-check' });
    await expect(sync.start()).resolves.toMatchObject({ outcome: 'needs-migration' });
    await sync.importLocal();
    expect(vi.mocked(backend.saveHistoryEntry).mock.calls.map(([entry]) => entry.id)).toStrictEqual(
      [first.id, second.id].sort(
        (a, b) =>
          history.list().findIndex((e) => e.id === b) - history.list().findIndex((e) => e.id === a),
      ),
    );
  });

  it('should push saved and deleted calculations while signed in', async () => {
    const { sync, backend, history } = setup();
    await sync.start();
    const entry = history.add(NEW_ENTRY);
    await vi.runAllTimersAsync();
    expect(backend.remote.history).toStrictEqual([entry]);

    history.remove(entry.id);
    await vi.runAllTimersAsync();
    expect(backend.remote.history).toStrictEqual([]);
  });

  it('should report history push failures without breaking', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { sync, backend, history } = setup();
    await sync.start();
    vi.mocked(backend.saveHistoryEntry).mockRejectedValueOnce(new Error('offline'));
    history.add(NEW_ENTRY);
    await vi.runAllTimersAsync();
    expect(warn).toHaveBeenCalledWith('[account] sync failed', expect.any(Error));
    warn.mockRestore();
  });

  it('should clear the history from this device on sign-out', async () => {
    const { sync, history } = setup({
      user: TEST_USER,
      profile: { currency: 'ARS', locale: null, colorScheme: null },
      history: [SAVED],
    });
    await sync.start();
    await sync.signOut();
    expect(history.list()).toStrictEqual([]);
  });

  describe('saved recipes', () => {
    const saved = () => useSavedRecipesStore.getState().ids;
    const toggle = (id: string) => useSavedRecipesStore.getState().toggle(id);
    const PROFILE = { currency: 'ARS', locale: null, colorScheme: null };

    it('should copy the saved recipes of the account to this device', async () => {
      const { sync } = setup({ user: TEST_USER, profile: PROFILE, savedRecipes: ['scones'] });
      toggle('lemon-loaf');
      await sync.start();
      expect(saved()).toStrictEqual(['scones']);
    });

    it('should treat local saved recipes as data worth importing, oldest first', async () => {
      const { sync, backend } = setup();
      toggle('lemon-loaf');
      toggle('scones');
      await expect(sync.start()).resolves.toMatchObject({ outcome: 'needs-migration' });
      await sync.importLocal();
      expect(vi.mocked(backend.saveRecipe).mock.calls.map(([id]) => id)).toStrictEqual([
        'lemon-loaf',
        'scones',
      ]);
      expect(backend.remote.savedRecipes).toStrictEqual(['scones', 'lemon-loaf']);
    });

    it('should push saved and removed recipes while signed in', async () => {
      const { sync, backend } = setup();
      await sync.start();
      toggle('lemon-loaf');
      await vi.runAllTimersAsync();
      expect(backend.remote.savedRecipes).toStrictEqual(['lemon-loaf']);
      toggle('lemon-loaf');
      await vi.runAllTimersAsync();
      expect(backend.remote.savedRecipes).toStrictEqual([]);
    });

    it('should clear the saved recipes from this device on sign-out', async () => {
      const { sync } = setup({ user: TEST_USER, profile: PROFILE, savedRecipes: ['scones'] });
      await sync.start();
      await sync.signOut();
      expect(saved()).toStrictEqual([]);
    });
  });
});
