import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTranslations } from '@i18n';
import type { AccountSession, AgendaEntry } from '@services/account';
import { createFakeAccountBackend, TEST_USER } from '@test/fake-account-backend';
import { HttpError } from '@utils';
import { AgendaPanel } from '../AgendaPanel';

const labels = getTranslations('en', 'agenda-page');
const accessLabels = getTranslations('en', 'admin-page');
const TODAY = new Date(2026, 9, 2, 10);

const LOAF: AgendaEntry = {
  id: 'entry-1',
  date: '2026-10-06',
  kind: 'recipe',
  status: 'planned',
  title: "The café's lemon loaf",
  notes: 'Photos on Sunday',
  updatedByEmail: 'ada@example.com',
  updatedAt: '2026-09-27T12:00:00.000Z',
};

const setup = (role: 'user' | 'editor' | null, agenda: AgendaEntry[] = [], today = TODAY) => {
  const backend = createFakeAccountBackend({
    user: role ? { ...TEST_USER, role } : null,
    agenda: agenda.map((entry) => ({ ...entry })),
  });
  const session = { backend } as unknown as AccountSession;
  render(
    <AgendaPanel
      lang="en"
      labels={labels}
      accessLabels={accessLabels}
      loginHref="/en/login"
      loadSession={() => session}
      today={today}
    />,
  );

  return { backend, user: userEvent.setup() };
};

