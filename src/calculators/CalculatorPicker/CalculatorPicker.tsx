import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FormulaCalculator } from '@calculators/FormulaCalculator/FormulaCalculator';
import { OmnesCalculator } from '@calculators/OmnesCalculator/OmnesCalculator';
import { RecipeCostingCalculator } from '@calculators/RecipeCostingCalculator/RecipeCostingCalculator';
import { ButtonLink } from '@components/atoms/ButtonLink';
import { isFormulaId, type FormulaGroup, type FormulaId } from '@domain/registry';
import type { CalculatorText } from '@i18n/formula-text';
import { loadCalculatorText, type CalculatorTextLoader } from '@i18n/load-calculator-text';
import type { Translations } from '@i18n/translations';
import { localizedPath, track, type Locale } from '@utils';

export interface CalculatorPickerGroup {
  group: FormulaGroup;
  label: string;
  formulas: { id: FormulaId; title: string }[];
}

export interface CalculatorPickerProps {
  lang: Locale;
  groups: CalculatorPickerGroup[];
  page: Translations<'calculator-page'>;
  ui: Translations<'calculator'>;
  /** Injected in tests; defaults to lazy per-formula chunks. */
  loadText?: CalculatorTextLoader;
}

type LoadState =
  | { status: 'idle' }
  | { status: 'loading'; id: FormulaId }
  | { status: 'ready'; id: FormulaId; text: CalculatorText }
  | { status: 'error'; id: FormulaId };

const readToolFromUrl = (): FormulaId | null => {
  const tool = new URLSearchParams(window.location.search).get('tool');
  return isFormulaId(tool) ? tool : null;
};

const writeToolToUrl = (id: FormulaId) => {
  const url = new URL(window.location.href);
  url.searchParams.set('tool', id);
  window.history.replaceState(null, '', url);
};

/** General calculator: pick any formula from a grouped list; the choice lives in `?tool=`. */
export const CalculatorPicker = ({
  lang,
  groups,
  page,
  ui,
  loadText = loadCalculatorText,
}: CalculatorPickerProps) => {
  const selectId = useId();
  const [state, setState] = useState<LoadState>({ status: 'idle' });

  // Latest requested formula: a slow response for an older pick must not replace a newer one.
  const requestedRef = useRef<FormulaId | null>(null);

  /** Loads a formula's texts; state only changes when the promise settles. */
  const load = useCallback(
    (id: FormulaId) => {
      requestedRef.current = id;
      return loadText(lang, id).then(
        (text) => {
          if (requestedRef.current === id) {
            setState({ status: 'ready', id, text });
          }
        },
        () => {
          if (requestedRef.current === id) {
            setState({ status: 'error', id });
          }
        },
      );
    },
    [lang, loadText],
  );

  // After hydration: the static HTML can't know the query string.
  useEffect(() => {
    const initial = readToolFromUrl();
    if (initial) {
      void load(initial);
    }
  }, [load]);

  const select = (id: FormulaId) => {
    setState({ status: 'loading', id });
    void load(id);
  };

  const selected = state.status === 'idle' ? '' : state.id;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-lg font-bold">
          {page['select-label']}
        </label>
        <select
          id={selectId}
          value={selected}
          onChange={(event) => {
            const id = event.target.value;
            if (isFormulaId(id)) {
              writeToolToUrl(id);
              track('tool_selected', { formula: id });
              select(id);
            }
          }}
          className="min-h-12 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-lg text-[var(--input-text)] focus-visible:border-[var(--input-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:outline-none"
        >
          <option value="" disabled>
            {page['select-placeholder']}
          </option>
          {groups.map((group) => (
            <optgroup key={group.group} label={group.label}>
              {group.formulas.map((formula) => (
                <option key={formula.id} value={formula.id}>
                  {formula.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div aria-live="polite">
        {state.status === 'idle' && <p className="text-[var(--text-secondary)]">{page.empty}</p>}
        {state.status === 'loading' && (
          <p className="text-[var(--text-secondary)]">{page.loading}</p>
        )}
        {state.status === 'error' && (
          <p role="alert" className="text-[var(--border-error)]">
            {page['load-error']}
          </p>
        )}
      </div>

      {state.status === 'ready' && (
        <section key={state.id} aria-label={state.text.title} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl">{state.text.title}</h2>
            <p className="text-[var(--text-secondary)]">{state.text.summary}</p>
            <ButtonLink
              href={localizedPath(lang, 'formulas', state.id)}
              variant="secondary"
              className="self-start"
            >
              {page['how-it-works']}
            </ButtonLink>
          </div>
          {state.id === 'omnes-rules' && <OmnesCalculator lang={lang} text={state.text} ui={ui} />}
          {state.id === 'recipe-costing' && (
            <RecipeCostingCalculator lang={lang} text={state.text} ui={ui} />
          )}
          {state.id !== 'omnes-rules' && state.id !== 'recipe-costing' && (
            <FormulaCalculator formulaId={state.id} lang={lang} text={state.text} ui={ui} />
          )}
        </section>
      )}
    </div>
  );
};
