import { cn } from '@inzumer/ui-library';
import { formatValue, type FormatContext } from '@calculators/shared/format-value';
import type { OutputDefinition } from '@domain/registry';
import type { FormulaTranslation } from '@i18n/formulas';
import { toKebabCase } from '@i18n/formulas';

export interface ResultPanelProps {
  outputs: OutputDefinition[];
  values: Record<string, unknown>;
  text: FormulaTranslation;
  context: FormatContext;
}

const display = (
  output: OutputDefinition,
  value: unknown,
  text: FormulaTranslation,
  context: FormatContext,
) =>
  typeof value === 'number'
    ? formatValue(value, output.kind, context)
    : (text.choices?.[String(value)] ?? String(value));

/** Main results first and larger; the rest as a definition list. */
export const ResultPanel = ({ outputs, values, text, context }: ResultPanelProps) => (
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
            {text.outputs[toKebabCase(output.key)]}
          </dt>
          <dd className={cn('font-bold tabular-nums', output.primary ? 'text-3xl' : 'text-xl')}>
            {display(output, values[output.key], text, context)}
          </dd>
        </div>
      ))}
  </dl>
);
