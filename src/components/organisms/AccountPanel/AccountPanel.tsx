import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button, RichText } from '@inzumer/ui-library';
import { BrandLoader } from '@components/atoms/BrandLoader';
import { ButtonLink } from '@components/atoms/ButtonLink';
import { Notice } from '@components/atoms/Notice';
import { MigrationPrompt } from '@components/molecules/MigrationPrompt';
import type { Translations } from '@i18n/translations';
import {
  disableGoogleAutoSelect,
  getAccountSession,
  SessionExpiredError,
  type AccountSession,
  type AccountUser,
} from '@services/account';
import { track, trackingId } from '@utils';

export type AccountPanelLabels = Translations<'account-page'>['panel'];

export interface AccountPanelProps {
  labels: AccountPanelLabels;
  migrationLabels: Translations<'common'>['migration'];
  unavailableLabel: string;
  loginHref: string;
  loadSession?: () => AccountSession | null;
}

type View =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'signed-out'; notice?: string }
  | { kind: 'migration'; user: AccountUser }
  | { kind: 'signed-in'; user: AccountUser }
  | { kind: 'error' };

/** The signed-in person: who they are, sign out and delete the account. */
export const AccountPanel = ({
  labels,
  migrationLabels,
  unavailableLabel,
  loginHref,
  loadSession = getAccountSession,
}: AccountPanelProps) => {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const sessionRef = useRef<AccountSession | null>(null);
  const loadRef = useRef(loadSession);
  const deleteTitleId = useId();

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
    } catch (error) {
      setView(
        error instanceof SessionExpiredError
          ? { kind: 'signed-out', notice: labels['session-expired'] }
          : { kind: 'error' },
      );
    }
  }, [labels]);

  useEffect(() => {
    const session = loadRef.current();
    sessionRef.current = session;
    if (!session) {
      setView({ kind: 'unavailable' });
      return;
    }
    void refresh();
    return session.backend.onUserChange(() => void refresh());
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

  const status = (text: string) => <Notice role="status">{text}</Notice>;

  switch (view.kind) {
    case 'loading':
      return <BrandLoader screen label={labels.loading} />;

    case 'unavailable':
      return <Notice>{unavailableLabel}</Notice>;

    case 'error':
      return (
        <div className="flex flex-col items-start gap-3">
          <RichText role="alert">{labels.error}</RichText>
          <Button
            id={trackingId('account', 'button', 'retry')}
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
        <div className="flex flex-col items-start gap-4">
          {view.notice && status(view.notice)}
          <RichText>{labels['signed-out-intro']}</RichText>
          <ButtonLink id={trackingId('account', 'link', 'sign-in')} href={loginHref}>
            {labels['sign-in']}
          </ButtonLink>
        </div>
      );

    case 'migration':
      return (
        <MigrationPrompt
          labels={migrationLabels}
          scope="account"
          busy={busy}
          onImport={() => void run((session) => session.sync.importLocal())}
          onStartFresh={() => void run((session) => session.sync.startFresh())}
        />
      );

    case 'signed-in':
      return (
        <div className="flex flex-col gap-8">
          {busy && <BrandLoader screen />}
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
            <RichText className="flex flex-col">
              <RichText variant="s3" className="text-[var(--text-secondary)]">
                {labels['signed-in-as']}
              </RichText>
              <RichText variant="s1" className="font-bold">
                {view.user.name ?? view.user.email}
              </RichText>
              {view.user.name && view.user.email && (
                <RichText variant="s3" className="text-[var(--text-secondary)]">
                  {view.user.email}
                </RichText>
              )}
            </RichText>
          </div>
          <RichText>{labels['sync-note']}</RichText>
          <Button
            id={trackingId('account', 'button', 'sign-out')}
            type="button"
            variant="secondary"
            className="min-h-11 self-start"
            loading={busy}
            onClick={() =>
              void run(
                async (session) => {
                  await session.sync.signOut();
                  disableGoogleAutoSelect();
                  track('sign_out', {});
                },
                { kind: 'signed-out', notice: labels['signed-out'] },
              )
            }
          >
            {labels['sign-out']}
          </Button>

          <section
            aria-labelledby={deleteTitleId}
            className="flex flex-col gap-3 border-t border-[var(--border-default)] pt-6"
          >
            <RichText variant="h2" bold id={deleteTitleId} className="font-display text-3xl">
              {labels['delete-title']}
            </RichText>
            <RichText>{labels['delete-description']}</RichText>
            {confirmingDelete ? (
              <div className="flex flex-col gap-3">
                <RichText role="alert" className="font-semibold">
                  {labels['delete-question']}
                </RichText>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    id={trackingId('account', 'button', 'delete-confirm')}
                    type="button"
                    variant="destructive"
                    className="min-h-11 flex-1"
                    loading={busy}
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
                    id={trackingId('account', 'button', 'delete-cancel')}
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
                id={trackingId('account', 'button', 'delete')}
                type="button"
                variant="ghost"
                className="min-h-11 self-start border-[var(--border-error)]"
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
