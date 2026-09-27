import { useMemo, useRef, useSyncExternalStore } from 'react';
import { createSessionStore, type AccountUser, type SessionStore } from '@services/account';

/**
 * The person signed in on this device (from the saved session, no API call), or `null`. Follows
 * sign-in, sign-out and role changes from any tab; `null` on the server and while hydrating.
 */
export const useAccountUser = (store: SessionStore = createSessionStore()): AccountUser | null => {
  const storeRef = useRef(store);
  const snapshot = useSyncExternalStore(
    (onChange) => storeRef.current.subscribe(onChange),
    () => JSON.stringify(storeRef.current.read()?.user ?? null),
    () => 'null',
  );
  return useMemo(() => JSON.parse(snapshot) as AccountUser | null, [snapshot]);
};
