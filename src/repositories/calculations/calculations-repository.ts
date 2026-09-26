import { getBrowserStorage, readJson, writeJson, type KeyValueStorage } from '@utils';

export type CalculatorDraft = Record<string, string | boolean>;

export type CalculatorDrafts = Record<string, CalculatorDraft>;

export const CALCULATIONS_STORAGE_KEY = 'milimon:calculations';

/** Fired on `window` after a draft is saved or cleared (`detail`: the formula id). */
export const CALCULATIONS_CHANGED_EVENT = 'milimon:calculations-changed';

export interface CalculationsRepository {
  loadDraft: (formulaId: string) => CalculatorDraft | null;
  saveDraft: (formulaId: string, draft: CalculatorDraft) => void;
  clearDraft: (formulaId: string) => void;
  loadAll: () => CalculatorDrafts;
  replaceAll: (drafts: CalculatorDrafts) => void;
}

export const isDraft = (value: unknown): value is CalculatorDraft =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((item) => typeof item === 'string' || typeof item === 'boolean');

const sanitize = (raw: unknown): CalculatorDrafts => {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  return Object.fromEntries(Object.entries(raw).filter(([, draft]) => isDraft(draft)));
};

const notify = (formulaId: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<string>(CALCULATIONS_CHANGED_EVENT, { detail: formulaId }),
    );
  }
};

/** Remembers the last values typed in each calculator (localStorage; synced to the account). */
export const createLocalCalculationsRepository = (
  storage: KeyValueStorage | null = getBrowserStorage(),
): CalculationsRepository => {
  const readStore = () => sanitize(readJson<unknown>(storage, CALCULATIONS_STORAGE_KEY));
  return {
    loadDraft: (formulaId) => readStore()[formulaId] ?? null,
    saveDraft: (formulaId, draft) => {
      writeJson(storage, CALCULATIONS_STORAGE_KEY, { ...readStore(), [formulaId]: draft });
      notify(formulaId);
    },
    clearDraft: (formulaId) => {
      const { [formulaId]: _removed, ...rest } = readStore();
      writeJson(storage, CALCULATIONS_STORAGE_KEY, rest);
      notify(formulaId);
    },
    loadAll: readStore,
    replaceAll: (drafts) => {
      writeJson(storage, CALCULATIONS_STORAGE_KEY, sanitize(drafts));
    },
  };
};

/** Subscribes to draft changes; returns the unsubscribe function. */
export const onCalculationsChange = (listener: (formulaId: string) => void): (() => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<string>).detail);
  window.addEventListener(CALCULATIONS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(CALCULATIONS_CHANGED_EVENT, handler);
};
