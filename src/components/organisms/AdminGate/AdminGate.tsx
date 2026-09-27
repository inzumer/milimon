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

/**
 * Shows internal pages (the suggestion documents) only to editors and admins signed in on this
 * device. It hides content that is already public in the repository, so it trusts the saved
 * session instead of asking the API; anything that writes data is checked by the API.
 */
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
