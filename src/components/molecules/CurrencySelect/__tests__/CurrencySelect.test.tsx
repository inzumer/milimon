import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createLocalSettingsRepository } from '@repositories';
import { createMemoryStorage } from '@test/memory-storage';
import { setAnalyticsSink } from '@utils';
import { CurrencySelect } from '../CurrencySelect';

describe('CurrencySelect', () => {
  afterEach(() => {
    setAnalyticsSink(null);
  });

  it('should default to Argentine pesos with localized names', () => {
    render(
      <CurrencySelect
        lang="es"
        label="Moneda"
        repository={createLocalSettingsRepository(createMemoryStorage())}
      />,
    );
    const select = screen.getByRole('combobox', { name: 'Moneda' });
    expect(select).toHaveValue('ARS');
    expect(screen.getByRole('option', { name: /^ARS — peso argentino/i })).toBeInTheDocument();
  });

  it('should show the saved currency and persist and track a new one', async () => {
    const user = userEvent.setup();
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const repository = createLocalSettingsRepository(createMemoryStorage());
    repository.save({ currency: 'EUR' });
    render(<CurrencySelect lang="en" label="Currency" repository={repository} />);
    const select = screen.getByRole('combobox', { name: 'Currency' });
    expect(select).toHaveValue('EUR');

    await user.selectOptions(select, 'USD');

    expect(select).toHaveValue('USD');
    expect(repository.load().currency).toBe('USD');
    expect(sink).toHaveBeenCalledWith('currency_changed', { currency: 'USD' });
  });

  it('should use localStorage by default', async () => {
    const user = userEvent.setup();
    render(<CurrencySelect lang="en" label="Currency" />);
    await user.selectOptions(screen.getByRole('combobox'), 'MXN');
    expect(window.localStorage.getItem('milimon:settings')).toContain('"currency":"MXN"');
  });
});
