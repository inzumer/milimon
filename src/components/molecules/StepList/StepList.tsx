import { interpolate } from '@utils';
import type { Step } from '@utils/calculation';
import { formatValue, type FormatContext } from '@utils/format-value';
import type { ValueKind } from '@utils/formulas';

export interface StepListProps {
  steps: Step[];
  templates: Record<string, string>;
  kinds: Record<string, ValueKind | 'text'>;
  context: FormatContext;
}

/** The worked calculation, one numbered line per step, with the person's own numbers. */
export const StepList = ({ steps, templates, kinds, context }: StepListProps) => (
  <ol className="flex list-decimal flex-col gap-3 pl-6 marker:font-bold marker:text-[var(--text-link)]">
    {steps.map((step) => {
      const values = Object.fromEntries(
        Object.entries(step.values).map(([key, value]) => [
          key,
          formatValue(value, kinds[key], context),
        ]),
      );
      return (
        <li key={step.id} className="pl-1 leading-relaxed tabular-nums">
          {interpolate(templates[step.id] ?? step.id, values)}
        </li>
      );
    })}
  </ol>
);
