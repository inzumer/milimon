import { useEffect } from 'react';

/** Keeps the screen on while `active` (Screen Wake Lock API); asks again when the tab comes back. */
export const useWakeLock = (active: boolean): void => {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return undefined;
    }
    let lock: WakeLockSentinel | null = null;
    let released = false;

    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        // Denied (battery saver, hidden tab): the screen just follows its normal timeout.
      }
    };
    const onVisible = () => {
      if (!released && document.visibilityState === 'visible') {
        void request();
      }
    };

    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, [active]);
};
