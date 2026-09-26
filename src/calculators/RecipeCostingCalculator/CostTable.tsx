import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@inzumer/ui-library';
import { formatValue, type FormatContext } from '@calculators/shared/format-value';
import type { RecipeCostingOutput } from '@domain/formulas/recipe-costing';
import { formulaText, type CalculatorText } from '@i18n/formula-text';

export interface CostTableProps {
  value: RecipeCostingOutput;
  ids: string[];
  text: CalculatorText;
  context: FormatContext;
}

/** Cost per ingredient: gross quantity to buy, cost and share of the recipe (scrolls on small screens). */
export const CostTable = ({ value, ids, text, context }: CostTableProps) => {
  const t = formulaText(text);
  return (
    <Table caption={t.label('table-caption')} captionHidden>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t.input('name').label}</TableHeaderCell>
          <TableHeaderCell align="end">{t.output('gross-quantity')}</TableHeaderCell>
          <TableHeaderCell align="end">{t.output('cost')}</TableHeaderCell>
          <TableHeaderCell align="end">{t.output('share')}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {value.ingredients
          .map((row, index) => ({ ...row, id: ids[index] ?? row.name }))
          .map((row) => (
            <TableRow key={row.id}>
              <TableHeaderCell scope="row" className="font-semibold">
                {row.name || '—'}
              </TableHeaderCell>
              <TableCell align="end">
                {formatValue(row.grossQuantity, 'weight', context)} {row.unit}
              </TableCell>
              <TableCell align="end">{formatValue(row.cost, 'currency', context)}</TableCell>
              <TableCell align="end">{formatValue(row.share, 'percentage', context)}</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};
