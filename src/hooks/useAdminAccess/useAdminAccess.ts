import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ADMIN_SECTION_ROLES,
  getAccountSession,
  SessionExpiredError,
  type AccountSession,
  type AccountUser,
} from '@services/account';

export type AdminAccess =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'signed-out' }
  | { kind: 'forbidden' }
  | { kind: 'error' }
  | { kind: 'ready'; me: AccountUser; session: AccountSession };

/** Whether the person can use the administration section, asked to the API; `retry` re-checks. */
export const useAdminAccess = (loadSession: () => AccountSession | null = getAccountSession) => {
  const loadRef = useRef(loadSession);
  const [access, setAccess] = useState<AdminAccess>({ kind: 'loading' });

  const check = useCallback(async () => {
    const session = loadRef.current();
    if (!session) {
      setAccess({ kind: 'unavailable' });
      return;
    }
    if (!(await session.backend.getUser())) {
      setAccess({ kind: 'signed-out' });
      return;
    }
    try {
      const me = await session.backend.fetchMe();
      setAccess(
        ADMIN_SECTION_ROLES.includes(me.role)
          ? { kind: 'ready', me, session }
          : { kind: 'forbidden' },
      );
    } catch (error) {
      setAccess(error instanceof SessionExpiredError ? { kind: 'signed-out' } : { kind: 'error' });
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  return { access, retry: check };
};
