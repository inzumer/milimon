import { Input } from '@inzumer/ui-library';

export interface NumberFieldProps {
  id: string;
  label: string;
  /** Shown after the label, e.g. "kg" → "Peso bruto (kg)". */
  unit?: string | undefined;
  placeholder: string;
  hint?: string | undefined;
  error?: string | undefined;
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
}

/**
 * Decimal number input (ui-library `Input`). Keeps the raw text so people can type "2,4" or "2.4"
 * freely; parsing happens outside. `inputMode="decimal"` opens the numeric keypad on mobile.
 */
export const NumberField = ({
  id,
  label,
  unit,
  placeholder,
  hint,
  error,
  value,
  onValueChange,
  onBlur,
}: NumberFieldProps) => (
  <Input
    id={id}
    label={unit ? `${label} (${unit})` : label}
    placeholder={placeholder}
    {...(hint ? { hint } : {})}
    {...(error ? { error } : {})}
    value={value}
    inputMode="decimal"
    autoComplete="off"
    inputSize="lg"
    onChange={(event) => onValueChange(event.target.value)}
    {...(onBlur ? { onBlur } : {})}
  />
);
