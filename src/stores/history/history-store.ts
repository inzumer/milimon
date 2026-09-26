import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HISTORY_LIMIT, HISTORY_STORAGE_KEY } from '@constants';
import { isDraft, type CalculatorDraft } from '@stores/drafts';
import { plainJsonStorage } from '@stores/persist';

export interface HistoryHeadline {
  output: string;
  value: number;
  kind: string;
}

export interface SavedStep {
  id: string;
  values: Record<string, number>;
}

export interface SavedResult {
  value: Record<string, unknown>;
  steps: SavedStep[];
}

export interface HistoryEntry {
  id: string;
  formulaId: string;
  savedAt: string;
  draft: CalculatorDraft;
  currency: string;
  result: SavedResult;
  headline: HistoryHeadline | null;
}

export type NewHistoryEntry = Omit<HistoryEntry, 'id' | 'savedAt'>;

export interface HistoryState {
  entries: HistoryEntry[];
  add: (entry: NewHistoryEntry) => HistoryEntry;
  remove: (id: string) => void;
  replaceAll: (entries: HistoryEntry[]) => void;
}

const isHeadline = (value: unknown): value is HistoryHeadline => {
  const data = value as Partial<HistoryHeadline> | null;
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.output === 'string' &&
    typeof data.kind === 'string' &&
    typeof data.value === 'number' &&
    Number.isFinite(data.value)
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStep = (value: unknown): value is SavedStep =>
  isRecord(value) &&
  typeof value['id'] === 'string' &&
  isRecord(value['values']) &&
  Object.values(value['values']).every((item) => typeof item === 'number');

const isSavedResult = (value: unknown): value is SavedResult =>
  isRecord(value) &&
  isRecord(value['value']) &&
  Array.isArray(value['steps']) &&
  value['steps'].every(isStep);

export const isHistoryEntry = (value: unknown): value is HistoryEntry => {
  const data = value as Partial<HistoryEntry> | null;
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.formulaId === 'string' &&
    typeof data.savedAt === 'string' &&
    !Number.isNaN(Date.parse(data.savedAt)) &&
    typeof data.currency === 'string' &&
    isDraft(data.draft) &&
    isSavedResult(data.result) &&
    (data.headline === null || isHeadline(data.headline))
  );
};

/** Valid entries only, newest first, at most `HISTORY_LIMIT`. */
export const normalizeHistory = (raw: unknown): HistoryEntry[] =>
  (Array.isArray(raw) ? raw.filter(isHistoryEntry) : [])
    .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))
    .slice(0, HISTORY_LIMIT);

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/** Saved calculations, newest first (synced to the account). */
export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      add: (input) => {
        const entry: HistoryEntry = { ...input, id: newId(), savedAt: new Date().toISOString() };
        set({ entries: normalizeHistory([entry, ...get().entries]) });
        return entry;
      },
      remove: (id) => set({ entries: get().entries.filter((entry) => entry.id !== id) }),
      replaceAll: (entries) => set({ entries: normalizeHistory(entries) }),
    }),
    {
      name: HISTORY_STORAGE_KEY,
      partialize: ({ entries }) => ({ entries }),
      storage: plainJsonStorage<Pick<HistoryState, 'entries'>>(
        ({ entries }) => entries,
        (raw) => ({ entries: normalizeHistory(raw) }),
      ),
    },
  ),
);
