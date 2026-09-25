import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberField } from '../NumberField';

const base = {
  id: 'gross-weight',
  label: 'Peso bruto',
  placeholder: 'Peso tal como lo compraste, en kg (ej.: 2,400)',
  value: '',
  onValueChange: () => undefined,
};

describe('NumberField', () => {
  it('should render a labelled decimal input with its unit and descriptive placeholder', () => {
    render(<NumberField {...base} unit="kg" />);
    const input = screen.getByRole('textbox', { name: 'Peso bruto (kg)' });
    expect(input).toHaveAttribute('inputmode', 'decimal');
    expect(input).toHaveAttribute('placeholder', base.placeholder);
  });

  it('should omit the unit when there is none', () => {
    render(<NumberField {...base} />);
    expect(screen.getByRole('textbox', { name: 'Peso bruto' })).toBeInTheDocument();
  });

  it('should report the raw text and blur events', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onBlur = vi.fn();
    render(<NumberField {...base} onValueChange={onValueChange} onBlur={onBlur} />);

    await user.type(screen.getByRole('textbox'), '2');
    await user.tab();

    expect(onValueChange).toHaveBeenCalledWith('2');
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it('should show the hint, or the error instead of it', () => {
    const { rerender } = render(<NumberField {...base} hint="Pesá antes de limpiar." />);
    expect(screen.getByText('Pesá antes de limpiar.')).toBeInTheDocument();

    rerender(<NumberField {...base} hint="Pesá antes de limpiar." error="Completá este dato." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Completá este dato.');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Pesá antes de limpiar.')).not.toBeInTheDocument();
  });
});
