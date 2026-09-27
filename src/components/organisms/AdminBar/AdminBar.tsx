import { RichText } from '@inzumer/ui-library';
import { useAccountUser } from '@hooks';
import {
  ADMIN_SECTION_ROLES,
  createSessionStore,
  type AccountRole,
  type SessionStore,
} from '@services/account';
import { interpolate, trackingId } from '@utils';

export interface AdminBarLabels {
  label: string;
  role: string;
  hint: string;
  roles: Record<AccountRole, string>;
}

export interface AdminBarProps {
  labels: AdminBarLabels;
  /** The administration section. */
  href: string;
  store?: SessionStore;
}

/**
 * Strip under the header, only for editors and admins: tells them they browse the site in
 * management mode and with which role. Nobody else ever sees it.
 */
export const AdminBar = ({ labels, href, store = createSessionStore() }: AdminBarProps) => {
  const user = useAccountUser(store);

  if (!user || !ADMIN_SECTION_ROLES.includes(user.role)) {
    return null;
  }

  return (
    <aside
      aria-label={labels.label}
      className="bg-[var(--admin-bar-bg)] text-[var(--admin-bar-text)]"
    >
      <div className="mx-auto flex w-full max-w-layout items-center justify-between gap-3 px-4 py-1.5">
        <a
          id={trackingId('admin-bar', 'link', 'panel')}
          href={href}
          className="flex min-h-8 items-center gap-2 rounded text-[var(--admin-bar-text)] no-underline hover:underline focus-visible:ring-2 focus-visible:ring-[var(--admin-bar-text)] focus-visible:outline-none"
        >
          <RichText as="span" variant="s3" bold className="text-inherit">
            {labels.label}
          </RichText>
          <RichText as="span" variant="s4" className="hidden text-inherit opacity-90 sm:inline">
            · {labels.hint}
          </RichText>
        </a>
        <RichText
          as="span"
          variant="s4"
          bold
          className="rounded-full bg-[var(--admin-bar-badge-bg)] px-2.5 py-0.5 tracking-wide whitespace-nowrap text-[var(--admin-bar-badge-text)] uppercase"
        >
          {interpolate(labels.role, { role: labels.roles[user.role] })}
        </RichText>
      </div>
    </aside>
  );
};
