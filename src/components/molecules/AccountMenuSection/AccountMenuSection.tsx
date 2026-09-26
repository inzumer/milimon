import { useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Button, RichText } from '@inzumer/ui-library';
import { ButtonLink } from '@components/atoms/ButtonLink';
import {
  createSessionStore,
  disableGoogleAutoSelect,
  getAccountSession,
  type AccountSession,
  type AccountUser,
  type SessionStore,
} from '@services/account';
import { track, trackingId } from '@utils';

export interface AccountMenuSectionLabels {
  title: string;
  signedInAs: string;
  signIn: string;
  signOut: string;
  account: string;
  signedOutHint: string;
}

export interface AccountMenuSectionProps {
  labels: AccountMenuSectionLabels;
  loginHref: string;
  accountHref: string;
  store?: SessionStore;
  loadSession?: () => AccountSession | null;
}

/**
 * The account block of the side menu: who is signed in, "My account" and "Sign out", or a sign-in
 * link. Reads the session saved on this device (no API call to render) and follows sign-in and
 * sign-out from any tab.
 */
export const AccountMenuSection = ({
  labels,
  loginHref,
  accountHref,
  store = createSessionStore(),
  loadSession = getAccountSession,
}: AccountMenuSectionProps) => {
  const titleId = useId();
  const depsRef = useRef({ store, loadSession });
  const [busy, setBusy] = useState(false);
  // A JSON snapshot keeps it stable between reads; on the server nobody is signed in.
  const snapshot = useSyncExternalStore(
    (onChange) => depsRef.current.store.subscribe(onChange),
    () => JSON.stringify(depsRef.current.store.read()?.user ?? null),
    () => 'null',
  );
  const user = useMemo(() => JSON.parse(snapshot) as AccountUser | null, [snapshot]);

  const signOut = async () => {
    setBusy(true);
    try {
      const session = depsRef.current.loadSession();
      if (session) {
        await session.sync.signOut();
      } else {
        depsRef.current.store.clear();
      }
      disableGoogleAutoSelect();
      track('sign_out', {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <RichText
        variant="h3"
        id={titleId}
        className="text-sm font-bold tracking-wide text-[var(--text-secondary)] uppercase"
      >
        {labels.title}
      </RichText>
      {user ? (
        <>
          <RichText className="flex flex-col">
            <RichText variant="s3" className="text-[var(--text-secondary)]">
              {labels.signedInAs}
            </RichText>
            <RichText variant="s2" className="font-bold">
              {user.name ?? user.email}
            </RichText>
          </RichText>
          <div className="flex flex-wrap gap-2">
            <ButtonLink
              id={trackingId('menu', 'link', 'account')}
              href={accountHref}
              variant="secondary"
            >
              {labels.account}
            </ButtonLink>
            <Button
              id={trackingId('menu', 'button', 'sign-out')}
              type="button"
              variant="ghost"
              className="min-h-11"
              disabled={busy}
              onClick={() => void signOut()}
            >
              {labels.signOut}
            </Button>
          </div>
        </>
      ) : (
        <>
          <RichText variant="p3" className="text-[var(--text-secondary)]">
            {labels.signedOutHint}
          </RichText>
          <ButtonLink
            id={trackingId('menu', 'link', 'sign-in')}
            href={loginHref}
            className="self-start"
          >
            {labels.signIn}
          </ButtonLink>
        </>
      )}
    </section>
  );
};
