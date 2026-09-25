import { useEffect } from 'react';

/** Prevents the page behind an open overlay from scrolling; restores the previous value on release. */
export const useScrollLock = (active: boolean): void => {
  useEffect(() => {
    if (!active) {
      return;
    }
    const { style } = document.body;
    const previous = style.overflow;
    style.overflow = 'hidden';
    return () => {
      style.overflow = previous;
    };
  }, [active]);
};
