import { RichText } from '@inzumer/ui-library';
import { StepList } from '@components/molecules/StepList';
import { formulaText, type CalculatorText } from '@i18n/formula-text';
import type { Translations } from '@i18n/translations';
import type { Step } from '@utils/calculation';
import { formatValue, type FormatContext } from '@utils/format-value';
import type { ValueKind } from '@utils/formulas';
import type { OmnesOutput } from '@utils/formulas/omnes-rules';

const STEP_KINDS: Record<string, ValueKind> = {
  maxPrice: 'currency',
  minPrice: 'currency',
  priceRatio: 'factor',
  zoneWidth: 'currency',
  lowZoneMax: 'currency',
  mediumZoneMax: 'currency',
  low: 'count',
  medium: 'count',
  high: 'count',
  total: 'currency',
  count: 'count',
  averagePrice: 'currency',
  lowerBound: 'currency',
  upperBound: 'currency',
};

const Summary = ({
  value,
  text,
  context,
}: {
  value: OmnesOutput;
  text: CalculatorText;
  context: FormatContext;
}) => {
  const t = formulaText(text);
  const rows: [term: string, main: string, detail?: string | undefined][] = [
    [
      t.output('price-ratio'),
      formatValue(value.priceRatio, 'factor', context),
      t.choice(value.proportionality),
    ],
    [
      t.output('distribution'),
      `${value.counts.low} · ${value.counts.medium} · ${value.counts.high}`,
      t.choice(value.balancedDistribution ? 'distribution-balanced' : 'distribution-unbalanced'),
    ],
    [t.output('average-price'), formatValue(value.averagePrice, 'currency', context)],
    [
      t.output('ticket'),
      value.ticket.status ? t.choice(value.ticket.status) : t.label('ticket-missing'),
    ],
    [
      t.output('daily-special'),
      value.dailySpecialZone ? t.choice(value.dailySpecialZone) : t.label('daily-special-missing'),
    ],
  ];

  return (
    <dl className="grid gap-3">
      {rows.map(([term, main, detail]) => (
        <div
          key={term}
          className="flex flex-col gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] p-4"
        >
          <dt className="text-sm text-[var(--text-secondary)]">{term}</dt>
          <dd className="font-bold tabular-nums">{main}</dd>
          {detail && <dd className="text-sm">{detail}</dd>}
        </div>
      ))}
    </dl>
  );
};

export interface OmnesResultProps {
  value: OmnesOutput;
  steps: Step[];
  text: CalculatorText;
  ui: Translations<'calculator'>;
  context: FormatContext;
}

/** Omnes' verdicts and worked steps (live calculator and saved history). */
export const OmnesResult = ({ value, steps, text, ui, context }: OmnesResultProps) => (
  <>
    <Summary value={value} text={text} context={context} />
    <RichText variant="h4" className="font-bold">
      {ui['steps-title']}
    </RichText>
    <StepList steps={steps} templates={text.steps} kinds={STEP_KINDS} context={context} />
  </>
);
