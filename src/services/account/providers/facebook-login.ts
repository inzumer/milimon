import {
  FACEBOOK_API_VERSION,
  FACEBOOK_LOGIN_SCOPE,
  FACEBOOK_SDK_URL,
  PROVIDER_LOCALES,
} from '@constants';
import { loadScript, type Locale } from '@utils';

interface FacebookSdk {
  init: (options: { appId: string; version: string; xfbml: boolean; cookie: boolean }) => void;
  login: (
    callback: (response: {
      status?: string;
      authResponse?: { accessToken?: string } | null;
    }) => void,
    options: { scope: string; auth_type?: string },
  ) => void;
}

declare global {
  interface Window {
    FB?: FacebookSdk;
  }
}

/** The person closed Facebook's dialog or didn't authorize the app. */
export class FacebookLoginCancelledError extends Error {
  constructor() {
    super('Facebook login was cancelled');
    this.name = 'FacebookLoginCancelledError';
  }
}

const initialized = new Set<string>();

/** Facebook Login from a click (popup); resolves with the token the API verifies. */
export const loginWithFacebook = async (appId: string, lang: Locale): Promise<string> => {
  await loadScript(FACEBOOK_SDK_URL.replace('{locale}', PROVIDER_LOCALES[lang].facebook));
  const sdk = window.FB;
  if (!sdk) {
    throw new Error('Facebook SDK is not available');
  }

  if (!initialized.has(appId)) {
    sdk.init({ appId, version: FACEBOOK_API_VERSION, xfbml: false, cookie: false });
    initialized.add(appId);
  }

  return new Promise<string>((resolve, reject) => {
    sdk.login(
      (response) => {
        const token = response.authResponse?.accessToken;
        if (response.status === 'connected' && token) {
          resolve(token);
        } else {
          reject(new FacebookLoginCancelledError());
        }
      },
      { scope: FACEBOOK_LOGIN_SCOPE, auth_type: 'rerequest' },
    );
  });
};
