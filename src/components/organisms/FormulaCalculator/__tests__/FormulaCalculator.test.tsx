import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getFormulaTranslation, getTranslations } from '@i18n';
import { useDraftsStore, useSettingsStore } from '@stores';
import { setAnalyticsSink, type Locale } from '@utils';
import type { FormulaId } from '@utils/formulas';
import { FormulaCalculator } from '../FormulaCalculator';

const plain = (text: string | null) => (text ?? '').replace(/[  ]/g, ' ');

const setup = (formulaId: FormulaId = 'waste-percentage', lang: Locale = 'es') => {
  const utils = render(
    <FormulaCalculator
      formulaId={formulaId}
      lang={lang}
      text={getFormulaTranslation(lang, formulaId)}
      ui={getTranslations(lang, 'calculator')}
    />,
  );
  return { ...utils, user: userEvent.setup() };
};

const resultRegion = () => screen.getByRole('region', { name: /Resultado|Result/ });

describe('FormulaCalculator', () => {
  afterEach(() => {
    setAnalyticsSink(null);
  });

  it('should render a labelled field with unit and placeholder for every input', () => {
    setup();
    const gross = screen.getByRole('textbox', { name: 'Peso bruto (sucio) (kg)' });
    expect(gross).toHaveAttribute('placeholder', 'Peso tal como lo compraste, en kg (ej.: 2,800)');
    expect(screen.getByRole('textbox', { name: 'Peso neto (limpio) (kg)' })).toBeInTheDocument();
    expect(within(resultRegion()).getByText(/Completá los datos/)).toBeInTheDocument();
  });

  it('should calculate live with comma decimals and show the full working', async () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const { user } = setup();
    await user.type(screen.getByRole('textbox', { name: /Peso bruto/ }), '2,4');
    await user.type(screen.getByRole('textbox', { name: /Peso neto/ }), '1,7');

    const region = resultRegion();
    expect(within(region).getByText('29,17%')).toBeInTheDocument();
    expect(within(region).getByText('0,7 kg')).toBeInTheDocument();
    expect(
      within(region).getByText('Desecho = peso bruto − peso neto = 2,4 kg − 1,7 kg = 0,7 kg'),
    ).toBeInTheDocument();
    expect(sink).toHaveBeenCalledWith('calculation_completed', { formula: 'waste-percentage' });
  });

  it('should only show an error after leaving the field, using the field-specific message', async () => {
    const { user } = setup();
    const gross = screen.getByRole('textbox', { name: /Peso bruto/ });
    const net = screen.getByRole('textbox', { name: /Peso neto/ });

    await user.type(gross, '1');
    await user.type(net, '2');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'El peso limpio no puede ser mayor que el peso bruto.',
    );
  });

  it('should drop letters as they are typed and flag malformed numbers', async () => {
    const { user } = setup();
    const gross = screen.getByRole('textbox', { name: /Peso bruto/ });
    await user.type(gross, 'a2b,4c');
    expect(gross).toHaveValue('2,4');

    await user.clear(gross);
    await user.type(gross, '1,2,3');
    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Escribí un número válido (por ejemplo 2,4).',
    );
  });

  it('should load the example, remember it and clear it again', async () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const { user } = setup('gross-quantity');

    await user.click(screen.getByRole('button', { name: /Cargar: Salmón para 120 cubiertos/ }));

    expect(screen.getByRole('textbox', { name: /Comensales/ })).toHaveValue('120');
    expect(screen.getByRole('textbox', { name: /Porción limpia/ })).toHaveValue('0,16');
    expect(within(resultRegion()).getByText('26 kg')).toBeInTheDocument();
    expect(useDraftsStore.getState().drafts['gross-quantity']).toMatchObject({ servings: '120' });
    expect(sink).toHaveBeenCalledWith('example_loaded', {
      formula: 'gross-quantity',
      example: 'salmon-portions',
    });

    await user.click(screen.getByRole('button', { name: 'Limpiar datos' }));
    expect(screen.getByRole('textbox', { name: /Comensales/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /Redondear/ })).toHaveValue('1');
    expect(useDraftsStore.getState().drafts['gross-quantity']).toBeUndefined();
  });

  it('should restore the saved draft and use the configured currency', () => {
    useDraftsStore.getState().saveDraft('cost-of-goods', {
      openingInventory: '180000',
      purchases: '410000',
      closingInventory: '150000',
    });
    useSettingsStore.getState().update({ currency: 'USD' });
    setup('cost-of-goods', 'en');

    expect(screen.getByRole('textbox', { name: 'Opening inventory (USD)' })).toHaveValue('180000');
    expect(within(resultRegion()).getByText('$440,000.00')).toBeInTheDocument();
  });

  it('should render toggles as switches and use them in the calculation', async () => {
    const { user } = setup('pricing');
    await user.click(screen.getByRole('button', { name: /Cargar: Tostado del café/ }));
    const cards = screen.getByRole('switch', { name: '¿Cobrás con tarjeta?' });
    expect(cards).not.toBeChecked();
    expect(plain(within(resultRegion()).getByText(/^\$ 64,/).textContent)).toBe('$ 64,89');

    await user.click(cards);
    expect(plain(within(resultRegion()).getByText(/^\$ 66,/).textContent)).toBe('$ 66,95');
  });

  it('should show text results with their translated label', async () => {
    const { user } = setup('rent-check', 'en');
    await user.click(screen.getByRole('button', { name: /Load: The café's rent/ }));
    expect(within(resultRegion()).getByText('Acceptable: between 5% and 10%')).toBeInTheDocument();
  });

  it('should fall back to the generic error message', async () => {
    const { user } = setup('waste-factor', 'en');
    await user.type(screen.getByRole('textbox', { name: /Trim waste %/ }), '100');
    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('It must be less than 100%.');
  });
});
