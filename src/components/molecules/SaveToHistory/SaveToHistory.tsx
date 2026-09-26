import { useState } from 'react';
import { Button } from '@inzumer/ui-library';
import type { Translations } from '@i18n/translations';
import { useHistoryStore, type CalculatorDraft } from '@stores';
import { track, trackingId } from '@utils';
import type { Step } from '@utils/calculation';
import type { FormulaId } from '@utils/formulas';
import { headlineFor } from '@utils/history';

export interface SaveToHistoryProps {
  formulaId: FormulaId;
  draft: CalculatorDraft;
  currency: string;
  result: { value: object; steps: Step[] };
  labels: Translations<'calculator'>['history'];
  historyHref: string;
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
}: SaveToHistoryProps) => {
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const snapshot = JSON.stringify([draft, currency]);
  const saved = savedSnapshot === snapshot;

  const save = () => {
    const value = { ...(result.value as Record<string, unknown>) };
    useHistoryStore.getState().add({
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
        <Button
          id={trackingId(formulaId, 'button', 'save-history')}
          type="button"
          className="min-h-11"
          disabled={saved}
          onClick={save}
        >
          {labels.save}
        </Button>
        <p role="status" className="flex flex-wrap gap-x-2">
          {saved && (
            <>
              <span>{labels.saved}</span>
              <a
                id={trackingId(formulaId, 'link', 'view-history')}
                href={historyHref}
                className="font-semibold text-[var(--text-link)] underline"
              >
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
