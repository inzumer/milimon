import { createMemoryStorage } from '@test/memory-storage';
import {
  createLocalHistoryRepository,
  HISTORY_LIMIT,
  HISTORY_STORAGE_KEY,
  normalizeHistory,
  onHistoryChange,
  type NewHistoryEntry,
} from '../history-repository';

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

/** A clock that advances one minute per call, so entries have distinct dates. */
const clock = () => {
  let minute = 0;
  return () => new Date(Date.UTC(2026, 8, 26, 12, minute++));
};

describe('history repository (local)', () => {
  it('should start empty', () => {
    expect(createLocalHistoryRepository(createMemoryStorage()).list()).toStrictEqual([]);
  });

  it('should add entries with an id and date, newest first', () => {
    const history = createLocalHistoryRepository(createMemoryStorage(), clock());
    const first = history.add(ENTRY);
    const second = history.add({ ...ENTRY, formulaId: 'pricing', headline: null });
    expect(first).toMatchObject({ ...ENTRY, savedAt: '2026-09-26T12:00:00.000Z' });
    expect(first.id).not.toBe(second.id);
    expect(history.list().map((entry) => entry.formulaId)).toStrictEqual([
      'pricing',
      'waste-factor',
    ]);
  });

  it(`should keep only the latest ${HISTORY_LIMIT} entries`, () => {
    const history = createLocalHistoryRepository(createMemoryStorage(), clock());
    for (let index = 0; index < HISTORY_LIMIT + 3; index += 1) {
      history.add({ ...ENTRY, draft: { wastePercentage: String(index) } });
    }
    const drafts = history.list().map((entry) => entry.draft['wastePercentage']);
    expect(drafts).toHaveLength(HISTORY_LIMIT);
    expect(drafts[0]).toBe(String(HISTORY_LIMIT + 2));
    expect(drafts.at(-1)).toBe('3');
  });

  it('should remove an entry', () => {
    const history = createLocalHistoryRepository(createMemoryStorage(), clock());
    const entry = history.add(ENTRY);
    history.add(ENTRY);
    history.remove(entry.id);
    expect(history.list().map((item) => item.id)).not.toContain(entry.id);
    expect(history.list()).toHaveLength(1);
  });

  it('should notify additions, removals and replacements', () => {
    const history = createLocalHistoryRepository(createMemoryStorage(), clock());
    const listener = vi.fn();
    const stop = onHistoryChange(listener);
    const entry = history.add(ENTRY);
    history.remove(entry.id);
    history.replaceAll([]);
    stop();
    history.add(ENTRY);
    expect(listener.mock.calls).toStrictEqual([
      [{ type: 'added', entry }],
      [{ type: 'removed', id: entry.id }],
      [{ type: 'replaced' }],
    ]);
  });

  it('should discard corrupted entries', () => {
    const storage = createMemoryStorage();
    const valid = { ...ENTRY, id: 'a', savedAt: '2026-09-26T12:00:00.000Z' };
    storage.setItem(
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
    expect(createLocalHistoryRepository(storage).list()).toStrictEqual([valid]);
    storage.setItem(HISTORY_STORAGE_KEY, '{"not":"a list"}');
    expect(createLocalHistoryRepository(storage).list()).toStrictEqual([]);
  });

  it('should normalize remote data the same way', () => {
    const older = { ...ENTRY, id: 'old', savedAt: '2026-01-01T00:00:00.000Z' };
    const newer = { ...ENTRY, id: 'new', savedAt: '2026-02-01T00:00:00.000Z' };
    expect(normalizeHistory([older, newer]).map((entry) => entry.id)).toStrictEqual(['new', 'old']);
  });
});
