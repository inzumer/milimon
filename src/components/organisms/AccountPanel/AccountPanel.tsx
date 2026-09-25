import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@inzumer/ui-library';
import {
  AUTH_PROVIDERS,
  getAccountSession,
  type AccountSession,
  type AccountUser,
  type AuthProvider,
} from '@services/account';
import { interpolate } from '@utils';

export interface AccountPanelLabels {
  loading: string;
  'signed-out-intro': string;
  'continue-with': string;
  'sign-in-error': string;
  'signed-in-as': string;
  'sync-note': string;
  'sign-out': string;
  'signed-out': string;
  'migration-title': string;
  'migration-description': string;
  'migration-import': string;
  'migration-fresh': string;
  'delete-title': string;
  'delete-description': string;
  delete: string;
  'delete-confirm': string;
  'delete-cancel': string;
  'delete-question': string;
  deleted: string;
  error: string;
  retry: string;
}

export interface AccountPanelProps {
  labels: AccountPanelLabels;
  /** Absolute or root-relative URL of this page: the provider sends the person back here. */
  returnPath: string;
  /** Injected in tests; defaults to the page's shared account session. */
  loadSession?: () => Promise<AccountSession | null>;
}

type View =
  | { kind: 'loading' }
  | { kind: 'signed-out'; notice?: string }
  | { kind: 'migration'; user: AccountUser }
  | { kind: 'signed-in'; user: AccountUser }
  | { kind: 'error' };

const PROVIDER_NAMES: Record<AuthProvider, string> = { google: 'Google', facebook: 'Facebook' };

/**
 * Sign in with Google or Facebook, decide what happens with this device's data on the first
 * sign-in, sign out and delete the account. Rendered only when accounts are configured.
 */
export const AccountPanel = ({
  labels,
  returnPath,
  loadSession = getAccountSession,
}: AccountPanelProps) => {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [signInFailed, setSignInFailed] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const sessionRef = useRef<AccountSession | null>(null);
  const loadRef = useRef(loadSession);

  const refresh = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }
    try {
      const started = await session.sync.start();
      if (!started) {
        setView((current) => (current.kind === 'signed-out' ? current : { kind: 'signed-out' }));
        return;
      }
      setView({
        kind: started.outcome === 'needs-migration' ? 'migration' : 'signed-in',
        user: started.user,
      });
    } catch {
      setView({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    loadRef
      .current()
      .then((session) => {
        if (!active || !session) {
          return;
        }
        sessionRef.current = session;
        // Fires when the provider redirect is exchanged for a session, and on sign-out elsewhere.
        unsubscribe = session.backend.onUserChange(() => {
          void refresh();
        });
        return refresh();
      })
      .catch(() => {
        if (active) {
          setView({ kind: 'error' });
        }
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [refresh]);

  const run = async (task: (session: AccountSession) => Promise<unknown>, after?: View) => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }
    setBusy(true);
    try {
      await task(session);
      if (after) {
        setView(after);
      } else {
        await refresh();
      }
    } catch {
      setView({ kind: 'error' });
    } finally {
      setBusy(false);
      setConfirmingDelete(false);
    }
  };

  const signIn = async (provider: AuthProvider) => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }
    setBusy(true);
    setSignInFailed(false);
    try {
      await session.backend.signIn(provider, new URL(returnPath, window.location.href).href);
    } catch {
      setSignInFailed(true);
      setBusy(false);
    }
  };

  const status = (text: string) => (
    <p role="status" className="rounded-lg bg-[var(--surface-secondary)] p-4">
      {text}
    </p>
  );

  switch (view.kind) {
    case 'loading':
      return <p aria-busy="true">{labels.loading}</p>;

    case 'error':
      return (
        <div className="flex flex-col items-start gap-3">
          <p role="alert">{labels.error}</p>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            onClick={() => void refresh()}
          >
            {labels.retry}
          </Button>
        </div>
      );

    case 'signed-out':
      return (
        <div className="flex flex-col gap-4">
          {view.notice && status(view.notice)}
          <p>{labels['signed-out-intro']}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {AUTH_PROVIDERS.map((provider) => (
              <Button
                key={provider}
                type="button"
                variant={provider === 'google' ? 'primary' : 'secondary'}
                className="min-h-12 flex-1"
                disabled={busy}
                onClick={() => void signIn(provider)}
              >
                {interpolate(labels['continue-with'], { provider: PROVIDER_NAMES[provider] })}
              </Button>
            ))}
          </div>
          {signInFailed && <p role="alert">{labels['sign-in-error']}</p>}
        </div>
      );

    case 'migration':
      return (
        <section aria-labelledby="account-migration" className="flex flex-col gap-3">
          <h2 id="account-migration" className="text-3xl">
            {labels['migration-title']}
          </h2>
          <p>{labels['migration-description']}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="min-h-11 flex-1"
              disabled={busy}
              onClick={() => void run((session) => session.sync.importLocal())}
            >
              {labels['migration-import']}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 flex-1"
              disabled={busy}
              onClick={() => void run((session) => session.sync.startFresh())}
            >
              {labels['migration-fresh']}
            </Button>
          </div>
        </section>
      );

    case 'signed-in':
      return (
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            {view.user.avatarUrl && (
              <img
                src={view.user.avatarUrl}
                alt=""
                width={56}
                height={56}
                referrerPolicy="no-referrer"
                className="size-14 rounded-full"
              />
            )}
            <p className="flex flex-col">
              <span className="text-sm text-[var(--text-secondary)]">{labels['signed-in-as']}</span>
              <span className="text-lg font-bold">{view.user.name ?? view.user.email}</span>
              {view.user.name && view.user.email && (
                <span className="text-sm text-[var(--text-secondary)]">{view.user.email}</span>
              )}
            </p>
          </div>
          <p>{labels['sync-note']}</p>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 self-start"
            disabled={busy}
            onClick={() =>
              void run((session) => session.sync.signOut(), {
                kind: 'signed-out',
                notice: labels['signed-out'],
              })
            }
          >
            {labels['sign-out']}
          </Button>

          <section
            aria-labelledby="account-delete"
            className="flex flex-col gap-3 border-t border-[var(--border-default)] pt-6"
          >
            <h2 id="account-delete" className="text-3xl">
              {labels['delete-title']}
            </h2>
            <p>{labels['delete-description']}</p>
            {confirmingDelete ? (
              <div className="flex flex-col gap-3">
                <p role="alert" className="font-semibold">
                  {labels['delete-question']}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="destructive"
                    className="min-h-11 flex-1"
                    disabled={busy}
                    onClick={() =>
                      void run((session) => session.sync.deleteAccount(), {
                        kind: 'signed-out',
                        notice: labels.deleted,
                      })
                    }
                  >
                    {labels['delete-confirm']}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11 flex-1"
                    disabled={busy}
                    onClick={() => setConfirmingDelete(false)}
                  >
                    {labels['delete-cancel']}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 self-start"
                onClick={() => setConfirmingDelete(true)}
              >
                {labels.delete}
              </Button>
            )}
          </section>
        </div>
      );
  }
};
