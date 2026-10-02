import { useState } from 'react';
import { useHydrated } from '@hooks/useHydrated';

/**
 * A list filter kept in the URL (`?<param>=<value>`), so it survives reloads and can be shared.
 * The server render uses `fallback`; after hydration the URL decides until someone picks another.
 */
export const useUrlFilter = <T extends string>(
  param: string,
  allowed: readonly T[],
  fallback: T,
): [T, (next: T) => void] => {
  const hydrated = useHydrated();
  const [chosen, setChosen] = useState<T | null>(null);

  const fromUrl = (): T => {
    const value = new URLSearchParams(window.location.search).get(param);

    return allowed.find((option) => option === value) ?? fallback;
  };

  const choose = (next: T) => {
    setChosen(next);
    const url = new URL(window.location.href);
    if (next === fallback) {
      url.searchParams.delete(param);
    } else {
      url.searchParams.set(param, next);
    }

    window.history.replaceState(window.history.state, '', url);
  };

  return [chosen ?? (hydrated ? fromUrl() : fallback), choose];
};
