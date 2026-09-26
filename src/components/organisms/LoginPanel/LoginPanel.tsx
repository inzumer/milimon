import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@inzumer/ui-library';
import { ButtonLink } from '@components/atoms/ButtonLink';
import { MigrationPrompt } from '@components/molecules/MigrationPrompt';
import { API_SLOW_REQUEST_MS } from '@constants';
import type { Translations } from '@i18n/translations';
import {
  FacebookLoginCancelledError,
  getAccountSession,
  loginWithFacebook,
  renderGoogleButton,
  type AccountConfig,
  type AccountSession,
  type AccountUser,
  type AuthProvider,
} from '@services/account';
import { interpolate, track, trackingId, type Locale } from '@utils';

export interface LoginPanelProps {
  lang: Locale;
  labels: Translations<'login-page'>['panel'];
  migrationLabels: Translations<'common'>['migration'];
  accountHref: string;
  termsHref: string;
  privacyHref: string;
  loadSession?: () => AccountSession | null;
  renderGoogle?: typeof renderGoogleButton;
  facebookLogin?: typeof loginWithFacebook;
  navigate?: (href: string) => void;
  slowAfterMs?: number;
}

type View =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'signed-out' }
  | { kind: 'signing-in'; slow: boolean }
  | { kind: 'migration' }
  | { kind: 'signed-in'; user: AccountUser };

const GOOGLE_BUTTON_WIDTH = 320;

const colorScheme = (): 'light' | 'dark' =>
  document.documentElement.dataset['colorScheme'] === 'dark' ? 'dark' : 'light';

/**
 * Sign-in page island: Google's own button, a Facebook button, a "waking up" hint while the
 * free API instance starts, and the first-sign-in choice about this device's data. On success it
 * goes to the account page.
 */
