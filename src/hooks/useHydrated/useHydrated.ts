import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;

/** `false` on the server and while hydrating: for browser-only state without flashing. */
export const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
