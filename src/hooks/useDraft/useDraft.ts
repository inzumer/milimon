import { useCallback, useMemo, useRef } from 'react';
import { useDraftsStore, type CalculatorDraft } from '@stores';

/** A calculator’s raw form values, persisted per formula (`initial` until hydration). */
export const useDraft = (formulaId: string, initial: CalculatorDraft) => {
  const initialDraftRef = useRef(initial);
  const saved = useDraftsStore((state) => state.drafts[formulaId]);
  const draft = useMemo(() => ({ ...initialDraftRef.current, ...saved }), [saved]);

  const setDraft = useCallback(
    (next: CalculatorDraft) => useDraftsStore.getState().saveDraft(formulaId, next),
    [formulaId],
  );

  const resetDraft = useCallback(
    () => useDraftsStore.getState().clearDraft(formulaId),
    [formulaId],
  );

  return { draft, setDraft, resetDraft };
};
