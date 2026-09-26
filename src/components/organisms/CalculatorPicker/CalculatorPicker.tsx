import { useCallback, useEffect, useRef, useState } from 'react';
import { RichText, Select } from '@inzumer/ui-library';
import { ButtonLink } from '@components/atoms/ButtonLink';
import { FormulaCalculator } from '@components/organisms/FormulaCalculator';
import { OmnesCalculator } from '@components/organisms/OmnesCalculator';
import { RecipeCostingCalculator } from '@components/organisms/RecipeCostingCalculator';
import type { CalculatorText } from '@i18n/formula-text';
import { loadCalculatorText, type CalculatorTextLoader } from '@i18n/load-calculator-text';
import type { Translations } from '@i18n/translations';
import { localizedPath, track, trackingId, type Locale } from '@utils';
import { isFormulaId, type FormulaGroup, type FormulaId } from '@utils/formulas';

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
  const [state, setState] = useState<LoadState>({ status: 'idle' });

  const requestedRef = useRef<FormulaId | null>(null);

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
      <Select
        id={trackingId('calculator', 'select', 'tool')}
        label={page['select-label']}
        inputSize="lg"
        value={selected}
        onChange={(event) => {
          const id = event.target.value;
          if (isFormulaId(id)) {
            writeToolToUrl(id);
            track('tool_selected', { formula: id });
            select(id);
          }
        }}
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
      </Select>

      <div aria-live="polite">
        {state.status === 'idle' && (
          <RichText className="text-[var(--text-secondary)]">{page.empty}</RichText>
        )}
        {state.status === 'loading' && (
          <RichText className="text-[var(--text-secondary)]">{page.loading}</RichText>
        )}
        {state.status === 'error' && (
          <RichText role="alert" className="text-[var(--border-error)]">
            {page['load-error']}
          </RichText>
        )}
      </div>

      {state.status === 'ready' && (
        <section key={state.id} aria-label={state.text.title} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <RichText variant="h2" bold className="font-display text-3xl">
              {state.text.title}
            </RichText>
            <RichText className="text-[var(--text-secondary)]">{state.text.summary}</RichText>
            <ButtonLink
              id={trackingId('calculator', 'link', 'how-it-works', state.id)}
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
