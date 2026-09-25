import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormulaId } from '@domain/registry';
import { getFormulaTranslation, getTranslations } from '@i18n';
import { createLocalCalculationsRepository, createLocalSettingsRepository } from '@repositories';
import { createMemoryStorage } from '@test/memory-storage';
import { setAnalyticsSink, type Locale } from '@utils';
import { FormulaCalculator } from '../FormulaCalculator';

const plain = (text: string | null) => (text ?? '').replace(/[  ]/g, ' ');

const setup = (
  formulaId: FormulaId = 'waste-percentage',
  lang: Locale = 'es',
  storage = createMemoryStorage(),
) => {
  const calculations = createLocalCalculationsRepository(storage);
  const settings = createLocalSettingsRepository(storage);
  const utils = render(
    <FormulaCalculator
      formulaId={formulaId}
      lang={lang}
      text={getFormulaTranslation(lang, formulaId)}
      ui={getTranslations(lang, 'calculator')}
      calculations={calculations}
      settings={settings}
    />,
  );
  return { ...utils, user: userEvent.setup(), calculations, settings, storage };
};

const resultRegion = () => screen.getByRole('region', { name: /Resultado|Result/ });

describe('FormulaCalculator', () => {
  afterEach(() => {
    setAnalyticsSink(null);
  });

  it('should render a labelled field with unit and placeholder for every input', () => {
    setup();
    const gross = screen.getByRole('textbox', { name: 'Peso bruto (sucio) (kg)' });
    expect(gross).toHaveAttribute('placeholder', 'Peso tal como lo compraste, en kg (ej.: 2,400)');
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
    expect(within(region).getByText('0,7')).toBeInTheDocument();
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

  it('should flag text that is not a number', async () => {
    const { user } = setup();
    await user.type(screen.getByRole('textbox', { name: /Peso bruto/ }), 'abc');
    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Escribí un número válido (por ejemplo 2,4).',
    );
  });

  it('should load the manual example, remember it and clear it again', async () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const { user, calculations } = setup('gross-quantity');

    await user.click(screen.getByRole('button', { name: /Cargar: Tournedó para 200 personas/ }));

    expect(screen.getByRole('textbox', { name: /Comensales/ })).toHaveValue('200');
    expect(screen.getByRole('textbox', { name: /Porción limpia/ })).toHaveValue('0,18');
    expect(within(resultRegion()).getByText('52')).toBeInTheDocument();
    expect(calculations.loadDraft('gross-quantity')).toMatchObject({ servings: '200' });
    expect(sink).toHaveBeenCalledWith('example_loaded', {
      formula: 'gross-quantity',
      example: 'manual-tournedos',
    });

    await user.click(screen.getByRole('button', { name: 'Limpiar datos' }));
    expect(screen.getByRole('textbox', { name: /Comensales/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /Redondear/ })).toHaveValue('1');
    expect(calculations.loadDraft('gross-quantity')).toBeNull();
  });

  it('should restore the saved draft and use the configured currency', () => {
    const storage = createMemoryStorage();
    createLocalCalculationsRepository(storage).saveDraft('cost-of-goods', {
      openingInventory: '125000',
      purchases: '245000',
      closingInventory: '100000',
    });
    createLocalSettingsRepository(storage).save({ currency: 'USD' });
    setup('cost-of-goods', 'en', storage);

    expect(screen.getByRole('textbox', { name: 'Opening inventory (USD)' })).toHaveValue('125000');
    expect(within(resultRegion()).getByText('$270,000.00')).toBeInTheDocument();
  });

  it('should render toggles as switches and use them in the calculation', async () => {
    const { user } = setup('pricing');
    await user.click(screen.getByRole('button', { name: /Cargar: Medialunas/ }));
    const cards = screen.getByRole('switch', { name: '¿Cobrás con tarjeta?' });
    expect(cards).not.toBeChecked();
    expect(plain(within(resultRegion()).getByText(/^\$ 43,/).textContent)).toBe('$ 43,25');

    await user.click(cards);
    expect(plain(within(resultRegion()).getByText(/^\$ 44,/).textContent)).toBe('$ 44,99');
  });

  it('should show text results with their translated label', async () => {
    const { user } = setup('rent-check', 'en');
    await user.click(screen.getByRole('button', { name: /Load: Handbook rent/ }));
    expect(within(resultRegion()).getByText('Acceptable: between 5% and 10%')).toBeInTheDocument();
  });

  it('should fall back to the generic error message', async () => {
    const { user } = setup('waste-factor', 'en');
    await user.type(screen.getByRole('textbox', { name: /Trim waste %/ }), '100');
    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('It must be less than 100%.');
  });
});
