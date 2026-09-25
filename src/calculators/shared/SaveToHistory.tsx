import { useRef, useState } from 'react';
import { Button } from '@inzumer/ui-library';
import type { FormulaId } from '@domain/registry';
import type { Step } from '@domain/shared';
import type { Translations } from '@i18n/translations';
import {
  createLocalHistoryRepository,
  type CalculatorDraft,
  type HistoryRepository,
} from '@repositories';
import { track } from '@utils';
import { headlineFor } from './history';

export interface SaveToHistoryProps {
  formulaId: FormulaId;
  /** What the person entered. */
  draft: CalculatorDraft;
  currency: string;
  /** The complete result on screen (values and steps). */
  result: { value: object; steps: Step[] };
  labels: Translations<'calculator'>['history'];
  historyHref: string;
  /** Injected in tests; defaults to the localStorage repository. */
  repository?: HistoryRepository;
}

/**
 * Keeps the whole calculation (inputs, result and steps) in the history. Saving the same values
 * twice in a row is prevented: the button turns into a confirmation until something changes.
 */
export const SaveToHistory = ({
  formulaId,
  draft,
  currency,
  result,
  labels,
  historyHref,
  repository = createLocalHistoryRepository(),
}: SaveToHistoryProps) => {
  const historyRef = useRef(repository);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const snapshot = JSON.stringify([draft, currency]);
  const saved = savedSnapshot === snapshot;

  const save = () => {
    const value = { ...(result.value as Record<string, unknown>) };
    historyRef.current.add({
      formulaId,
      draft,
      currency,
      result: { value, steps: result.steps },
      headline: headlineFor(formulaId, value),
    });
    setSavedSnapshot(snapshot);
    track('calculation_saved', { formula: formulaId });
  };

  return (
    <div className="flex flex-col gap-2 border-t border-[var(--border-default)] pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" className="min-h-11" disabled={saved} onClick={save}>
          {labels.save}
        </Button>
        <p role="status" className="flex flex-wrap gap-x-2">
          {saved && (
            <>
              <span>{labels.saved}</span>
              <a href={historyHref} className="font-semibold text-[var(--text-link)] underline">
                {labels.view}
              </a>
            </>
          )}
        </p>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">{labels.note}</p>
    </div>
  );
};
