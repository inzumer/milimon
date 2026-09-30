import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState, type SyntheticEvent } from 'react';
import { Button, Dropdown, Input, Modal, RichText, Textarea } from '@inzumer/ui-library';
import { BrandLoader } from '@components/atoms/BrandLoader';
import { QueryProvider } from '@components/atoms/QueryProvider';
import { SectionLabel } from '@components/atoms/SectionLabel';
import {
  AdminAccessNotice,
  type AdminAccessNoticeLabels,
} from '@components/molecules/AdminAccessNotice';
import {
  AGENDA_KINDS,
  AGENDA_NOTES_MAX_LENGTH,
  AGENDA_STATUSES,
  AGENDA_TITLE_MAX_LENGTH,
  AGENDA_UPCOMING_DAYS,
  RELEASE_TIME_ZONE,
  type AgendaKind,
  type AgendaStatus,
} from '@constants';
import { useAdminAccess } from '@hooks';
import type { Translations } from '@i18n/translations';
import {
  getAccountSession,
  type AccountSession,
  type AgendaEntry,
  type AgendaEntryInput,
} from '@services/account';
import { queryKeys } from '@services/query';
import {
  groupByDate,
  HttpError,
  interpolate,
  nextRelease,
  toIsoDate,
  trackingId,
  upcomingRange,
  type Locale,
} from '@utils';

export type AgendaPanelLabels = Translations<'agenda-page'>;

export interface AgendaPanelProps {
  lang: Locale;
  labels: AgendaPanelLabels;
  accessLabels: AdminAccessNoticeLabels;
  loginHref: string;
  loadSession?: () => AccountSession | null;
  /** Today's date (tests pin it). */
  today?: Date;
}

interface Draft {
  id: string | null;
  values: AgendaEntryInput;
  errors: { date?: string; title?: string };
}

const STATUS_STYLES: Record<AgendaStatus, string> = {
  planned: 'bg-[var(--surface-tertiary)] text-[var(--text-primary)]',
  'in-progress': 'bg-[rgb(var(--color-primary-200))] text-[rgb(var(--color-neutral-950))]',
  published: 'bg-[rgb(var(--color-accent-100))] text-[rgb(var(--color-accent-900))]',
};

