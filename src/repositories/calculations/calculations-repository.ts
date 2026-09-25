import { getBrowserStorage, readJson, writeJson, type KeyValueStorage } from '@utils';

/** What the person typed in a calculator, as raw text (numbers) or booleans (toggles). */
export type CalculatorDraft = Record<string, string | boolean>;

export const CALCULATIONS_STORAGE_KEY = 'milimon:calculations';

export interface CalculationsRepository {
  loadDraft: (formulaId: string) => CalculatorDraft | null;
  saveDraft: (formulaId: string, draft: CalculatorDraft) => void;
  clearDraft: (formulaId: string) => void;
}

type Store = Record<string, CalculatorDraft>;

const isDraft = (value: unknown): value is CalculatorDraft =>
  typeof value === 'object' &&
  value !== null &&
  Object.values(value).every((item) => typeof item === 'string' || typeof item === 'boolean');

const readStore = (storage: KeyValueStorage | null): Store => {
  const raw = readJson<unknown>(storage, CALCULATIONS_STORAGE_KEY);
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  return Object.fromEntries(Object.entries(raw).filter(([, draft]) => isDraft(draft))) as Store;
};

/** Remembers the last values typed in each calculator (localStorage; per profile in phase F10). */
export const createLocalCalculationsRepository = (
  storage: KeyValueStorage | null = getBrowserStorage(),
): CalculationsRepository => ({
  loadDraft: (formulaId) => readStore(storage)[formulaId] ?? null,
  saveDraft: (formulaId, draft) => {
    writeJson(storage, CALCULATIONS_STORAGE_KEY, { ...readStore(storage), [formulaId]: draft });
  },
  clearDraft: (formulaId) => {
    const { [formulaId]: _removed, ...rest } = readStore(storage);
    writeJson(storage, CALCULATIONS_STORAGE_KEY, rest);
  },
});
