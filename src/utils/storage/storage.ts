/**
 * Minimal key/value storage contract. `localStorage` implements it; tests and future remote
 * repositories can provide their own. All access is defensive: private mode, disabled storage or
 * quota errors must never break the page.
 */
export interface KeyValueStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export const getBrowserStorage = (): KeyValueStorage | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
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
