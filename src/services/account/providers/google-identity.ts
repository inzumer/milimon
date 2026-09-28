import { GOOGLE_IDENTITY_SCRIPT_URL, PROVIDER_LOCALES } from '@constants';
import { loadScript, type Locale } from '@utils';

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
        ux_mode?: 'popup';
        auto_select?: boolean;
        use_fedcm_for_prompt?: boolean;
      }) => void;
      renderButton: (element: HTMLElement, options: Record<string, string | number>) => void;
      disableAutoSelect: () => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

export interface GoogleButtonOptions {
  clientId: string;
  lang: Locale;
  width: number;
  theme: 'light' | 'dark';
  onCredential: (credential: string) => void;
}

/** Renders Google’s own button; its ID token (`credential`) is verified by the API. */
export const renderGoogleButton = async (
  container: HTMLElement,
  { clientId, lang, width, theme, onCredential }: GoogleButtonOptions,
): Promise<void> => {
  await loadScript(`${GOOGLE_IDENTITY_SCRIPT_URL}?hl=${PROVIDER_LOCALES[lang].google}`);
  const identity = window.google?.accounts.id;
  if (!identity) {
    throw new Error('Google Identity Services is not available');
  }
  identity.initialize({
    client_id: clientId,
    ux_mode: 'popup',
    auto_select: false,
    callback: ({ credential }) => {
      if (credential) {
        onCredential(credential);
      }
    },
  });
  identity.renderButton(container, {
    type: 'standard',
    theme: theme === 'dark' ? 'filled_black' : 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    logo_alignment: 'left',
    width,
    locale: PROVIDER_LOCALES[lang].google,
  });
};

/** After signing out, don't let Google sign the person back in automatically. */
export const disableGoogleAutoSelect = (): void => {
  window.google?.accounts.id.disableAutoSelect();
};
