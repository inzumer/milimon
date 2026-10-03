import type { PersistStorage } from 'zustand/middleware';
import { getBrowserStorage, readJson, writeJson } from '@utils';

/** `persist` storage as plain JSON (no envelope), validated by `fromStored` on every read. */
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
