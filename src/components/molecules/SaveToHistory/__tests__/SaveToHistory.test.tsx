import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormulaCalculator } from '@components/organisms/FormulaCalculator';
import { OmnesCalculator } from '@components/organisms/OmnesCalculator';
import { RecipeCostingCalculator } from '@components/organisms/RecipeCostingCalculator';
import { getFormulaTranslation, getTranslations } from '@i18n';
import { useHistoryStore } from '@stores';
import { setAnalyticsSink } from '@utils';
import { headlineFor } from '@utils/history';

const ui = getTranslations('es', 'calculator');

const saved = () => useHistoryStore.getState().entries;

describe('SaveToHistory', () => {
  afterEach(() => {
    setAnalyticsSink(null);
  });

  it('should save the whole calculation once and allow saving again after a change', async () => {
    const user = userEvent.setup();
    const sink = vi.fn();
    setAnalyticsSink(sink);
    render(
      <FormulaCalculator
        formulaId="waste-factor"
        lang="es"
        text={getFormulaTranslation('es', 'waste-factor')}
        ui={ui}
      />,
    );
    expect(screen.queryByRole('button', { name: ui.history.save })).not.toBeInTheDocument();

    const field = screen.getByRole('textbox');
    await user.type(field, '30');
    await user.click(screen.getByRole('button', { name: ui.history.save }));

    const [entry] = saved();
    expect(entry).toMatchObject({
      formulaId: 'waste-factor',
      draft: { wastePercentage: '30' },
      currency: 'ARS',
      headline: { output: 'waste-factor', kind: 'factor' },
    });
    expect(entry?.result.steps.length).toBeGreaterThan(0);
    expect(sink).toHaveBeenCalledWith('calculation_saved', { formula: 'waste-factor' });
    expect(screen.getByRole('button', { name: ui.history.save })).toBeDisabled();
    expect(screen.getByRole('link', { name: ui.history.view })).toHaveAttribute(
      'href',
      '/es/history',
    );

    await user.clear(field);
    await user.type(field, '25');
    await user.click(screen.getByRole('button', { name: ui.history.save }));
    expect(saved()).toHaveLength(2);
  });

  it('should save recipes with their cost per portion as headline', async () => {
    const user = userEvent.setup();
    render(
      <RecipeCostingCalculator
        lang="es"
        text={getFormulaTranslation('es', 'recipe-costing')}
        ui={ui}
      />,
    );
    await user.click(screen.getAllByRole('button', { name: /^Cargar/ })[0] as HTMLElement);
    await user.click(screen.getByRole('button', { name: ui.history.save }));
    expect(saved()[0]).toMatchObject({
      formulaId: 'recipe-costing',
      headline: { output: 'portion-cost', kind: 'currency' },
    });
  });

  it("should save Omnes' rules with the average price as headline", async () => {
    const user = userEvent.setup();
    render(<OmnesCalculator lang="es" text={getFormulaTranslation('es', 'omnes-rules')} ui={ui} />);
    await user.click(screen.getAllByRole('button', { name: /^Cargar/ })[0] as HTMLElement);
    await user.click(screen.getByRole('button', { name: ui.history.save }));
    expect(saved()[0]).toMatchObject({
      formulaId: 'omnes-rules',
      headline: { output: 'average-price', kind: 'currency' },
    });
  });

  it('should have no headline when the main value is missing', () => {
    expect(headlineFor('waste-factor', {})).toBeNull();
    expect(headlineFor('omnes-rules', { averagePrice: 'n/a' })).toBeNull();
  });
});
