import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTranslations } from '@i18n';
import type { AccountSession, AdminUser } from '@services/account';
import { createFakeAccountBackend, TEST_USER } from '@test/fake-account-backend';
import { HttpError } from '@utils';
import { AdminPanel } from '../AdminPanel';

const labels = getTranslations('en', 'admin-page');

const ADMIN = { ...TEST_USER, id: 'admin-1', role: 'admin' as const };
const COOK: AdminUser = {
  id: 'user-2',
  name: 'Bruno Chef',
  email: 'bruno@example.com',
  role: 'user',
  createdAt: '2026-09-20T10:00:00.000Z',
};

const setup = (me: typeof ADMIN | null, users: AdminUser[] = []) => {
  const backend = createFakeAccountBackend({
    user: me,
    users: [
      {
        id: ADMIN.id,
        name: ADMIN.name,
        email: ADMIN.email,
        role: 'admin',
        createdAt: '2026-09-01T00:00:00.000Z',
      },
      ...users.map((user) => ({ ...user })),
    ],
    roleChanges: [
      {
        id: 'change-1',
        userEmail: ADMIN.email,
        changedByEmail: null,
        fromRole: 'user',
        toRole: 'admin',
        reason: 'bootstrap',
        createdAt: '2026-09-27T09:00:00.000Z',
      },
    ],
  });
  const session = { backend } as unknown as AccountSession;
  render(
    <AdminPanel lang="en" labels={labels} loginHref="/en/login" loadSession={() => session} />,
  );

  return { backend, user: userEvent.setup() };
};

describe('AdminPanel', () => {
  it('should explain when accounts are not configured', async () => {
    render(<AdminPanel lang="en" labels={labels} loginHref="/en/login" loadSession={() => null} />);
    expect(await screen.findByText(labels.unavailable)).toBeInTheDocument();
  });

  it('should ask signed-out people to sign in', async () => {
    setup(null);
    expect(await screen.findByRole('link', { name: labels['sign-in'] })).toHaveAttribute(
      'href',
      '/en/login',
    );
  });

  it('should keep regular accounts out', async () => {
    setup({ ...ADMIN, role: 'user' as never });
    expect(await screen.findByText(labels.forbidden)).toBeInTheDocument();
    expect(screen.queryByText(labels.users.title)).not.toBeInTheDocument();
  });

  it('should show editors the content section only', async () => {
    setup({ ...ADMIN, role: 'editor' as never });
    expect(await screen.findByText(labels.content.title)).toBeInTheDocument();
    expect(screen.queryByText(labels.users.title)).not.toBeInTheDocument();
  });

  it('should offer a retry when loading fails', async () => {
    const { backend, user } = setup(ADMIN);
    vi.mocked(backend.fetchMe).mockRejectedValueOnce(new Error('offline'));
    await user.click(await screen.findByRole('button', { name: labels.retry }));
    expect(await screen.findByText(labels.content.title)).toBeInTheDocument();
  });

  it('should let admins search, change a role after confirming it and see the log', async () => {
    const { backend, user } = setup(ADMIN, [COOK]);

    const table = await screen.findByRole('table', { name: labels.users.title });
    expect(within(table).getByText(`${ADMIN.name} ${labels.users.you}`)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Role of Ada Cook/ })).toBeDisabled();
    expect(screen.getByText(/initial assignment/)).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: labels.users['search-label'] }), 'bruno');
    await user.click(screen.getByRole('button', { name: labels.users.search }));
    expect(backend.listUsers).toHaveBeenLastCalledWith('bruno', 1);

    await user.click(await screen.findByRole('combobox', { name: /Role of Bruno Chef/ }));
    await user.click(screen.getByRole('option', { name: labels.roles.editor }));
    const dialog = screen.getByRole('dialog', { name: labels.confirm.title });
    expect(dialog).toHaveTextContent('Change Bruno Chef’s role from User to Editor?');

    await user.click(within(dialog).getByRole('button', { name: labels.confirm.confirm }));
    expect(backend.setUserRole).toHaveBeenCalledWith('user-2', 'editor');
    expect(await screen.findByText('Done: Bruno Chef is now Editor.')).toBeInTheDocument();
  });

  it('should explain the API rules when a change is refused', async () => {
    const { backend, user } = setup(ADMIN, [COOK]);
    vi.mocked(backend.setUserRole)
      .mockRejectedValueOnce(new HttpError(409, 'Conflict'))
      .mockRejectedValueOnce(new HttpError(400, 'Bad request'))
      .mockRejectedValueOnce(new HttpError(403, 'Forbidden'))
      .mockRejectedValueOnce(new Error('offline'));

    for (const message of [
      labels.results['last-admin'],
      labels.results.self,
      labels.results.forbidden,
      labels.results.error,
    ]) {
      await user.click(await screen.findByRole('combobox', { name: /Role of Bruno Chef/ }));
      await user.click(screen.getByRole('option', { name: labels.roles.admin }));
      await user.click(screen.getByRole('button', { name: labels.confirm.confirm }));
      expect(await screen.findByText(message)).toBeInTheDocument();
    }
  });

  it('should cancel a change without calling the API', async () => {
    const { backend, user } = setup(ADMIN, [COOK]);
    await user.click(await screen.findByRole('combobox', { name: /Role of Bruno Chef/ }));
    await user.click(screen.getByRole('option', { name: labels.roles.editor }));
    const dialog = await screen.findByRole('dialog', { name: labels.confirm.title });
    await user.click(within(dialog).getByRole('button', { name: labels.confirm.cancel }));
    expect(backend.setUserRole).not.toHaveBeenCalled();
  });

  it('should page through long lists', async () => {
    const { backend, user } = setup(ADMIN);
    vi.mocked(backend.listUsers).mockImplementation(async (_search, page) => ({
      items: [{ ...COOK, id: `user-${page}` }],
      total: 45,
      page,
      pageSize: 20,
    }));
    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: labels.users.next }));
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: labels.users.previous }));
    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('should say when no account matches and when the log is empty', async () => {
    const { backend } = setup(ADMIN);
    vi.mocked(backend.listUsers).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    vi.mocked(backend.listRoleChanges).mockResolvedValue([]);
    const { user } = { user: userEvent.setup() };
    await user.click(await screen.findByRole('button', { name: labels.users.search }));
    expect(await screen.findByText(labels.users.empty)).toBeInTheDocument();
    expect(await screen.findByText(labels.log.empty)).toBeInTheDocument();
  });
});
