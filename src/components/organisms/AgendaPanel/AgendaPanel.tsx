import { useEffect, useId, useState, type SyntheticEvent } from 'react';
import { Button, Dropdown, Input, Modal, RichText, Textarea } from '@inzumer/ui-library';
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
import {
  groupByDate,
  HttpError,
  interpolate,
  monthOf,
  monthRange,
  shiftMonth,
  toIsoDate,
  trackingId,
  type CalendarMonth,
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

/**
 * Shared publishing agenda for editors and admins, one month at a time: plan, edit and remove
 * publications (recipes, reviews, guides, articles, social posts). The API checks the role on
 * every change.
 */
export const AgendaPanel = ({
  lang,
  labels,
  accessLabels,
  loginHref,
  loadSession = getAccountSession,
  today: todayProp,
}: AgendaPanelProps) => {
  const [today] = useState(() => todayProp ?? new Date());
  const { access, retry } = useAdminAccess(loadSession);
  const [month, setMonth] = useState<CalendarMonth>(() => monthOf(today));
  const [entries, setEntries] = useState<AgendaEntry[]>([]);
  const [reloads, setReloads] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<AgendaEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const cadenceId = useId();
  const monthId = useId();
  const formId = useId();
  const locale = lang === 'es' ? 'es-AR' : 'en-US';
  const session = access.kind === 'ready' ? access.session : null;

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(month.year, month.month, 1));
  const dayLabel = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));

  useEffect(() => {
    if (!session) {
      return undefined;
    }
    let active = true;
    const { from, to } = monthRange(month);
    session.backend.listAgenda(from, to).then(
      (items) => {
        if (active) {
          setEntries(items);
        }
      },
      () => {
        if (active) {
          setNotice(labels.results.error);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [session, month, reloads, labels.results.error]);

  const reload = () => setReloads((count) => count + 1);

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
    setBusy(true);
    try {
      const input = { ...values, notes: values.notes?.trim() || null };
      const saved = draft.id
        ? await session.backend.updateAgendaEntry(draft.id, input)
        : await session.backend.createAgendaEntry(input);
      setDraft(null);
      setNotice(labels.results.saved);
      setMonth(monthOf(new Date(`${saved.date}T12:00:00`)));
      reload();
    } catch (error) {
      failWith(error);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!session || !deleting) {
      return;
    }
    setBusy(true);
    try {
      await session.backend.deleteAgendaEntry(deleting.id);
      setNotice(labels.results.deleted);
      reload();
    } catch (error) {
      failWith(error);
    } finally {
      setBusy(false);
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

      <section aria-labelledby={monthId} className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              id={trackingId('agenda', 'button', 'previous-month')}
              type="button"
              variant="secondary"
              className="min-h-11"
              aria-label={labels.month.previous}
              onClick={() => setMonth((current) => shiftMonth(current, -1))}
            >
              ‹
            </Button>
            <RichText
              id={monthId}
              variant="h2"
              aria-live="polite"
              className="min-w-44 text-center text-2xl capitalize"
            >
              {monthLabel}
            </RichText>
            <Button
              id={trackingId('agenda', 'button', 'next-month')}
              type="button"
              variant="secondary"
              className="min-h-11"
              aria-label={labels.month.next}
              onClick={() => setMonth((current) => shiftMonth(current, 1))}
            >
              ›
            </Button>
            <Button
              id={trackingId('agenda', 'button', 'today')}
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={() => setMonth(monthOf(today))}
            >
              {labels.month.today}
            </Button>
          </div>
          <Button
            id={trackingId('agenda', 'button', 'add')}
            type="button"
            className="min-h-11"
            onClick={openNew}
          >
            {labels.add}
          </Button>
        </div>

        <RichText role="status" variant="p3" className="min-h-6">
          {notice}
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
              disabled={busy}
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
              disabled={busy}
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
