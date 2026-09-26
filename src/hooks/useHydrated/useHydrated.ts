import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;

/**
 * `false` on the server and while hydrating, `true` afterwards: for what only the browser knows
 * (e.g. whether someone already answered the cookie banner), so the markup never flashes.
 */
export const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
