import { render, screen, within } from '@testing-library/react';
import { getFormulaTranslation, getTranslations } from '@i18n';
import type { HistoryEntry } from '@stores';
import { omnesEntry, pricingEntry, recipeEntry, wasteFactorEntry } from '@test/history-fixtures';
import type { FormulaId } from '@utils/formulas';
import { SavedCalculation } from '../SavedCalculation';

const plain = (text: string | null) => (text ?? '').replace(/[  ]/g, ' ');

const renderEntry = (entry: HistoryEntry, formulaId = entry.formulaId as FormulaId) =>
  render(
    <SavedCalculation
      entry={entry}
      lang="es"
      text={getFormulaTranslation('es', formulaId)}
      ui={getTranslations('es', 'calculator')}
      labels={getTranslations('es', 'history-page').list}
    />,
  );

describe('SavedCalculation', () => {
  it('should show the inputs as typed, the result and the steps of a standard formula', () => {
    const { container } = renderEntry(wasteFactorEntry());
    expect(screen.getByRole('heading', { name: 'Lo que cargaste' })).toBeInTheDocument();
    expect(plain(container.textContent)).toContain('30 %');
    expect(screen.getByRole('heading', { name: 'Resultado' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Desarrollo de la cuenta' })).toBeInTheDocument();
    expect(plain(container.textContent)).toContain('1,429');
  });

  it('should show toggles as yes or no and skip empty fields', () => {
    const entry = pricingEntry();
    const { container } = renderEntry(entry);
    const toggle = Object.entries(entry.draft).find(([, value]) => typeof value === 'boolean');
    expect(toggle).toBeDefined();
    expect(within(container).getAllByText(/^(Sí|No)$/).length).toBeGreaterThan(0);
  });

  it('should show the ingredients and the cost table of a recipe', () => {
    renderEntry(recipeEntry());
    const tables = screen.getAllByRole('table');
    expect(tables).toHaveLength(2);
    expect(
      within(tables[0] as HTMLElement).getByRole('rowheader', { name: 'Lomo' }),
    ).toBeInTheDocument();
    expect(plain(tables[0]?.textContent ?? '')).toContain('1,8 kg');
    expect(plain(tables[0]?.textContent ?? '')).toContain('10000 ARS');
  });

  it("should show the price list and the verdicts of Omnes' rules", () => {
    const { container } = renderEntry(omnesEntry());
    expect(plain(container.textContent)).toContain('40 · 50 · 80');
    expect(plain(container.textContent)).toContain('60 ARS');
    expect(plain(container.textContent)).toContain('Precio promedio de la oferta');
  });

  it('should show a message instead of breaking on an unknown saved formula', () => {
    // React reports the caught render error; the boundary is the behavior under test.
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderEntry({ ...wasteFactorEntry(), formulaId: 'retired-formula' }, 'waste-factor');
    expect(screen.getByRole('alert')).toHaveTextContent('No se puede mostrar este cálculo');
    error.mockRestore();
  });
});