const AgendaPanelView = ({
  lang,
  labels,
  accessLabels,
  loginHref,
  loadSession = getAccountSession,
  today: todayProp,
}: AgendaPanelProps) => {
  const [today] = useState(() => todayProp ?? new Date());
  const { access, retry } = useAdminAccess(loadSession);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<AgendaEntry | null>(null);
  const [notice, setNotice] = useState('');
  const cadenceId = useId();
  const upcomingId = useId();
  const releaseId = useId();
  const formId = useId();
  const locale = lang === 'es' ? 'es-AR' : 'en-US';
  const session = access.kind === 'ready' ? access.session : null;

  const release = nextRelease(today);
  const releaseDate = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: RELEASE_TIME_ZONE,
  });
  const dayLabel = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));

  const queryClient = useQueryClient();
  const backend = () => {
    if (!session) {
      throw new Error('No account session');
    }
    return session.backend;
  };
  const range = upcomingRange(today, AGENDA_UPCOMING_DAYS);
  const agenda = useQuery({
    queryKey: queryKeys.agenda(range.from, range.to),
    queryFn: () => backend().listAgenda(range.from, range.to),
    enabled: session !== null,
  });
  const entries = agenda.data ?? [];
  const onChanged = () => queryClient.invalidateQueries({ queryKey: queryKeys.agendaAll });
  const saveEntry = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: AgendaEntryInput }) =>
      id ? backend().updateAgendaEntry(id, input) : backend().createAgendaEntry(input),
    onSuccess: onChanged,
  });
  const removeEntry = useMutation({
    mutationFn: (id: string) => backend().deleteAgendaEntry(id),
    onSuccess: onChanged,
  });
  const busy = saveEntry.isPending || removeEntry.isPending;
  const shownNotice = notice || (agenda.isError ? labels.results.error : '');

  const failWith = (error: unknown) =>
    setNotice(
      error instanceof HttpError && error.status === 403
        ? labels.results.forbidden
        : labels.results.error,
    );

  const openNew = () =>
    setDraft({
      id: null,
      values: { date: toIsoDate(today), kind: 'recipe', status: 'planned', title: '', notes: '' },
      errors: {},
    });

  const openEdit = (entry: AgendaEntry) =>
    setDraft({
      id: entry.id,
      values: {
        date: entry.date,
        kind: entry.kind,
        status: entry.status,
        title: entry.title,
        notes: entry.notes ?? '',
      },
      errors: {},
    });

  const setValue = <K extends keyof AgendaEntryInput>(key: K, value: AgendaEntryInput[K]) =>
    setDraft((current) =>
      current ? { ...current, values: { ...current.values, [key]: value } } : current,
    );

  const save = async (event: SyntheticEvent) => {
    event.preventDefault();
    if (!session || !draft) {
      return;
    }
    const values = { ...draft.values, title: draft.values.title.trim() };
    const errors = {
      ...(values.date ? {} : { date: labels.form['date-required'] }),
      ...(values.title ? {} : { title: labels.form['title-required'] }),
    };
    if (errors.date || errors.title) {
      setDraft({ ...draft, errors });
      return;
    }
    try {
      const input = { ...values, notes: values.notes?.trim() || null };
      await saveEntry.mutateAsync({ id: draft.id, input });
      setDraft(null);
      setNotice(labels.results.saved);
    } catch (error) {
      failWith(error);
    }
  };

  const confirmDelete = async () => {
    if (!session || !deleting) {
      return;
    }
    try {
      await removeEntry.mutateAsync(deleting.id);
      setNotice(labels.results.deleted);
    } catch (error) {
      failWith(error);
    } finally {
      setDeleting(null);
    }
  };

  if (access.kind !== 'ready') {
    return (
      <AdminAccessNotice
        access={access}
        labels={accessLabels}
        loginHref={loginHref}
        onRetry={() => void retry()}
        scope="agenda"
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {busy && <BrandLoader screen />}
      <section
        aria-labelledby={cadenceId}
        className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] p-5"
      >
        <SectionLabel id={cadenceId}>{labels.cadence.title}</SectionLabel>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {labels.cadence.items.map((item) => (
            <li key={item}>
              <RichText as="span" variant="p3">
                {item}
              </RichText>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby={releaseId}
        className="flex flex-col gap-2 rounded-xl bg-[var(--surface-secondary)] p-5"
      >
        <SectionLabel id={releaseId}>{labels.release.title}</SectionLabel>
        <RichText variant="p3">{labels.release.staging}</RichText>
        <RichText variant="p3">
          {interpolate(labels.release.next, {
            cutoff: releaseDate.format(release.cutoff),
            publish: releaseDate.format(release.publish),
          })}
        </RichText>
      </section>

      <section aria-labelledby={upcomingId} className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RichText id={upcomingId} variant="h2" className="text-2xl">
            {labels.upcoming}
          </RichText>
          <Button
            id={trackingId('agenda', 'button', 'add')}
            type="button"
            className="min-h-11"
            onClick={openNew}
          >
            {labels.add}
          </Button>
        </div>

        <RichText variant="p3" className="text-[var(--text-secondary)]">
          {labels['cms-note']}
        </RichText>

        <RichText role="status" variant="p3" className="min-h-6">
          {shownNotice}
        </RichText>

        {entries.length === 0 ? (
          <RichText className="text-[var(--text-secondary)]">{labels.empty}</RichText>
        ) : (
          <ol className="flex flex-col gap-6">
            {groupByDate(entries).map(([date, items]) => (
              <li key={date} className="flex flex-col gap-3">
                <RichText as="h3" variant="s1" bold className="first-letter:uppercase">
                  {dayLabel(date)}
                </RichText>
                <ul className="flex flex-col gap-3">
                  {items.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-4"
                    >
                      <div className="flex flex-wrap gap-2">
                        <RichText
                          as="span"
                          variant="s4"
                          bold
                          className="rounded-full border border-[var(--border-strong)] px-2.5 py-0.5 uppercase"
                        >
                          {labels.kinds[entry.kind]}
                        </RichText>
                        <RichText
                          as="span"
                          variant="s4"
                          bold
                          className={`rounded-full px-2.5 py-0.5 uppercase ${STATUS_STYLES[entry.status]}`}
                        >
                          {labels.statuses[entry.status]}
                        </RichText>
                      </div>
                      <RichText variant="s1" bold>
                        {entry.title}
                      </RichText>
                      {entry.notes && (
                        <RichText variant="p3" className="whitespace-pre-line">
                          {entry.notes}
                        </RichText>
                      )}
                      {entry.updatedByEmail && (
                        <RichText variant="p4" className="text-[var(--text-secondary)]">
                          {interpolate(labels['updated-by'], { author: entry.updatedByEmail })}
                        </RichText>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          id={trackingId('agenda', 'button', 'edit', entry.id)}
                          type="button"
                          variant="secondary"
                          className="min-h-11"
                          aria-label={interpolate(labels['edit-label'], { title: entry.title })}
                          onClick={() => openEdit(entry)}
                        >
                          {labels.edit}
                        </Button>
                        <Button
                          id={trackingId('agenda', 'button', 'delete', entry.id)}
                          type="button"
                          variant="ghost"
                          className="min-h-11"
                          aria-label={interpolate(labels['delete-label'], { title: entry.title })}
                          onClick={() => setDeleting(entry)}
                        >
                          {labels.delete}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? labels.form['edit-title'] : labels.form['create-title']}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              id={trackingId('agenda', 'button', 'cancel')}
              type="button"
              variant="secondary"
              className="min-h-11"
              onClick={() => setDraft(null)}
            >
              {labels.form.cancel}
            </Button>
            <Button
              id={trackingId('agenda', 'button', 'save')}
              type="submit"
              form={formId}
              className="min-h-11"
              loading={busy}
            >
              {labels.form.save}
            </Button>
          </div>
        }
      >
        {draft && (
          <form id={formId} noValidate className="flex flex-col gap-4" onSubmit={save}>
            <Input
              id={trackingId('agenda', 'input', 'date')}
              type="date"
              label={labels.form.date}
              placeholder={labels.form['date-placeholder']}
              value={draft.values.date}
              {...(draft.errors.date ? { error: draft.errors.date } : {})}
              onChange={(event) => setValue('date', event.target.value)}
            />
            <Dropdown
              id={trackingId('agenda', 'select', 'kind')}
              label={labels.form.kind}
              inputSize="lg"
              value={draft.values.kind}
              options={AGENDA_KINDS.map((kind) => ({ value: kind, label: labels.kinds[kind] }))}
              onChange={(kind) => setValue('kind', kind as AgendaKind)}
            />
            <Dropdown
              id={trackingId('agenda', 'select', 'status')}
              label={labels.form.status}
              inputSize="lg"
              value={draft.values.status}
              options={AGENDA_STATUSES.map((status) => ({
                value: status,
                label: labels.statuses[status],
              }))}
              onChange={(status) => setValue('status', status as AgendaStatus)}
            />
            <Input
              id={trackingId('agenda', 'input', 'title')}
              label={labels.form.title}
              placeholder={labels.form['title-placeholder']}
              maxLength={AGENDA_TITLE_MAX_LENGTH}
              value={draft.values.title}
              {...(draft.errors.title ? { error: draft.errors.title } : {})}
              onChange={(event) => setValue('title', event.target.value)}
            />
            <Textarea
              id={trackingId('agenda', 'input', 'notes')}
              label={labels.form.notes}
              placeholder={labels.form['notes-placeholder']}
              maxLength={AGENDA_NOTES_MAX_LENGTH}
              rows={3}
              value={draft.values.notes ?? ''}
              onChange={(event) => setValue('notes', event.target.value)}
            />
          </form>
        )}
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={labels.confirm.title}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              id={trackingId('agenda', 'button', 'cancel-delete')}
              type="button"
              variant="secondary"
              className="min-h-11"
              onClick={() => setDeleting(null)}
            >
              {labels.confirm.cancel}
            </Button>
            <Button
              id={trackingId('agenda', 'button', 'confirm-delete')}
              type="button"
              className="min-h-11"
              loading={busy}
              onClick={() => void confirmDelete()}
            >
              {labels.confirm.confirm}
            </Button>
          </div>
        }
      >
        {deleting && (
          <RichText>{interpolate(labels.confirm.message, { title: deleting.title })}</RichText>
        )}
      </Modal>
    </div>
  );
};

/** Shared publishing agenda (upcoming entries) for editors and admins; the API checks every change. */
export const AgendaPanel = (props: AgendaPanelProps) => (
  <QueryProvider>
    <AgendaPanelView {...props} />
  </QueryProvider>
);
