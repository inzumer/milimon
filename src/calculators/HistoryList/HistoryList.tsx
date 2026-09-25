import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@inzumer/ui-library';
import { SavedCalculation } from '@calculators/SavedCalculation';
import { formatValue } from '@calculators/shared/format-value';
import { isFormulaId, type ValueKind } from '@domain/registry';
import type { CalculatorText } from '@i18n/formula-text';
import { loadCalculatorText, type CalculatorTextLoader } from '@i18n/load-calculator-text';
import type { Translations } from '@i18n/translations';
import {
  createLocalCalculationsRepository,
  createLocalHistoryRepository,
  HISTORY_LIMIT,
  onHistoryChange,
  type CalculationsRepository,
  type HistoryEntry,
  type HistoryRepository,
} from '@repositories';
import { interpolate, track, type Locale } from '@utils';

export interface HistoryListProps {
  lang: Locale;
  labels: Translations<'history-page'>['list'];
  ui: Translations<'calculator'>;
  /** Formula titles and output labels, resolved on the server (the list shows them all at once). */
  formulas: Record<string, { title: string; outputs: Record<string, string> }>;
  calculatorHref: string;
  /** Account page, when accounts are enabled (shown as a hint to guests). */
  accountHref?: string | undefined;
  /** Injected in tests; default to the localStorage repositories. */
  repository?: HistoryRepository;
  calculations?: CalculationsRepository;
  loadText?: CalculatorTextLoader;
}

type Texts = Record<string, CalculatorText | 'loading' | 'error'>;

const UNITS = ['weight', 'area', 'months'] as const;

/** Saved calculations, newest first: summary, the whole calculation on demand, reopen or delete. */
export const HistoryList = ({
  lang,
  labels,
  ui,
  formulas,
  calculatorHref,
  accountHref,
  repository = createLocalHistoryRepository(),
  calculations = createLocalCalculationsRepository(),
  loadText = loadCalculatorText,
}: HistoryListProps) => {
  const id = useId();
  const historyRef = useRef(repository);
  const calculationsRef = useRef(calculations);
  const loadTextRef = useRef(loadText);
  // `null` until hydrated: the server can't know what this browser saved.
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [texts, setTexts] = useState<Texts>({});
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setEntries(historyRef.current.list());
    return onHistoryChange(() => setEntries(historyRef.current.list()));
  }, []);

  const dateFormat = new Intl.DateTimeFormat(lang === 'es' ? 'es-AR' : 'en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const toggle = (entry: HistoryEntry) => {
    const next = new Set(expanded);
    if (next.has(entry.id)) {
      next.delete(entry.id);
    } else {
      next.add(entry.id);
      const formulaId = entry.formulaId;
      if (!texts[formulaId] && isFormulaId(formulaId)) {
        setTexts((current) => ({ ...current, [formulaId]: 'loading' }));
        loadTextRef
          .current(lang, formulaId)
          .then((text) => setTexts((current) => ({ ...current, [formulaId]: text })))
          .catch(() => setTexts((current) => ({ ...current, [formulaId]: 'error' })));
      }
    }
    setExpanded(next);
  };

  const open = (entry: HistoryEntry) => {
    calculationsRef.current.saveDraft(entry.formulaId, entry.draft);
    track('history_opened', { formula: entry.formulaId });
    window.location.assign(`${calculatorHref}?tool=${encodeURIComponent(entry.formulaId)}`);
  };

  const remove = (entry: HistoryEntry) => {
    historyRef.current.remove(entry.id);
    setNotice(labels.deleted);
    track('history_deleted', { formula: entry.formulaId });
  };

  const headline = (entry: HistoryEntry) => {
    const main = entry.headline;
    if (!main) {
      return null;
    }
    const kind = main.kind as ValueKind;
    const unit = UNITS.find((item) => item === kind);
    const formatted = formatValue(main.value, kind, { lang, currency: entry.currency });
    const label = formulas[entry.formulaId]?.outputs[main.output];
    return (
      <p className="flex flex-wrap items-baseline gap-x-2">
        {label && <span className="text-[var(--text-secondary)]">{label}:</span>}
        <strong className="text-xl tabular-nums">
          {unit ? `${formatted} ${ui.units[unit]}` : formatted}
        </strong>
      </p>
    );
  };

  if (entries === null) {
    return <p aria-busy="true">{labels.loading}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <p role="status" className={notice ? 'rounded-lg bg-[var(--surface-secondary)] p-3' : ''}>
        {notice}
      </p>
      {entries.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p>{labels.empty}</p>
          <a href={calculatorHref} className="font-semibold text-[var(--text-link)] underline">
            {labels['go-to-calculator']}
          </a>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--text-secondary)]">
            {interpolate(labels.count, { count: entries.length, limit: HISTORY_LIMIT })}
          </p>
          <ol className="flex flex-col gap-4">
            {entries.map((entry) => {
              const title = formulas[entry.formulaId]?.title ?? entry.formulaId;
              const date = dateFormat.format(new Date(entry.savedAt));
              const detailId = `${id}-${entry.id}`;
              const isOpen = expanded.has(entry.id);
              const text = texts[entry.formulaId];
              return (
                <li key={entry.id}>
                  <article
                    aria-labelledby={`${detailId}-title`}
                    className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-4"
                  >
                    <h2 id={`${detailId}-title`} className="text-2xl">
                      {title}
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {interpolate(labels['saved-on'], { date })}
                    </p>
                    {headline(entry)}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-11"
                        aria-expanded={isOpen}
                        aria-controls={detailId}
                        onClick={() => toggle(entry)}
                      >
                        {isOpen ? labels.hide : labels.show}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11"
                        onClick={() => open(entry)}
                      >
                        {labels.open}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11"
                        aria-label={interpolate(labels['delete-label'], { title, date })}
                        onClick={() => remove(entry)}
                      >
                        {labels.delete}
                      </Button>
                    </div>
                    <div id={detailId} hidden={!isOpen}>
                      {isOpen &&
                        (text === 'error' ? (
                          <p role="alert">{labels.unavailable}</p>
                        ) : text && text !== 'loading' ? (
                          <div className="rounded-xl bg-[var(--surface-secondary)] p-4">
                            <SavedCalculation
                              entry={entry}
                              lang={lang}
                              text={text}
                              ui={ui}
                              labels={labels}
                            />
                          </div>
                        ) : (
                          <p aria-busy="true">{labels.loading}</p>
                        ))}
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </>
      )}
      {accountHref && (
        <p className="text-sm text-[var(--text-secondary)]">
          {labels['account-hint']}{' '}
          <a href={accountHref} className="font-semibold text-[var(--text-link)] underline">
            {labels['sign-in']}
          </a>
        </p>
      )}
    </div>
  );
};
