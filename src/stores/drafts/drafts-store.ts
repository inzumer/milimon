import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DRAFTS_STORAGE_KEY } from '@constants';
import { plainJsonStorage } from '@stores/persist';

export type CalculatorDraft = Record<string, string | boolean>;

export type CalculatorDrafts = Record<string, CalculatorDraft>;

export interface DraftsState {
  drafts: CalculatorDrafts;
  saveDraft: (formulaId: string, draft: CalculatorDraft) => void;
  clearDraft: (formulaId: string) => void;
  replaceAll: (drafts: CalculatorDrafts) => void;
}

export const isDraft = (value: unknown): value is CalculatorDraft =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((item) => typeof item === 'string' || typeof item === 'boolean');

/** Valid drafts only. */
export const sanitizeDrafts = (raw: unknown): CalculatorDrafts => {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }

  return Object.fromEntries(Object.entries(raw).filter(([, draft]) => isDraft(draft)));
};

/** The last values typed in each calculator, per formula (synced to the account). */
export const useDraftsStore = create<DraftsState>()(
  persist(
    (set) => ({
      drafts: {},
      saveDraft: (formulaId, draft) =>
        set((state) => ({ drafts: { ...state.drafts, [formulaId]: draft } })),
      clearDraft: (formulaId) =>
        set((state) => {
          const { [formulaId]: _removed, ...rest } = state.drafts;

          return { drafts: rest };
        }),
      replaceAll: (drafts) => set({ drafts: sanitizeDrafts(drafts) }),
    }),
    {
      name: DRAFTS_STORAGE_KEY,
      partialize: ({ drafts }) => ({ drafts }),
      storage: plainJsonStorage<Pick<DraftsState, 'drafts'>>(
        ({ drafts }) => drafts,
        (raw) => ({ drafts: sanitizeDrafts(raw) }),
      ),
    },
  ),
);
