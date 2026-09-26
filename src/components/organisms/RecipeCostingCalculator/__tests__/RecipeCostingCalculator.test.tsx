import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getFormulaTranslation, getTranslations } from '@i18n';
import { useDraftsStore, useSettingsStore } from '@stores';
import type { Locale } from '@utils';
import { RecipeCostingCalculator } from '../RecipeCostingCalculator';

const plain = (text: string | null) => (text ?? '').replace(/[  ]/g, ' ');

const setup = (lang: Locale = 'es') => {
  render(
    <RecipeCostingCalculator
      lang={lang}
      text={getFormulaTranslation(lang, 'recipe-costing')}
      ui={getTranslations(lang, 'calculator')}
    />,
  );
  return { user: userEvent.setup() };
};

const result = () => screen.getByRole('region', { name: /Resultado|Result/ });

describe('RecipeCostingCalculator', () => {
  it('should start with one empty ingredient card and no result', () => {
    setup();
    expect(screen.getByRole('group', { name: 'Ingrediente 1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Quitar/ })).not.toBeInTheDocument();
    expect(within(result()).getByText(/Completá los datos/)).toBeInTheDocument();
  });

  it('should cost the example recipe per ingredient, recipe and portion', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Cargar: Tournedó con galette/ }));

    expect(screen.getAllByRole('group')).toHaveLength(3);
    const table = within(result()).getByRole('table', { name: 'Costo por ingrediente' });
    const lomo = within(table).getByRole('row', { name: /Lomo/ });
    expect(plain(lomo.textContent)).toContain('2,571 kg');
    expect(plain(lomo.textContent)).toContain('$ 25.714,29');
    expect(plain(within(result()).getByText(/^\$ 31\.064/).textContent)).toBe('$ 31.064,29');
    expect(plain(within(result()).getByText(/^\$ 3\.106/).textContent)).toBe('$ 3.106,43');
    expect(useDraftsStore.getState().drafts['recipe-costing']).toMatchObject({ servings: '10' });
  });

  it('should add, edit and remove ingredients', async () => {
    const { user } = setup('en');
    await user.type(screen.getByRole('textbox', { name: 'Yield (portions)' }), '2');
    const first = screen.getByRole('group', { name: 'Ingredient 1' });
    await user.type(within(first).getByRole('textbox', { name: 'Ingredient' }), 'Rice');
    await user.type(within(first).getByRole('textbox', { name: /Recipe quantity/ }), '1');
    await user.type(within(first).getByRole('textbox', { name: /Purchase price/ }), '1000');
    expect(within(result()).getByText(/^ARS[  ]500.00$/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add ingredient' }));
    expect(screen.getAllByRole('group')).toHaveLength(2);
    expect(within(result()).getByText(/Fill in the data/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Ingredient 2' }));
    expect(screen.getAllByRole('group')).toHaveLength(1);
    expect(within(result()).getByText(/^ARS[  ]500.00$/)).toBeInTheDocument();
  });

  it('should show ingredient errors after leaving the field, and follow currency changes', async () => {
    const { user } = setup();
    const card = screen.getByRole('group', { name: 'Ingrediente 1' });
    await user.clear(within(card).getByRole('textbox', { name: /% de desecho/ }));
    await user.type(within(card).getByRole('textbox', { name: /% de desecho/ }), '100');
    await user.tab();
    expect(within(card).getByRole('alert')).toHaveTextContent('Tiene que ser menor que 100 %.');

    await user.clear(within(card).getByRole('textbox', { name: /Precio de compra/ }));
    await user.type(within(card).getByRole('textbox', { name: /Precio de compra/ }), '1,2,3');
    await user.tab();
    expect(within(card).getAllByRole('alert')[1]).toHaveTextContent('Escribí un número válido');

    act(() => {
      useSettingsStore.getState().update({ currency: 'USD' });
    });
    expect(
      within(card).getByRole('textbox', { name: 'Precio de compra (USD/kg)' }),
    ).toBeInTheDocument();
  });

  it('should require the yield and clear everything on reset', async () => {
    const { user } = setup();
    const servings = screen.getByRole('textbox', { name: /Rendimiento/ });
    await user.click(servings);
    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('Completá este dato.');

    await user.click(screen.getByRole('button', { name: /Cargar/ }));
    await user.click(screen.getByRole('button', { name: 'Limpiar datos' }));
    expect(screen.getAllByRole('group')).toHaveLength(1);
    expect(servings).toHaveValue('');
    expect(useDraftsStore.getState().drafts['recipe-costing']).toBeUndefined();
  });
});
