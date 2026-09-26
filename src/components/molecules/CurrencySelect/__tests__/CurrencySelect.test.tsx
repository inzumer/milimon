import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSettingsStore } from '@stores';
import { setAnalyticsSink } from '@utils';
import { CurrencySelect } from '../CurrencySelect';

describe('CurrencySelect', () => {
  afterEach(() => {
    setAnalyticsSink(null);
  });

  it('should default to Argentine pesos with localized names and a tracking id', () => {
    render(<CurrencySelect lang="es" label="Moneda" />);
    const select = screen.getByRole('combobox', { name: /Moneda/ });
    expect(select).toHaveTextContent(/^ARS — peso argentino/i);
    expect(select).toHaveAttribute('id', 'settings-select-currency');
  });

  it('should show the saved currency and persist and track a new one', async () => {
    const user = userEvent.setup();
    const sink = vi.fn();
    setAnalyticsSink(sink);
    useSettingsStore.getState().update({ currency: 'EUR' });
    render(<CurrencySelect lang="en" label="Currency" />);
    const select = screen.getByRole('combobox', { name: /Currency/ });
    expect(select).toHaveTextContent(/^EUR/);

    await user.click(select);
    await user.click(screen.getByRole('option', { name: /^USD/ }));

    expect(select).toHaveTextContent(/^USD/);
    expect(useSettingsStore.getState().currency).toBe('USD');
    expect(window.localStorage.getItem('milimon:settings')).toContain('"currency":"USD"');
    expect(sink).toHaveBeenCalledWith('currency_changed', { currency: 'USD' });
  });
});
