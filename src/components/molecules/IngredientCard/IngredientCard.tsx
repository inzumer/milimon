import { Button, Input } from '@inzumer/ui-library';
import { NumberField } from '@components/molecules/NumberField';
import type { IngredientField, IngredientRow } from '@hooks/useRecipeCostingCalculator';
import { formulaText, type CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import { interpolate, trackingId } from '@utils';

export interface IngredientCardProps {
  row: IngredientRow;
  index: number;
  currency: string;
  canRemove: boolean;
  errors: Record<string, string>;
  text: CalculatorText;
  ui: Translations<'calculator'>;
  onChange: (field: IngredientField, value: string) => void;
  onBlur: (field: IngredientField) => void;
  onRemove: () => void;
}

/** Tracking scope: the formula id. */
const SCOPE = 'recipe-costing';

const NUMBER_FIELDS = [
  { field: 'netQuantity', copy: 'net-quantity' },
  { field: 'wastePercentage', copy: 'waste-percentage', unit: '%' },
  { field: 'unitPrice', copy: 'unit-price' },
] as const;

/** One ingredient as a fieldset: a card reads better than a wide table on a phone. */
export const IngredientCard = ({
  row,
  index,
  currency,
  canRemove,
  errors,
  text,
  ui,
  onChange,
  onBlur,
  onRemove,
}: IngredientCardProps) => {
  const t = formulaText(text);
  const title = interpolate(t.label('ingredient-number'), { number: index + 1 });
  const errorFor = (field: string) => {
    const code = errors[`ingredients.${index}.${field}`];
    return code ? ui.errors[code as keyof typeof ui.errors] : undefined;
  };
  const input = (copyKey: string) => t.input(copyKey);

  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-4">
      <legend className="px-1 font-bold">{row.name || title}</legend>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input
            id={trackingId(SCOPE, 'input', 'ingredient', index + 1, 'name')}
            label={input('name')?.label ?? ''}
            placeholder={input('name')?.placeholder ?? ''}
            value={row.name}
            autoComplete="off"
            inputSize="lg"
            onChange={(event) => onChange('name', event.target.value)}
          />
        </div>
        <Input
          id={trackingId(SCOPE, 'input', 'ingredient', index + 1, 'unit')}
          label={input('unit')?.label ?? ''}
          placeholder={input('unit')?.placeholder ?? ''}
          value={row.unit}
          autoComplete="off"
          inputSize="lg"
          onChange={(event) => onChange('unit', event.target.value)}
        />
      </div>
      {NUMBER_FIELDS.map(({ field, copy, ...rest }) => (
        <NumberField
          key={field}
          id={trackingId(SCOPE, 'input', 'ingredient', index + 1, field)}
          label={input(copy)?.label ?? copy}
          unit={
            'unit' in rest
              ? rest.unit
              : field === 'unitPrice'
                ? `${currency}/${row.unit || '—'}`
                : row.unit
          }
          placeholder={input(copy)?.placeholder ?? ''}
          hint={input(copy)?.hint}
          error={errorFor(field)}
          value={row[field]}
          onValueChange={(value) => onChange(field, value)}
          onBlur={() => onBlur(field)}
        />
      ))}
      {canRemove && (
        <Button
          id={trackingId(SCOPE, 'button', 'remove-ingredient', index + 1)}
          type="button"
          variant="ghost"
          className="min-h-11 self-start"
          onClick={onRemove}
        >
          {interpolate(t.label('remove-ingredient'), { name: row.name || title })}
        </Button>
      )}
    </fieldset>
  );
};
