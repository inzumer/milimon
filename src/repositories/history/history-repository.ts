import { isDraft, type CalculatorDraft } from '@repositories/calculations';
import { getBrowserStorage, readJson, writeJson, type KeyValueStorage } from '@utils';

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

/** Oldest entries are dropped beyond this many (the database enforces it too). */
export const HISTORY_LIMIT = 15;

export const HISTORY_STORAGE_KEY = 'milimon:history';

export type HistoryChange =
  | { type: 'added'; entry: HistoryEntry }
  | { type: 'removed'; id: string }
  /** The whole history was replaced by the account sync (nothing to push back). */
  | { type: 'replaced' };

/** Fired on `window` after every change, so open lists stay current. */
export const HISTORY_CHANGED_EVENT = 'milimon:history-changed';

export interface HistoryRepository {
  list: () => HistoryEntry[];
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

const notify = (change: HistoryChange) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<HistoryChange>(HISTORY_CHANGED_EVENT, { detail: change }));
  }
};

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/** `localStorage`-backed history; synced to the account when the person is signed in. */
export const createLocalHistoryRepository = (
  storage: KeyValueStorage | null = getBrowserStorage(),
  now: () => Date = () => new Date(),
): HistoryRepository => {
  const read = () => normalizeHistory(readJson<unknown>(storage, HISTORY_STORAGE_KEY));
  return {
    list: read,
    add: (input) => {
      const entry: HistoryEntry = { ...input, id: newId(), savedAt: now().toISOString() };
      writeJson(storage, HISTORY_STORAGE_KEY, normalizeHistory([entry, ...read()]));
      notify({ type: 'added', entry });
      return entry;
    },
    remove: (id) => {
      writeJson(
        storage,
        HISTORY_STORAGE_KEY,
        read().filter((entry) => entry.id !== id),
      );
      notify({ type: 'removed', id });
    },
    replaceAll: (entries) => {
      writeJson(storage, HISTORY_STORAGE_KEY, normalizeHistory(entries));
      notify({ type: 'replaced' });
    },
  };
};

/** Subscribes to history changes; returns the unsubscribe function. */
export const onHistoryChange = (listener: (change: HistoryChange) => void): (() => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<HistoryChange>).detail);
  window.addEventListener(HISTORY_CHANGED_EVENT, handler);
  return () => window.removeEventListener(HISTORY_CHANGED_EVENT, handler);
};
