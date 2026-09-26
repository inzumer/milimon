import { Input } from '@inzumer/ui-library';
import { keepNumericCharacters } from '@utils';

export interface NumberFieldProps {
  id: string;
  label: string;
  unit?: string | undefined;
  placeholder: string;
  hint?: string | undefined;
  error?: string | undefined;
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
}

/**
 * Decimal number input (ui-library `Input`). Only digits and `,`/`.` can be typed (anything
 * else is dropped as it's typed); the raw text is kept so "2,4" and "2.4" both work, and parsing
 * happens outside. `inputMode="decimal"` opens the numeric keypad on mobile.
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
    onChange={(event) => onValueChange(keepNumericCharacters(event.target.value))}
    {...(onBlur ? { onBlur } : {})}
  />
);
