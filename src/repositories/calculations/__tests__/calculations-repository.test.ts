import { createMemoryStorage } from '@test/memory-storage';
import {
  CALCULATIONS_STORAGE_KEY,
  createLocalCalculationsRepository,
  onCalculationsChange,
} from '../calculations-repository';

describe('calculations repository (local)', () => {
  it('should return null when nothing was saved for a formula', () => {
    expect(
      createLocalCalculationsRepository(createMemoryStorage()).loadDraft('waste-factor'),
    ).toBeNull();
  });

  it('should save drafts per formula without touching the others', () => {
    const storage = createMemoryStorage();
    const repository = createLocalCalculationsRepository(storage);
    repository.saveDraft('waste-factor', { wastePercentage: '30' });
    repository.saveDraft('pricing', { unitCost: '12', includeCardFee: false });

    expect(repository.loadDraft('waste-factor')).toStrictEqual({ wastePercentage: '30' });
    expect(repository.loadDraft('pricing')).toStrictEqual({
      unitCost: '12',
      includeCardFee: false,
    });
  });

  it('should clear a single draft', () => {
    const repository = createLocalCalculationsRepository(createMemoryStorage());
    repository.saveDraft('waste-factor', { wastePercentage: '30' });
    repository.saveDraft('rent-check', { rent: '1' });
    repository.clearDraft('waste-factor');

    expect(repository.loadDraft('waste-factor')).toBeNull();
    expect(repository.loadDraft('rent-check')).toStrictEqual({ rent: '1' });
  });

  it('should ignore corrupted data', () => {
    const storage = createMemoryStorage();
    storage.setItem(
      CALCULATIONS_STORAGE_KEY,
      JSON.stringify({ 'waste-factor': { wastePercentage: 30 }, pricing: { unitCost: '12' } }),
    );
    const repository = createLocalCalculationsRepository(storage);
    expect(repository.loadDraft('waste-factor')).toBeNull();
    expect(repository.loadDraft('pricing')).toStrictEqual({ unitCost: '12' });

    storage.setItem(CALCULATIONS_STORAGE_KEY, '"oops"');
    expect(repository.loadDraft('pricing')).toBeNull();
  });

  it('should load and replace every draft at once, dropping invalid ones', () => {
    const repository = createLocalCalculationsRepository(createMemoryStorage());
    repository.saveDraft('waste-factor', { wastePercentage: '30' });
    repository.replaceAll({
      pricing: { unitCost: '12' },
      broken: ['not', 'a', 'draft'] as unknown as Record<string, string>,
    });
    expect(repository.loadAll()).toStrictEqual({ pricing: { unitCost: '12' } });
  });

  it('should notify saves and clears but not bulk replacements', () => {
    const repository = createLocalCalculationsRepository(createMemoryStorage());
    const listener = vi.fn();
    const stop = onCalculationsChange(listener);
    repository.saveDraft('pricing', { unitCost: '12' });
    repository.clearDraft('pricing');
    repository.replaceAll({});
    stop();
    repository.saveDraft('pricing', { unitCost: '1' });
    expect(listener.mock.calls).toStrictEqual([['pricing'], ['pricing']]);
  });
});
