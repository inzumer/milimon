import { cn } from '@inzumer/ui-library';
import type { CalculatorText } from '@i18n/formula-text';
import { formulaText, toKebabCase } from '@i18n/formula-text';
import { formatValue, type FormatContext } from '@utils/format-value';
import type { OutputDefinition } from '@utils/formulas';

export interface ResultPanelProps {
  outputs: OutputDefinition[];
  values: Record<string, unknown>;
  text: CalculatorText;
  context: FormatContext;
  units?: Partial<Record<'weight' | 'area' | 'months', string>>;
}

const display = (
  output: OutputDefinition,
  value: unknown,
  text: CalculatorText,
  context: FormatContext,
  units: ResultPanelProps['units'],
) => {
  if (typeof value !== 'number') {
    return formulaText(text).choice(String(value));
  }

  const unit =
    output.kind === 'weight' || output.kind === 'area' || output.kind === 'months'
      ? units?.[output.kind]
      : undefined;
  const formatted = formatValue(value, output.kind, context);

  return unit ? `${formatted} ${unit}` : formatted;
};

/** Main results first and larger; the rest as a definition list. */
export const ResultPanel = ({ outputs, values, text, context, units }: ResultPanelProps) => (
  <dl className="grid gap-3">
    {[...outputs]
      .sort((a, b) => Number(Boolean(b.primary)) - Number(Boolean(a.primary)))
      .map((output) => (
        <div
          key={output.key}
          className={cn(
            'flex flex-col gap-1 rounded-lg p-4',
            output.primary
              ? 'bg-primary-500 text-neutral-950'
              : 'border border-[var(--border-default)] bg-[var(--surface-primary)]',
          )}
        >
          <dt
            className={cn(
              'text-sm',
              output.primary ? 'font-semibold' : 'text-[var(--text-secondary)]',
            )}
          >
            {formulaText(text).output(toKebabCase(output.key))}
          </dt>
          <dd className={cn('font-bold tabular-nums', output.primary ? 'text-3xl' : 'text-xl')}>
            {display(output, values[output.key], text, context, units)}
          </dd>
        </div>
      ))}
  </dl>
);
