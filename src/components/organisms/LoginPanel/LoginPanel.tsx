import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button, Image, RichText } from '@inzumer/ui-library';
import facebookIcon from '@assets/facebook.png';
import { ButtonLink } from '@components/atoms/ButtonLink';
import { Notice } from '@components/atoms/Notice';
import { MigrationPrompt } from '@components/molecules/MigrationPrompt';
import { API_SLOW_REQUEST_MS, PROVIDER_BUTTON_WIDTH } from '@constants';
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
  const id = useId();
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
        width: PROVIDER_BUTTON_WIDTH,
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

  const status = notice && <Notice role="alert">{notice}</Notice>;

  switch (view.kind) {
    case 'loading':
      return <RichText aria-busy="true">{labels.loading}</RichText>;

    case 'unavailable':
      return <Notice>{labels.unavailable}</Notice>;

    case 'signed-in':
      return (
        <div className="flex flex-col items-start gap-4">
          <RichText>
            {interpolate(labels['already-signed-in'], {
              name: view.user.name ?? view.user.email ?? '',
            })}
          </RichText>
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
          <RichText>{labels.intro}</RichText>
          <div className="flex flex-col items-start gap-3" aria-busy={signingIn}>
            {googleClientId && (
              <div
                id={trackingId('login', 'button', 'google')}
                ref={googleRef}
                className="min-h-11"
                inert={signingIn}
              />
            )}
            <Button
              id={trackingId('login', 'button', 'facebook')}
              type="button"
              variant="secondary"
              className="relative min-h-10 max-w-full justify-center rounded-full px-12 text-sm font-medium"
              style={{ width: PROVIDER_BUTTON_WIDTH }}
              disabled={signingIn || !facebookAppId}
              aria-describedby={facebookAppId ? undefined : `${id}-facebook-soon`}
              onClick={() => {
                if (facebookAppId) {
                  void signIn('facebook', async (session) =>
                    session.backend.signInWithFacebook(
                      await depsRef.current.facebookLogin(facebookAppId, lang),
                    ),
                  );
                }
              }}
            >
              <Image
                src={facebookIcon.src}
                alt=""
                aria-hidden="true"
                fit="contain"
                lazy={false}
                width={20}
                height={20}
                className="absolute top-1/2 left-3 size-5 -translate-y-1/2"
              />
              {labels['continue-with-facebook']}
            </Button>
            {!facebookAppId && (
              <RichText
                id={`${id}-facebook-soon`}
                variant="p4"
                className="text-[var(--text-secondary)]"
              >
                {labels['facebook-soon']}
              </RichText>
            )}
          </div>
          {signingIn && (
            <RichText role="status">
              {view.slow ? labels['waking-up'] : labels['signing-in']}
            </RichText>
          )}
          <RichText variant="p3" className="text-[var(--text-secondary)]">
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
          </RichText>
        </div>
      );
    }
  }
};