describe('AgendaPanel', () => {
  it('should keep regular accounts out', async () => {
    setup('user');
    expect(await screen.findByText(accessLabels.forbidden)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: labels.add })).not.toBeInTheDocument();
  });

  it('should ask signed-out people to sign in', async () => {
    setup(null);
    expect(await screen.findByRole('link', { name: accessLabels['sign-in'] })).toHaveAttribute(
      'href',
      '/en/login',
    );
  });

  it('should list the upcoming publications by day, with the suggested pace', async () => {
    const { backend } = setup('editor', [LOAF]);

    expect(await screen.findByText(LOAF.title)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: labels.upcoming })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tuesday, October 6' })).toBeInTheDocument();
    expect(screen.getByText('Photos on Sunday')).toBeInTheDocument();
    expect(screen.getByText('Last change: ada@example.com')).toBeInTheDocument();
    expect(screen.getByText(labels.cadence.items[0] ?? '')).toBeInTheDocument();
    expect(backend.listAgenda).toHaveBeenCalledWith('2026-10-02', '2027-03-31');
    expect(screen.queryByRole('button', { name: /month/i })).not.toBeInTheDocument();
  });

  it('should say when approved changes reach staging and the next stable release', async () => {
    setup('editor', [], new Date('2026-09-29T08:00:00Z'));
    await screen.findByText(labels.empty);
    expect(screen.getByText(labels.release.staging)).toBeInTheDocument();
    expect(
      screen.getByText(/Friday, October 2 .*12:00.*Monday, October 5 .*12:30/),
    ).toBeInTheDocument();
  });

  it('should plan a new publication, asking for a title first', async () => {
    const { backend, user } = setup('editor');
    await user.click(await screen.findByRole('button', { name: labels.add }));

    const dialog = await screen.findByRole('dialog', { name: labels.form['create-title'] });
    expect(within(dialog).getByLabelText(labels.form.date)).toHaveValue('2026-10-02');
    await user.click(within(dialog).getByRole('button', { name: labels.form.save }));
    expect(within(dialog).getByText(labels.form['title-required'])).toBeInTheDocument();
    expect(backend.createAgendaEntry).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText(labels.form.title), '  Carrot cake ');
    await user.click(within(dialog).getByRole('combobox', { name: labels.form.kind }));
    await user.click(screen.getByRole('option', { name: labels.kinds.review }));
    await user.click(within(dialog).getByRole('button', { name: labels.form.save }));

    expect(await screen.findByText(labels.results.saved)).toBeInTheDocument();
    expect(backend.createAgendaEntry).toHaveBeenCalledWith({
      date: '2026-10-02',
      kind: 'review',
      status: 'planned',
      title: 'Carrot cake',
      notes: null,
    });
    expect(await screen.findByText('Carrot cake')).toBeInTheDocument();
  });

  it('should ask for a date', async () => {
    const { backend, user } = setup('editor');
    await user.click(await screen.findByRole('button', { name: labels.add }));
    const dialog = await screen.findByRole('dialog', { name: labels.form['create-title'] });

    await user.clear(within(dialog).getByLabelText(labels.form.date));
    await user.type(within(dialog).getByLabelText(labels.form.title), 'Scones');
    await user.click(within(dialog).getByRole('button', { name: labels.form.save }));

    expect(within(dialog).getByText(labels.form['date-required'])).toBeInTheDocument();
    expect(backend.createAgendaEntry).not.toHaveBeenCalled();
  });

  it('should edit a publication', async () => {
    const { backend, user } = setup('editor', [LOAF]);
    await user.click(await screen.findByRole('button', { name: `Edit ${LOAF.title}` }));
    const dialog = await screen.findByRole('dialog', { name: labels.form['edit-title'] });
    expect(within(dialog).getByLabelText(labels.form.title)).toHaveValue(LOAF.title);

    await user.click(within(dialog).getByRole('combobox', { name: labels.form.status }));
    await user.click(screen.getByRole('option', { name: labels.statuses.published }));
    await user.clear(within(dialog).getByLabelText(labels.form.notes));
    await user.click(within(dialog).getByRole('button', { name: labels.form.save }));

    await waitFor(() =>
      expect(backend.updateAgendaEntry).toHaveBeenCalledWith('entry-1', {
        date: LOAF.date,
        kind: 'recipe',
        status: 'published',
        title: LOAF.title,
        notes: null,
      }),
    );
    expect(await screen.findByText(labels.statuses.published)).toBeInTheDocument();
  });

  it('should delete a publication after confirming', async () => {
    const { backend, user } = setup('editor', [LOAF]);
    await user.click(await screen.findByRole('button', { name: `Delete ${LOAF.title}` }));
    const dialog = await screen.findByRole('dialog', { name: labels.confirm.title });
    await user.click(within(dialog).getByRole('button', { name: labels.confirm.confirm }));

    expect(await screen.findByText(labels.results.deleted)).toBeInTheDocument();
    expect(backend.deleteAgendaEntry).toHaveBeenCalledWith('entry-1');
    expect(await screen.findByText(labels.empty)).toBeInTheDocument();
  });

  it('should explain when the role was taken away meanwhile', async () => {
    const { backend, user } = setup('editor', [LOAF]);
    vi.mocked(backend.deleteAgendaEntry).mockRejectedValueOnce(new HttpError(403, 'Forbidden'));
    await user.click(await screen.findByRole('button', { name: `Delete ${LOAF.title}` }));
    const dialog = await screen.findByRole('dialog', { name: labels.confirm.title });
    await user.click(within(dialog).getByRole('button', { name: labels.confirm.confirm }));

    expect(await screen.findByText(labels.results.forbidden)).toBeInTheDocument();
  });

  it('should report a failure to load the month', async () => {
    const backend = createFakeAccountBackend({ user: { ...TEST_USER, role: 'admin' } });
    vi.mocked(backend.listAgenda).mockRejectedValue(new Error('offline'));
    render(
      <AgendaPanel
        lang="es"
        labels={getTranslations('es', 'agenda-page')}
        accessLabels={getTranslations('es', 'admin-page')}
        loginHref="/es/login"
        loadSession={() => ({ backend }) as unknown as AccountSession}
        today={TODAY}
      />,
    );
    expect(
      await screen.findByText(getTranslations('es', 'agenda-page').results.error),
    ).toBeInTheDocument();
  });
});
