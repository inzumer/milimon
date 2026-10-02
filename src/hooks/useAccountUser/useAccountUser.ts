import { useMemo, useRef, useSyncExternalStore } from 'react';
import { createSessionStore, type AccountUser, type SessionStore } from '@services/account';

/** The signed-in person from the saved session (no API call), or `null`; follows every tab. */
export const useAccountUser = (store: SessionStore = createSessionStore()): AccountUser | null => {
  const storeRef = useRef(store);
  const snapshot = useSyncExternalStore(
    (onChange) => storeRef.current.subscribe(onChange),
    () => JSON.stringify(storeRef.current.read()?.user ?? null),
    () => 'null',
  );

  return useMemo(() => JSON.parse(snapshot) as AccountUser | null, [snapshot]);
};