export const LoginPanel = ({
  lang,
  labels,
  migrationLabels,
  accountHref,
  termsHref,
  privacyHref,
  loadSession = getAccountSession,
  renderGoogle = renderGoogleButton,
  facebookLogin = loginWithFacebook,
  navigate = (href) => window.location.assign(href),
  slowAfterMs = API_SLOW_REQUEST_MS,
}: LoginPanelProps) => {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<AccountConfig | null>(null);
  const googleRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<AccountSession | null>(null);
  const depsRef = useRef({ loadSession, renderGoogle, facebookLogin, navigate });

  const signIn = useCallback(
    async (provider: AuthProvider, getUser: (session: AccountSession) => Promise<unknown>) => {
      const session = sessionRef.current;
      if (!session) {
        return;
      }
      setNotice(null);
      setView({ kind: 'signing-in', slow: false });
      const slowTimer = setTimeout(
        () =>
          setView((current) =>
            current.kind === 'signing-in' ? { ...current, slow: true } : current,
          ),
        slowAfterMs,
      );
      try {
        await getUser(session);
        track('sign_in', { provider });
        const started = await session.sync.start();
        if (started?.outcome === 'needs-migration') {
          setView({ kind: 'migration' });
          return;
        }
        depsRef.current.navigate(accountHref);
      } catch (error) {
        const cancelled = error instanceof FacebookLoginCancelledError;
        track('sign_in_failed', { provider, reason: cancelled ? 'cancelled' : 'error' });
        setNotice(cancelled ? labels.cancelled : labels.error);
        setView({ kind: 'signed-out' });
      } finally {
        clearTimeout(slowTimer);
      }
    },
    [accountHref, labels.cancelled, labels.error, slowAfterMs],
  );

  useEffect(() => {
    const session = depsRef.current.loadSession();
    sessionRef.current = session;
    if (!session) {
      setView({ kind: 'unavailable' });
      return;
    }
    setConfig(session.config);
    let active = true;
    void session.backend.getUser().then((user) => {
      if (active) {
        setView(user ? { kind: 'signed-in', user } : { kind: 'signed-out' });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const googleClientId = config?.googleClientId ?? null;
  const showGoogle = view.kind === 'signed-out' || view.kind === 'signing-in';

  useEffect(() => {
    const container = googleRef.current;
    if (!showGoogle || !googleClientId || !container || container.childElementCount > 0) {
      return;
    }
    depsRef.current
      .renderGoogle(container, {
        clientId: googleClientId,
        lang,
        width: GOOGLE_BUTTON_WIDTH,
        theme: colorScheme(),
        onCredential: (credential) =>
          void signIn('google', (session) => session.backend.signInWithGoogle(credential)),
      })
      .catch(() => setNotice(labels['provider-error']));
  }, [showGoogle, googleClientId, lang, signIn, labels]);

  const facebookAppId = config?.facebookAppId ?? null;

  const migrate = async (task: (session: AccountSession) => Promise<void>) => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }
    setBusy(true);
    try {
      await task(session);
      depsRef.current.navigate(accountHref);
    } catch {
      setNotice(labels.error);
      setBusy(false);
    }
  };

  const status = notice && (
    <p role="alert" className="rounded-lg bg-[var(--surface-secondary)] p-4">
      {notice}
    </p>
  );

  switch (view.kind) {
    case 'loading':
      return <p aria-busy="true">{labels.loading}</p>;

    case 'unavailable':
      return <p className="rounded-lg bg-[var(--surface-secondary)] p-4">{labels.unavailable}</p>;

    case 'signed-in':
      return (
        <div className="flex flex-col items-start gap-4">
          <p>
            {interpolate(labels['already-signed-in'], {
              name: view.user.name ?? view.user.email ?? '',
            })}
          </p>
          <ButtonLink id={trackingId('login', 'link', 'account')} href={accountHref}>
            {labels['go-to-account']}
          </ButtonLink>
        </div>
      );

    case 'migration':
      return (
        <div className="flex flex-col gap-5">
          {status}
          <MigrationPrompt
            labels={migrationLabels}
            scope="login"
            busy={busy}
            onImport={() => void migrate((session) => session.sync.importLocal())}
            onStartFresh={() => void migrate((session) => session.sync.startFresh())}
          />
        </div>
      );

    case 'signed-out':
    case 'signing-in': {
      const signingIn = view.kind === 'signing-in';
      return (
        <div className="flex flex-col gap-5">
          {status}
          <p>{labels.intro}</p>
          <div className="flex flex-col items-start gap-3" aria-busy={signingIn}>
            {googleClientId && (
              <div
                id={trackingId('login', 'button', 'google')}
                ref={googleRef}
                className="min-h-11"
                inert={signingIn}
              />
            )}
            {facebookAppId && (
              <Button
                id={trackingId('login', 'button', 'facebook')}
                type="button"
                variant="secondary"
                className="min-h-11 w-full max-w-80 rounded-full"
                disabled={signingIn}
                onClick={() =>
                  void signIn('facebook', async (session) =>
                    session.backend.signInWithFacebook(
                      await depsRef.current.facebookLogin(facebookAppId, lang),
                    ),
                  )
                }
              >
                {labels['continue-with-facebook']}
              </Button>
            )}
          </div>
          {signingIn && (
            <p role="status">{view.slow ? labels['waking-up'] : labels['signing-in']}</p>
          )}
          <p className="text-sm text-[var(--text-secondary)]">
            {labels.legal.split(/(\{terms\}|\{privacy\})/).map((part) =>
              part === '{terms}' ? (
                <a
                  key="terms"
                  id={trackingId('login', 'link', 'terms')}
                  href={termsHref}
                  className="font-semibold text-[var(--text-link)] underline"
                >
                  {labels.terms}
                </a>
              ) : part === '{privacy}' ? (
                <a
                  key="privacy"
                  id={trackingId('login', 'link', 'privacy')}
                  href={privacyHref}
                  className="font-semibold text-[var(--text-link)] underline"
                >
                  {labels.privacy}
                </a>
              ) : (
                part
              ),
            )}
          </p>
        </div>
      );
    }
  }
};
