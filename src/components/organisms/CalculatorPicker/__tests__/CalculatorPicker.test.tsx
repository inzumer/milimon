import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  getFormulaTranslation,
  getTranslations,
  loadCalculatorText,
  toCalculatorText,
} from '@i18n';
import { setAnalyticsSink, type Locale } from '@utils';
import { FORMULA_GROUPS, formulasByGroup } from '@utils/formulas';
import { CalculatorPicker } from '../CalculatorPicker';

const groupsFor = (lang: Locale) =>
  FORMULA_GROUPS.map((group) => ({
    group,
    label: getTranslations(lang, 'formula-page').groups[group],
    formulas: formulasByGroup()[group].map((formula) => ({
      id: formula.id,
      title: getFormulaTranslation(lang, formula.id).title,
    })),
  }));

const setup = (
  lang: Locale = 'es',
  loadText = vi.fn((l: Locale, id: Parameters<typeof getFormulaTranslation>[1]) =>
    Promise.resolve(toCalculatorText(getFormulaTranslation(l, id))),
  ),
) => {
  render(
    <CalculatorPicker
      lang={lang}
      groups={groupsFor(lang)}
      page={getTranslations(lang, 'calculator-page')}
      ui={getTranslations(lang, 'calculator')}
      loadText={loadText}
    />,
  );

  return { user: userEvent.setup(), loadText };
};

describe('CalculatorPicker', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    setAnalyticsSink(null);
  });

  it('should list every formula grouped by topic and invite to pick one', () => {
    setup();
    const select = screen.getByRole('combobox', { name: '¿Qué querés calcular?' });
    expect(within(select).getAllByRole('option')).toHaveLength(15);
    expect(within(select).getByRole('group', { name: 'Desechos y mermas' })).toBeInTheDocument();
    expect(screen.getByText('Elegí una cuenta en la lista para empezar.')).toBeInTheDocument();
  });

  it('should load the picked calculator, remember it in the URL and link to its explanation', async () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const { user, loadText } = setup();

    await user.selectOptions(screen.getByRole('combobox'), 'cooking-loss');

    expect(await screen.findByRole('heading', { name: 'Merma de cocción' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Peso limpio (kg)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver la explicación/ })).toHaveAttribute(
      'href',
      '/es/formulas/cooking-loss',
    );
    expect(window.location.search).toBe('?tool=cooking-loss');
    expect(loadText).toHaveBeenCalledWith('es', 'cooking-loss');
    expect(sink).toHaveBeenCalledWith('tool_selected', { formula: 'cooking-loss' });
  });

  it('should open the tool given in the URL and render the custom calculators', async () => {
    window.history.replaceState(null, '', '/en/calculator?tool=omnes-rules');
    const { user } = setup('en');
    expect(await screen.findByRole('textbox', { name: /Menu prices/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('omnes-rules');

    await user.selectOptions(screen.getByRole('combobox'), 'recipe-costing');
    expect(await screen.findByRole('button', { name: 'Add ingredient' })).toBeInTheDocument();
  });

  it('should ignore unknown tools in the URL and report loading errors', async () => {
    window.history.replaceState(null, '', '/es/calculator?tool=calc-merma');
    const { user } = setup(
      'es',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    expect(screen.getByText('Elegí una cuenta en la lista para empezar.')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox'), 'waste-factor');
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar la calculadora.');
  });

  it('should load texts lazily without the study content', async () => {
    const text = await loadCalculatorText('en', 'rent-check');
    expect(text.title).toBe('Rent vs. revenue');
    expect(text).not.toHaveProperty('study');
    await expect(loadCalculatorText('en', 'nope' as never)).rejects.toThrow('Missing translation');
  });
});
