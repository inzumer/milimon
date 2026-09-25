import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createLocalCalculationsRepository,
  type CalculationsRepository,
  type CalculatorDraft,
} from '@repositories';

/**
 * Raw form values of a calculator, persisted per formula. The first render uses `initial` (same
 * markup on server and client); the saved draft is applied after hydration.
 */
export const useDraft = (
  formulaId: string,
  initial: CalculatorDraft,
  calculations: CalculationsRepository = createLocalCalculationsRepository(),
) => {
  const [draft, setDraftState] = useState<CalculatorDraft>(initial);
  const repositoryRef = useRef(calculations);
  const initialDraftRef = useRef(initial);

  useEffect(() => {
    const saved = repositoryRef.current.loadDraft(formulaId);
    if (saved) {
      setDraftState({ ...initialDraftRef.current, ...saved });
    }
  }, [formulaId]);

  const setDraft = useCallback(
    (next: CalculatorDraft) => {
      setDraftState(next);
      repositoryRef.current.saveDraft(formulaId, next);
    },
    [formulaId],
  );

  const resetDraft = useCallback(() => {
    setDraftState(initialDraftRef.current);
    repositoryRef.current.clearDraft(formulaId);
  }, [formulaId]);

  return { draft, setDraft, resetDraft };
};
