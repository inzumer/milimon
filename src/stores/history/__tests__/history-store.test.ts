import { HISTORY_LIMIT, HISTORY_STORAGE_KEY } from '@constants';
import { normalizeHistory, useHistoryStore, type NewHistoryEntry } from '../history-store';

const ENTRY: NewHistoryEntry = {
  formulaId: 'waste-factor',
  draft: { wastePercentage: '30' },
  currency: 'ARS',
  result: {
    value: { wasteFactor: 1.429 },
    steps: [{ id: 'waste-factor', values: { wastePercentage: 30, wasteFactor: 1.429 } }],
  },
  headline: { output: 'waste-factor', value: 1.429, kind: 'factor' },
};

const entries = () => useHistoryStore.getState().entries;

let minute = 0;

/** Adds an entry one minute after the previous one, so dates are distinct. */
const add = (input: NewHistoryEntry = ENTRY) => {
  vi.setSystemTime(new Date(Date.UTC(2026, 8, 26, 12, minute++)));

  return useHistoryStore.getState().add(input);
};

describe('useHistoryStore', () => {
  beforeEach(() => {
    minute = 0;
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start empty', () => {
    expect(entries()).toStrictEqual([]);
  });

  it('should add entries with an id and date, newest first', () => {
    const first = add();
    const second = add({ ...ENTRY, formulaId: 'pricing', headline: null });
    expect(first).toMatchObject({ ...ENTRY, savedAt: '2026-09-26T12:00:00.000Z' });
    expect(first.id).not.toBe(second.id);
    expect(entries().map((entry) => entry.formulaId)).toStrictEqual(['pricing', 'waste-factor']);
    expect(JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? '[]')).toHaveLength(2);
  });

  it(`should keep only the latest ${HISTORY_LIMIT} entries`, () => {
    for (let index = 0; index < HISTORY_LIMIT + 3; index += 1) {
      add({ ...ENTRY, draft: { wastePercentage: String(index) } });
    }
    const drafts = entries().map((entry) => entry.draft['wastePercentage']);
    expect(drafts).toHaveLength(HISTORY_LIMIT);
    expect(drafts[0]).toBe(String(HISTORY_LIMIT + 2));
    expect(drafts.at(-1)).toBe('3');
  });

  it('should remove an entry', () => {
    const entry = add();
    add();
    useHistoryStore.getState().remove(entry.id);
    expect(entries().map((item) => item.id)).not.toContain(entry.id);
    expect(entries()).toHaveLength(1);
  });

  it('should replace the whole history', () => {
    add();
    useHistoryStore.getState().replaceAll([]);
    expect(entries()).toStrictEqual([]);
  });

  it('should discard corrupted entries saved by an earlier visit', async () => {
    const valid = { ...ENTRY, id: 'a', savedAt: '2026-09-26T12:00:00.000Z' };
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([
        valid,
        { ...valid, id: 'bad-date', savedAt: 'yesterday' },
        { ...valid, id: 'bad-headline', headline: { output: 'x', value: 'NaN', kind: 'factor' } },
        { ...valid, id: 'bad-draft', draft: [1] },
        { ...valid, id: 'no-result', result: undefined },
        {
          ...valid,
          id: 'bad-steps',
          result: { value: {}, steps: [{ id: 's', values: { a: 'x' } }] },
        },
        null,
      ]),
    );
    await useHistoryStore.persist.rehydrate();
    expect(entries()).toStrictEqual([valid]);

    window.localStorage.setItem(HISTORY_STORAGE_KEY, '{"not":"a list"}');
    await useHistoryStore.persist.rehydrate();
    expect(entries()).toStrictEqual([]);
  });

  it('should normalize remote data the same way', () => {
    const older = { ...ENTRY, id: 'old', savedAt: '2026-01-01T00:00:00.000Z' };
    const newer = { ...ENTRY, id: 'new', savedAt: '2026-02-01T00:00:00.000Z' };
    expect(normalizeHistory([older, newer]).map((entry) => entry.id)).toStrictEqual(['new', 'old']);
  });
});
