import { Switch } from '@inzumer/ui-library';
import { NumberField } from '@components/molecules/NumberField';
import type { InputDefinition } from '@domain/registry';
import type { FormulaTranslation } from '@i18n/formulas';
import { formulaText, toKebabCase } from '@i18n/formulas';
import type { Translations } from '@i18n/translations';
import type { CalculatorDraft } from '@repositories';
import { interpolate } from '@utils';
import type { FieldErrorCode } from './useFormulaCalculator';

export interface FormulaFieldsProps {
  idPrefix: string;
  inputs: InputDefinition[];
  draft: CalculatorDraft;
  errors: Record<string, FieldErrorCode>;
  currency: string;
  text: FormulaTranslation;
  ui: Translations<'calculator'>;
  onChange: (key: string, value: string | boolean) => void;
  onBlur: (key: string) => void;
}

const UNIT_KINDS = ['weight', 'area', 'months', 'percentage', 'currency'] as const;

/** One field per registry input: a switch for toggles, a decimal field for everything else. */
export const FormulaFields = ({
  idPrefix,
  inputs,
  draft,
  errors,
  currency,
  text,
  ui,
  onChange,
  onBlur,
}: FormulaFieldsProps) => (
  <div className="grid gap-5">
    {inputs.map((input) => {
      const key = toKebabCase(input.key);
      const copy = formulaText(text).input(key);
      const value = draft[input.key];
      if (input.kind === 'toggle') {
        return (
          <Switch
            key={input.key}
            label={copy.label}
            checked={value === true}
            onCheckedChange={(checked) => onChange(input.key, checked)}
          />
        );
      }
      const unitKind = UNIT_KINDS.find((kind) => kind === input.kind);
      const code = errors[input.key];
      return (
        <NumberField
          key={input.key}
          id={`${idPrefix}-${key}`}
          label={copy.label}
          unit={unitKind ? interpolate(ui.units[unitKind], { currency }) : undefined}
          placeholder={copy.placeholder}
          hint={copy.hint}
          error={code ? (formulaText(text).error(`${key}.${code}`) ?? ui.errors[code]) : undefined}
          value={typeof value === 'string' ? value : ''}
          onValueChange={(raw) => onChange(input.key, raw)}
          onBlur={() => onBlur(input.key)}
        />
      );
    })}
  </div>
);
