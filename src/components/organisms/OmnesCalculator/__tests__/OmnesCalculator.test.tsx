import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parsePriceList } from '@hooks/useOmnesCalculator';
import { getFormulaTranslation, getTranslations } from '@i18n';
import { useDraftsStore } from '@stores';
import type { Locale } from '@utils';
import { OmnesCalculator } from '../OmnesCalculator';

const setup = (lang: Locale = 'es') => {
  render(
    <OmnesCalculator
      lang={lang}
      text={getFormulaTranslation(lang, 'omnes-rules')}
      ui={getTranslations(lang, 'calculator')}
    />,
  );
  return { user: userEvent.setup() };
};

const result = () => screen.getByRole('region', { name: /Resultado|Result/ });

describe('parsePriceList', () => {
  it('should split by lines, spaces or semicolons and keep commas as decimals', () => {
    expect(parsePriceList('40\n65,50; 90   115', 'es')).toStrictEqual({
      prices: [40, 65.5, 90, 115],
      invalid: [],
    });
    expect(parsePriceList('40 abc 1.5', 'en')).toStrictEqual({
      prices: [40, 1.5],
      invalid: ['abc'],
    });
    expect(parsePriceList('   ', 'es')).toStrictEqual({ prices: [], invalid: [] });
  });
});

describe('OmnesCalculator', () => {
  it('should analyze the example menu of 16 cakes', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Cargar: Pastelería con 16 tortas/ }));

    expect(screen.getByText(/16 precios cargados/)).toBeInTheDocument();
    const region = result();
    expect(within(region).getByText('4 · 8 · 4')).toBeInTheDocument();
    expect(within(region).getByText(/^Equilibrado: la zona media/)).toBeInTheDocument();
    expect(within(region).getByText(/^Adecuados: el ticket promedio/)).toBeInTheDocument();
    expect(within(region).getByText(/entre 2 y 3 veces/)).toBeInTheDocument();
    expect(
      within(region).getByText('En la zona de precios medios, como corresponde'),
    ).toBeInTheDocument();
    expect(within(region).getByText(/Ancho de cada zona/)).toHaveTextContent('= $ 25,00');
    expect(useDraftsStore.getState().drafts['omnes-rules']).toMatchObject({ averageTicket: '80' });
  });

  it('should explain what is missing when the optional values are empty', async () => {
    const { user } = setup('en');
    await user.type(screen.getByRole('textbox', { name: /Menu prices/ }), '40{enter}80');

    const region = result();
    expect(within(region).getByText(/Enter the average ticket/)).toBeInTheDocument();
    expect(within(region).getByText(/Enter the daily special price/)).toBeInTheDocument();
    expect(within(region).getByText(/Ideal/)).toBeInTheDocument();
  });

  it('should drop letters and flag malformed prices after leaving the list', async () => {
    const { user } = setup();
    const list = screen.getByRole('textbox', { name: /Precios de la carta/ });
    await user.type(list, '40 abc 1,2,3');
    expect(list).toHaveValue('40  1,2,3');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('no son números válidos: 1,2,3');
    expect(within(result()).getByText(/Completá los datos/)).toBeInTheDocument();
  });

  it('should ask for at least two prices and clear everything on reset', async () => {
    const { user } = setup();
    const list = screen.getByRole('textbox', { name: /Precios de la carta/ });
    await user.type(list, '40');
    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('Cargá al menos dos valores.');

    await user.click(screen.getByRole('button', { name: 'Limpiar datos' }));
    expect(list).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(useDraftsStore.getState().drafts['omnes-rules']).toBeUndefined();
  });

  it('should flag the optional fields only after leaving them, then clear on reset', async () => {
    const { user } = setup();
    const ticket = screen.getByRole('textbox', { name: /Ticket promedio/ });
    await user.type(ticket, '1,2,3');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('Escribí un número válido');

    await user.clear(ticket);
    await user.type(ticket, '0');
    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('Tiene que ser mayor que 0.');

    await user.click(screen.getByRole('button', { name: 'Limpiar datos' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
