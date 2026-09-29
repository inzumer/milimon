import { useEffect, useId, useState, type SyntheticEvent } from 'react';
import {
  Button,
  Dropdown,
  Input,
  Modal,
  RichText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@inzumer/ui-library';
import { SectionLabel } from '@components/atoms/SectionLabel';
import { AdminAccessNotice } from '@components/molecules/AdminAccessNotice';
import { useAdminAccess } from '@hooks';
import type { Translations } from '@i18n/translations';
import {
  ACCOUNT_ROLES,
  getAccountSession,
  type AccountRole,
  type AccountSession,
  type AdminUser,
  type AdminUserPage,
  type RoleChange,
} from '@services/account';
import { HttpError, interpolate, trackingId, type Locale } from '@utils';

export type AdminPanelLabels = Translations<'admin-page'>;

export interface AdminPanelProps {
  lang: Locale;
  labels: AdminPanelLabels;
  loginHref: string;
  loadSession?: () => AccountSession | null;
}

interface PendingChange {
  user: AdminUser;
  role: AccountRole;
}

const resultFor = (error: unknown, labels: AdminPanelLabels['results']): string => {
  if (error instanceof HttpError && error.status === 409) {
    return labels['last-admin'];
  }
  if (error instanceof HttpError && error.status === 400) {
    return labels.self;
  }
  if (error instanceof HttpError && error.status === 403) {
    return labels.forbidden;
  }
  return labels.error;
};

/** Administration: content and, for admins, accounts with role changes and the audit log. */
export const AdminPanel = ({
  lang,
  labels,
  loginHref,
  loadSession = getAccountSession,
}: AdminPanelProps) => {
  const { access: view, retry } = useAdminAccess(loadSession);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<AdminUserPage | null>(null);
  const [changes, setChanges] = useState<RoleChange[]>([]);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [reloads, setReloads] = useState(0);
  const usersTitleId = useId();
  const logTitleId = useId();
  const dateFormat = new Intl.DateTimeFormat(lang === 'es' ? 'es-AR' : 'en-US', {
    dateStyle: 'medium',
  });
  const roleName = (role: AccountRole) => labels.roles[role];
  const displayName = (user: { name: string | null; email: string | null }) =>
    user.name ?? user.email ?? '—';

  const isAdmin = view.kind === 'ready' && view.me.role === 'admin';
  const session = view.kind === 'ready' ? view.session : null;

  useEffect(() => {
    if (!session || !isAdmin) {
      return undefined;
    }
    let active = true;
    Promise.all([session.backend.listUsers(query, page), session.backend.listRoleChanges(1)]).then(
      ([list, log]) => {
        if (active) {
          setUsers(list);
          setChanges(log);
        }
      },
      (error: unknown) => {
        if (active) {
          setNotice(resultFor(error, labels.results));
        }
      },
    );
    return () => {
      active = false;
    };
  }, [session, isAdmin, query, page, reloads, labels.results]);

  const submitSearch = (event: SyntheticEvent) => {
    event.preventDefault();
    setPage(1);
    setQuery(search);
  };

  const confirmChange = async () => {
    if (!session || !pending) {
      return;
    }
    setBusy(true);
    try {
      const updated = await session.backend.setUserRole(pending.user.id, pending.role);
      setNotice(
        interpolate(labels.results.changed, {
          name: displayName(updated),
          role: roleName(updated.role),
        }),
      );
      setReloads((count) => count + 1);
    } catch (error) {
      setNotice(resultFor(error, labels.results));
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  if (view.kind !== 'ready') {
    return (
      <AdminAccessNotice
        access={view}
        labels={labels}
        loginHref={loginHref}
        onRetry={() => void retry()}
        scope="admin"
      />
    );
  }

  const pages = users ? Math.max(1, Math.ceil(users.total / users.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] p-5">
        <SectionLabel>{labels.content.title}</SectionLabel>
        <RichText>{labels.content.description}</RichText>
        <RichText variant="p3" className="text-[var(--text-secondary)]">
          {labels.content.soon}
        </RichText>
      </section>

      {isAdmin && (
        <section aria-labelledby={usersTitleId} className="flex flex-col gap-4">
          <SectionLabel id={usersTitleId}>{labels.users.title}</SectionLabel>
          <form className="flex flex-wrap items-end gap-3" onSubmit={submitSearch}>
            <div className="min-w-60 flex-1">
              <Input
                id={trackingId('admin', 'input', 'search')}
                type="search"
                label={labels.users['search-label']}
                placeholder={labels.users['search-placeholder']}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button
              id={trackingId('admin', 'button', 'search')}
              type="submit"
              variant="secondary"
              className="min-h-11"
            >
              {labels.users.search}
            </Button>
          </form>

          {users && users.items.length === 0 && <RichText>{labels.users.empty}</RichText>}
          {users && users.items.length > 0 && (
            <Table caption={labels.users.title} captionHidden>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{labels.users.name}</TableHeaderCell>
                  <TableHeaderCell>{labels.users.email}</TableHeaderCell>
                  <TableHeaderCell>{labels.users.role}</TableHeaderCell>
                  <TableHeaderCell>{labels.users.since}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.items.map((user) => {
                  const self = user.id === view.me.id;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        {displayName(user)} {self && labels.users.you}
                      </TableCell>
                      <TableCell>{user.email ?? '—'}</TableCell>
                      <TableCell>
                        <Dropdown
                          id={trackingId('admin', 'select', 'role', user.id)}
                          label={interpolate(labels.users['role-label'], {
                            name: displayName(user),
                          })}
                          className="min-w-36 [&>span:first-child]:sr-only"
                          inputSize="md"
                          value={user.role}
                          disabled={self || busy}
                          options={ACCOUNT_ROLES.map((role) => ({
                            value: role,
                            label: roleName(role),
                          }))}
                          onChange={(role) => setPending({ user, role: role as AccountRole })}
                        />
                      </TableCell>
                      <TableCell>{dateFormat.format(new Date(user.createdAt))}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {users && pages > 1 && (
            <nav className="flex items-center gap-3" aria-label={labels.users.title}>
              <Button
                id={trackingId('admin', 'button', 'previous')}
                type="button"
                variant="secondary"
                className="min-h-11"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                {labels.users.previous}
              </Button>
              <RichText variant="p3">{interpolate(labels.users.page, { page, pages })}</RichText>
              <Button
                id={trackingId('admin', 'button', 'next')}
                type="button"
                variant="secondary"
                className="min-h-11"
                disabled={page >= pages}
                onClick={() => setPage((current) => current + 1)}
              >
                {labels.users.next}
              </Button>
            </nav>
          )}

          <RichText role="status" variant="p3" className="min-h-6">
            {notice}
          </RichText>
        </section>
      )}

      {isAdmin && (
        <section aria-labelledby={logTitleId} className="flex flex-col gap-3">
          <SectionLabel id={logTitleId}>{labels.log.title}</SectionLabel>
          {changes.length === 0 ? (
            <RichText className="text-[var(--text-secondary)]">{labels.log.empty}</RichText>
          ) : (
            <ul className="flex flex-col gap-2">
              {changes.map((change) => (
                <li key={change.id} className="flex flex-col">
                  <RichText variant="p3">
                    {interpolate(labels.log.entry, {
                      user: change.userEmail ?? '—',
                      from: roleName(change.fromRole),
                      to: roleName(change.toRole),
                    })}
                  </RichText>
                  <RichText variant="p4" className="text-[var(--text-secondary)]">
                    {dateFormat.format(new Date(change.createdAt))} ·{' '}
                    {change.reason === 'bootstrap'
                      ? labels.log.bootstrap
                      : interpolate(labels.log.by, { author: change.changedByEmail ?? '—' })}
                  </RichText>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={labels.confirm.title}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              id={trackingId('admin', 'button', 'cancel-role')}
              type="button"
              variant="secondary"
              className="min-h-11"
              onClick={() => setPending(null)}
            >
              {labels.confirm.cancel}
            </Button>
            <Button
              id={trackingId('admin', 'button', 'confirm-role')}
              type="button"
              className="min-h-11"
              loading={busy}
              onClick={() => void confirmChange()}
            >
              {labels.confirm.confirm}
            </Button>
          </div>
        }
      >
        {pending && (
          <RichText>
            {interpolate(labels.confirm.message, {
              name: displayName(pending.user),
              from: roleName(pending.user.role),
              to: roleName(pending.role),
            })}
          </RichText>
        )}
      </Modal>
    </div>
  );
};
