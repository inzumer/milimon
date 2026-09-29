import { QueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME_MS } from '@constants';

let current: QueryClient | null = null;

/** The page's single cache, shared by every island; `requestJson` already retries, so queries don't. */
export const getQueryClient = (): QueryClient => {
  current ??= new QueryClient({
    defaultOptions: {
      queries: { staleTime: QUERY_STALE_TIME_MS, retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  return current;
};

export const resetQueryClient = (): void => {
  current?.clear();
  current = null;
};

/** Every cache key in one place, so invalidations can't drift from the queries. */
export const queryKeys = {
  adminAccess: ['admin-access'] as const,
  agenda: (from: string, to: string) => ['agenda', from, to] as const,
  agendaAll: ['agenda'] as const,
  adminUsers: (search: string, page: number) => ['admin', 'users', search, page] as const,
  roleChanges: (page: number) => ['admin', 'role-changes', page] as const,
  adminAll: ['admin'] as const,
};
