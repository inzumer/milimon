import type { ReactNode } from 'react';
import {
  AdminAccessNotice,
  type AdminAccessNoticeLabels,
} from '@components/molecules/AdminAccessNotice';
import { useAccountUser, useHydrated } from '@hooks';
import { ADMIN_SECTION_ROLES, createSessionStore, type SessionStore } from '@services/account';

export interface AdminGateProps {
  labels: AdminAccessNoticeLabels;
  loginHref: string;
  children: ReactNode;
  store?: SessionStore;
}

/** Shows internal docs only to editors and admins from the saved session; writes go through the API. */
export const AdminGate = ({
  labels,
  loginHref,
  children,
  store = createSessionStore(),
}: AdminGateProps) => {
  const hydrated = useHydrated();
  const user = useAccountUser(store);

  if (hydrated && user && ADMIN_SECTION_ROLES.includes(user.role)) {
    return children;
  }

  const access = !hydrated
    ? ({ kind: 'loading' } as const)
    : user
      ? ({ kind: 'forbidden' } as const)
      : ({ kind: 'signed-out' } as const);

  return (
    <AdminAccessNotice
      access={access}
      labels={labels}
      loginHref={loginHref}
      onRetry={() => undefined}
      scope="admin-docs"
    />
  );
};
