import type { PersistStorage } from 'zustand/middleware';
import { getBrowserStorage, readJson, writeJson } from '@utils';

/**
 * zustand `persist` storage that keeps the data as plain JSON under its key (no zustand envelope),
 * so the inline head scripts and data saved by earlier versions keep working. `fromStored`
 * validates whatever is found, so corrupted or outdated data never reaches the UI.
 */
export const plainJsonStorage = <S>(
  toStored: (state: S) => unknown,
  fromStored: (raw: unknown) => S,
): PersistStorage<S> => ({
  getItem: (name) => {
    const raw = readJson<unknown>(getBrowserStorage(), name);
    return raw === null ? null : { state: fromStored(raw), version: 0 };
  },
  setItem: (name, { state }) => {
    writeJson(getBrowserStorage(), name, toStored(state));
  },
  removeItem: (name) => {
    getBrowserStorage()?.removeItem(name);
  },
});
