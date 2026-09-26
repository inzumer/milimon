export interface KeyValueStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

/** `localStorage` by default; `session` gives `sessionStorage` (cleared when the tab closes). */
export const getBrowserStorage = (kind: 'local' | 'session' = 'local'): KeyValueStorage | null => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
};

export const readJson = <T>(storage: KeyValueStorage | null, key: string): T | null => {
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
};

export const writeJson = (storage: KeyValueStorage | null, key: string, value: unknown): void => {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: persistence is best-effort.
  }
};
