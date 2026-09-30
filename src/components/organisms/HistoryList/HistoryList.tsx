import { useId, useRef, useState } from 'react';
import { Button, RichText } from '@inzumer/ui-library';
import { BrandLoader } from '@components/atoms/BrandLoader';
import { SavedCalculation } from '@components/organisms/SavedCalculation';
import { HISTORY_LIMIT } from '@constants';
import { useHydrated } from '@hooks';
import type { CalculatorText } from '@i18n/formula-text';
import { loadCalculatorText, type CalculatorTextLoader } from '@i18n/load-calculator-text';
import type { Translations } from '@i18n/translations';
import { useDraftsStore, useHistoryStore, type HistoryEntry } from '@stores';
import { interpolate, track, trackingId, type Locale } from '@utils';
import { formatValue } from '@utils/format-value';
import { isFormulaId, type ValueKind } from '@utils/formulas';

export interface HistoryListProps {
  lang: Locale;
  labels: Translations<'history-page'>['list'];
  ui: Translations<'calculator'>;
  formulas: Record<string, { title: string; outputs: Record<string, string> }>;
  calculatorHref: string;
  accountHref?: string | undefined;
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
  loadText = loadCalculatorText,
}: HistoryListProps) => {
  const id = useId();
  const loadTextRef = useRef(loadText);
  const stored = useHistoryStore((state) => state.entries);
  const entries = useHydrated() ? stored : null;
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [texts, setTexts] = useState<Texts>({});
  const [notice, setNotice] = useState('');

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
    useDraftsStore.getState().saveDraft(entry.formulaId, entry.draft);
    track('history_opened', { formula: entry.formulaId });
    window.location.assign(`${calculatorHref}?tool=${encodeURIComponent(entry.formulaId)}`);
  };

  const remove = (entry: HistoryEntry) => {
    useHistoryStore.getState().remove(entry.id);
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
      <RichText className="flex flex-wrap items-baseline gap-x-2">
        {label && (
          <RichText variant="s2" className="text-[var(--text-secondary)]">
            {label}:
          </RichText>
        )}
        <strong className="text-xl tabular-nums">
          {unit ? `${formatted} ${ui.units[unit]}` : formatted}
        </strong>
      </RichText>
    );
  };

  if (entries === null) {
    return <BrandLoader screen label={labels.loading} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <RichText
        role="status"
        className={notice ? 'rounded-lg bg-[var(--surface-secondary)] p-3' : ''}
      >
        {notice}
      </RichText>
      {entries.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <RichText>{labels.empty}</RichText>
          <a
            id={trackingId('history', 'link', 'go-to-calculator')}
            href={calculatorHref}
            className="font-semibold text-[var(--text-link)] underline"
          >
            {labels['go-to-calculator']}
          </a>
        </div>
      ) : (
        <>
          <RichText variant="p3" className="text-[var(--text-secondary)]">
            {interpolate(labels.count, { count: entries.length, limit: HISTORY_LIMIT })}
          </RichText>
          <ol className="flex flex-col gap-4">
            {entries.map((entry, index) => {
              const position = index + 1;
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
                    <RichText
                      variant="h2"
                      bold
                      id={`${detailId}-title`}
                      className="font-display text-2xl"
                    >
                      {title}
                    </RichText>
                    <RichText variant="p3" className="text-[var(--text-secondary)]">
                      {interpolate(labels['saved-on'], { date })}
                    </RichText>
                    {headline(entry)}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        id={trackingId('history', 'button', 'show', position)}
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
                        id={trackingId('history', 'button', 'open', position)}
                        type="button"
                        variant="ghost"
                        className="min-h-11"
                        onClick={() => open(entry)}
                      >
                        {labels.open}
                      </Button>
                      <Button
                        id={trackingId('history', 'button', 'delete', position)}
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
                          <RichText role="alert">{labels.unavailable}</RichText>
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
                          <BrandLoader label={labels.loading} showLabel mark="star" size="sm" />
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
        <RichText variant="p3" className="text-[var(--text-secondary)]">
          {labels['account-hint']}{' '}
          <a
            id={trackingId('history', 'link', 'sign-in')}
            href={accountHref}
            className="font-semibold text-[var(--text-link)] underline"
          >
            {labels['sign-in']}
          </a>
        </RichText>
      )}
    </div>
  );
};
