import { formatValue, type FormatContext } from '@calculators/shared/format-value';
import type { RecipeCostingOutput } from '@domain/formulas/recipe-costing';
import { formulaText, type CalculatorText } from '@i18n/formulas';

export interface CostTableProps {
  value: RecipeCostingOutput;
  /** Ids of the input rows, in the same order as `value.ingredients` (stable React keys). */
  ids: string[];
  text: CalculatorText;
  context: FormatContext;
}

/** Cost per ingredient: gross quantity to buy, cost and share of the recipe (scrolls on small screens). */
export const CostTable = ({ value, ids, text, context }: CostTableProps) => {
  const t = formulaText(text);
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)]">
      <table className="w-full min-w-80 text-left tabular-nums">
        <caption className="sr-only">{t.label('table-caption')}</caption>
        <thead className="border-b border-[var(--border-default)] text-sm text-[var(--text-secondary)]">
          <tr>
            <th scope="col" className="p-3">
              {t.input('name').label}
            </th>
            <th scope="col" className="p-3 text-right">
              {t.output('gross-quantity')}
            </th>
            <th scope="col" className="p-3 text-right">
              {t.output('cost')}
            </th>
            <th scope="col" className="p-3 text-right">
              {t.output('share')}
            </th>
          </tr>
        </thead>
        <tbody>
          {value.ingredients
            .map((row, index) => ({ ...row, id: ids[index] ?? row.name }))
            .map((row) => (
              <tr key={row.id} className="border-b border-[var(--border-muted)] last:border-0">
                <th scope="row" className="p-3 font-semibold">
                  {row.name || '—'}
                </th>
                <td className="p-3 text-right">
                  {formatValue(row.grossQuantity, 'weight', context)} {row.unit}
                </td>
                <td className="p-3 text-right">{formatValue(row.cost, 'currency', context)}</td>
                <td className="p-3 text-right">{formatValue(row.share, 'percentage', context)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
