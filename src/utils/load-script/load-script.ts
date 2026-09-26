const pending = new Map<string, Promise<void>>();

/**
 * Adds an external script once and resolves when it has loaded. Calls with the same `src` share
 * the same promise; a failed load can be retried.
 */
export const loadScript = (src: string): Promise<void> => {
  const existing = pending.get(src);
  if (existing) {
    return existing;
  }
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => {
      pending.delete(src);
      script.remove();
      reject(new Error(`Could not load ${src}`));
    });
    document.head.append(script);
  });
  pending.set(src, promise);
  return promise;
};
