import { DRAFTS_STORAGE_KEY } from '@constants';
import { isDraft, sanitizeDrafts, useDraftsStore } from '../drafts-store';

const stored = () => JSON.parse(window.localStorage.getItem(DRAFTS_STORAGE_KEY) ?? 'null');

describe('useDraftsStore', () => {
  it('should start without drafts', () => {
    expect(useDraftsStore.getState().drafts).toStrictEqual({});
  });

  it('should save a draft per formula as plain JSON', () => {
    useDraftsStore.getState().saveDraft('waste-factor', { wastePercentage: '30' });
    useDraftsStore.getState().saveDraft('pricing', { cost: '100', withTax: true });
    expect(stored()).toStrictEqual({
      'waste-factor': { wastePercentage: '30' },
      pricing: { cost: '100', withTax: true },
    });
  });

  it('should clear one draft and keep the others', () => {
    const { saveDraft, clearDraft } = useDraftsStore.getState();
    saveDraft('waste-factor', { wastePercentage: '30' });
    saveDraft('pricing', { cost: '100' });
    clearDraft('waste-factor');
    expect(useDraftsStore.getState().drafts).toStrictEqual({ pricing: { cost: '100' } });
  });

  it('should replace every draft, dropping invalid ones', () => {
    useDraftsStore.getState().saveDraft('pricing', { cost: '100' });
    useDraftsStore
      .getState()
      .replaceAll({ 'waste-factor': { wastePercentage: '30' }, broken: [1] as never });
    expect(useDraftsStore.getState().drafts).toStrictEqual({
      'waste-factor': { wastePercentage: '30' },
    });
  });

  it('should load valid drafts saved by an earlier visit', async () => {
    window.localStorage.setItem(
      DRAFTS_STORAGE_KEY,
      JSON.stringify({ pricing: { cost: '100' }, broken: { value: 3 }, list: [] }),
    );
    await useDraftsStore.persist.rehydrate();
    expect(useDraftsStore.getState().drafts).toStrictEqual({ pricing: { cost: '100' } });
  });

  it('should recognize drafts and ignore anything that is not an object', () => {
    expect(isDraft({ a: '1', b: false })).toBe(true);
    expect(isDraft(['1'])).toBe(false);
    expect(sanitizeDrafts('text')).toStrictEqual({});
  });
});
