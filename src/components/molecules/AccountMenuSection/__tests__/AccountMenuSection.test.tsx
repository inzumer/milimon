import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AccountSession } from '@services/account';
import { createSessionStore } from '@services/account';
import { TEST_USER } from '@test/fake-account-backend';
import { createMemoryStorage } from '@test/memory-storage';
import { setAnalyticsSink } from '@utils';
import { AccountMenuSection } from '../AccountMenuSection';

const labels = {
  title: 'Your account',
  signedInAs: 'Signed in as',
  signIn: 'Sign in',
  signOut: 'Sign out',
  account: 'My account',
  admin: 'Administration',
  signedOutHint: 'Keep your settings in your account.',
};

const SESSION = {
  accessToken: 'a',
  refreshToken: 'r',
  expiresAt: Date.now() + 60_000,
  user: TEST_USER,
};

const setup = (signedIn: boolean, loadSession: () => AccountSession | null = () => null) => {
  const store = createSessionStore(createMemoryStorage());
  if (signedIn) {
    store.write(SESSION);
  }
  render(
    <AccountMenuSection
      labels={labels}
      loginHref="/en/login"
      accountHref="/en/account"
      adminHref="/en/admin"
      store={store}
      loadSession={loadSession}
    />,
  );
  return { store, user: userEvent.setup() };
};

describe('AccountMenuSection', () => {
  afterEach(() => {
    setAnalyticsSink(null);
  });

  it('should invite signed-out people to sign in', () => {
    setup(false);
    expect(screen.getByText(labels.signedOutHint)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: labels.signIn })).toHaveAttribute('href', '/en/login');
  });

  it('should show who is signed in, link to the account and sign out', async () => {
    const signOut = vi.fn(async () => undefined);
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const { store, user } = setup(true, () => ({ sync: { signOut } }) as unknown as AccountSession);

    expect(screen.getByText('Ada Cook')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: labels.account })).toHaveAttribute(
      'href',
      '/en/account',
    );

    await user.click(screen.getByRole('button', { name: labels.signOut }));
    expect(signOut).toHaveBeenCalledOnce();
    expect(sink).toHaveBeenCalledWith('sign_out', {});

    act(() => store.clear());
    expect(screen.getByRole('link', { name: labels.signIn })).toBeInTheDocument();
  });

  it('should clear the local session when accounts are not configured', async () => {
    const { store, user } = setup(true);
    await user.click(screen.getByRole('button', { name: labels.signOut }));
    expect(store.read()).toBeNull();
    expect(await screen.findByRole('link', { name: labels.signIn })).toBeInTheDocument();
  });

  it('should fall back to the email when there is no name', () => {
    const store = createSessionStore(createMemoryStorage());
    store.write({ ...SESSION, user: { ...TEST_USER, name: null } });
    render(
      <AccountMenuSection
        labels={labels}
        loginHref="/l"
        accountHref="/a"
        adminHref="/adm"
        store={store}
        loadSession={() => null}
      />,
    );
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  });

  it('should show the administration link only to editors and admins', () => {
    for (const [role, visible] of [
      ['user', false],
      ['editor', true],
      ['admin', true],
    ] as const) {
      const store = createSessionStore(createMemoryStorage());
      store.write({ ...SESSION, user: { ...TEST_USER, role } });
      const { unmount } = render(
        <AccountMenuSection
          labels={labels}
          loginHref="/en/login"
          accountHref="/en/account"
          adminHref="/en/admin"
          store={store}
          loadSession={() => null}
        />,
      );
      expect(screen.queryByRole('link', { name: labels.admin }) !== null).toBe(visible);
      unmount();
    }
  });
});
