import { useQuery } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import {
  ADMIN_SECTION_ROLES,
  getAccountSession,
  SessionExpiredError,
  type AccountSession,
  type AccountUser,
} from '@services/account';
import { queryKeys } from '@services/query';

export type AdminAccess =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'signed-out' }
  | { kind: 'forbidden' }
  | { kind: 'error' }
  | { kind: 'ready'; me: AccountUser; session: AccountSession };

const checkAccess = async (session: AccountSession | null): Promise<AdminAccess> => {
  if (!session) {
    return { kind: 'unavailable' };
  }
  if (!(await session.backend.getUser())) {
    return { kind: 'signed-out' };
  }
  try {
    const me = await session.backend.fetchMe();
    return ADMIN_SECTION_ROLES.includes(me.role)
      ? { kind: 'ready', me, session }
      : { kind: 'forbidden' };
  } catch (error) {
    return error instanceof SessionExpiredError ? { kind: 'signed-out' } : { kind: 'error' };
  }
};

/** Whether the person can use the administration section, asked to the API once per page; `retry` re-checks. */
export const useAdminAccess = (loadSession: () => AccountSession | null = getAccountSession) => {
  const loadRef = useRef(loadSession);
  const { data, refetch } = useQuery({
    queryKey: queryKeys.adminAccess,
    queryFn: () => checkAccess(loadRef.current()),
  });
  const retry = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return { access: data ?? ({ kind: 'loading' } as const), retry };
};
