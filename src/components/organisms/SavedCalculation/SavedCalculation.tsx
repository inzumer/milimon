import { Component, type ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@inzumer/ui-library';
import { FormulaResult } from '@components/organisms/FormulaResult';
import { OmnesResult } from '@components/organisms/OmnesResult';
import { RecipeCostingResult } from '@components/organisms/RecipeCostingResult';
import { formulaText, toKebabCase, type CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import type { CalculatorDraft, HistoryEntry } from '@stores';
import { interpolate, type Locale } from '@utils';
import type { FormatContext } from '@utils/format-value';
import { getFormula, isFormulaId, type ValueKind } from '@utils/formulas';
import type { OmnesOutput } from '@utils/formulas/omnes-rules';
import type { RecipeCostingOutput } from '@utils/formulas/recipe-costing';

export type SavedCalculationLabels = Translations<'history-page'>['list'];

export interface SavedCalculationProps {
  entry: HistoryEntry;
  lang: Locale;
  text: CalculatorText;
  ui: Translations<'calculator'>;
  labels: SavedCalculationLabels;
}

type Line = [label: string, value: string];

const text = (draft: CalculatorDraft, key: string): string => {
  const value = draft[key];
  return typeof value === 'string' ? value.trim() : '';
};

/** Unit written after a raw typed value (the value is shown exactly as the person typed it). */
const unitFor = (
  kind: ValueKind,
  currency: string,
  units: Translations<'calculator'>['units'],
): string => {
  switch (kind) {
    case 'currency':
      return currency;
    case 'percentage':
      return units.percentage;
    case 'weight':
    case 'area':
    case 'months':
      return units[kind];
    default:
      return '';
  }
};

const withUnit = (value: string, unit: string) => (unit ? `${value} ${unit}` : value);

interface SavedIngredient {
  id?: unknown;
  name?: unknown;
  unit?: unknown;
  netQuantity?: unknown;
  wastePercentage?: unknown;
  unitPrice?: unknown;
}

/** Ingredient rows as typed; each gets a stable key (the calculator's row id when present). */
const readIngredients = (raw: unknown): (SavedIngredient & { key: string })[] => {
  try {
    const rows: unknown = JSON.parse(typeof raw === 'string' ? raw : '[]');
    return Array.isArray(rows)
      ? (rows as SavedIngredient[]).map((row, index) => ({
          ...row,
          key: typeof row.id === 'string' ? row.id : `row-${index}`,
        }))
      : [];
  } catch {
    return [];
  }
};

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

const Lines = ({ lines }: { lines: Line[] }) => (
  <dl className="grid gap-2 sm:grid-cols-2">
    {lines.map(([label, value]) => (
      <div
        key={label}
        className="flex flex-col rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] p-3"
      >
        <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
        <dd className="font-semibold tabular-nums">{value}</dd>
      </div>
    ))}
  </dl>
);

/** What the person entered, exactly as typed, with each field's label and unit. */
const SavedInputs = ({ entry, text: copy, ui, labels }: Omit<SavedCalculationProps, 'lang'>) => {
  const t = formulaText(copy);
  const { draft, currency } = entry;

  if (entry.formulaId === 'recipe-costing') {
    const ingredients = readIngredients(draft['ingredients']);
    return (
      <>
        <Lines lines={[[t.input('servings').label, text(draft, 'servings')]]} />
        <Table caption={t.label('ingredients-title')} captionHidden>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{labels.ingredient}</TableHeaderCell>
              <TableHeaderCell align="end">{t.input('net-quantity').label}</TableHeaderCell>
              <TableHeaderCell align="end">{t.input('waste-percentage').label}</TableHeaderCell>
              <TableHeaderCell align="end">{t.input('unit-price').label}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ingredients.map((row) => (
              <TableRow key={row.key}>
                <TableHeaderCell scope="row" className="font-semibold">
                  {asText(row.name)}
                </TableHeaderCell>
                <TableCell align="end">
                  {withUnit(asText(row.netQuantity), asText(row.unit))}
                </TableCell>
                <TableCell align="end">
                  {withUnit(asText(row.wastePercentage), ui.units.percentage)}
                </TableCell>
                <TableCell align="end">{withUnit(asText(row.unitPrice), currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    );
  }

  if (entry.formulaId === 'omnes-rules') {
    const prices = text(draft, 'prices')
      .split(/[\s;]+/)
      .map((price) => price.trim())
      .filter(Boolean);
    const lines: Line[] = [[t.input('prices').label, prices.join(' · ')]];
    for (const [key, copyKey] of [
      ['averageTicket', 'average-ticket'],
      ['dailySpecialPrice', 'daily-special-price'],
    ] as const) {
      if (text(draft, key)) {
        lines.push([t.input(copyKey).label, withUnit(text(draft, key), currency)]);
      }
    }
    return <Lines lines={lines} />;
  }

  const formula = isFormulaId(entry.formulaId) ? getFormula(entry.formulaId) : null;
  if (!formula || formula.layout !== 'standard') {
    throw new Error(`Unknown saved formula ${entry.formulaId}`);
  }
  const lines = formula.inputs.flatMap((input): Line[] => {
    const label = t.input(toKebabCase(input.key)).label;
    const value = draft[input.key];
    if (typeof value === 'boolean') {
      return [[label, value ? labels.yes : labels.no]];
    }
    const typed = text(draft, input.key);
    return typed ? [[label, withUnit(typed, unitFor(input.kind, currency, ui.units))]] : [];
  });
  return <Lines lines={lines} />;
};

/** The saved result, rendered with the same components as the live calculator. */
const SavedResult = ({ entry, lang, text: copy, ui }: Omit<SavedCalculationProps, 'labels'>) => {
  const context: FormatContext = { lang, currency: entry.currency };
  const { value, steps } = entry.result;
  if (entry.formulaId === 'recipe-costing') {
    const recipe = value as unknown as RecipeCostingOutput;
    return (
      <RecipeCostingResult
        value={recipe}
        steps={steps}
        ids={recipe.ingredients.map((_, index) => `saved-${index}`)}
        text={copy}
        ui={ui}
        context={context}
      />
    );
  }
  if (entry.formulaId === 'omnes-rules') {
    return (
      <OmnesResult
        value={value as unknown as OmnesOutput}
        steps={steps}
        text={copy}
        ui={ui}
        context={context}
      />
    );
  }
  const formula = isFormulaId(entry.formulaId) ? getFormula(entry.formulaId) : null;
  if (!formula || formula.layout !== 'standard') {
    throw new Error(`Unknown saved formula ${entry.formulaId}`);
  }
  return (
    <FormulaResult
      formula={formula}
      value={value}
      steps={steps}
      text={copy}
      ui={ui}
      context={context}
    />
  );
};

/** A saved snapshot that no longer matches the app (renamed formula, missing text) must not break the page. */
class Fallback extends Component<{ message: string; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? <p role="alert">{this.props.message}</p> : this.props.children;
  }
}

/** A whole saved calculation: what was entered, the result and the worked steps. */
export const SavedCalculation = (props: SavedCalculationProps) => {
  const { labels, entry } = props;
  return (
    <Fallback message={labels.unavailable}>
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold">{labels['inputs-title']}</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          {interpolate(labels.currency, { currency: entry.currency })}
        </p>
        <SavedInputs {...props} />
        <h3 className="text-lg font-bold">{labels['result-title']}</h3>
        <SavedResult {...props} />
      </div>
    </Fallback>
  );
};
