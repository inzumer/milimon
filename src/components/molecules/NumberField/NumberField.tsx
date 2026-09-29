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

/** Decimal input: keeps digits and `,`/`.` as typed (parsed outside), numeric keypad on mobile. */
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
