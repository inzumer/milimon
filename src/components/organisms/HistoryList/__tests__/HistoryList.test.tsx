import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getFormulaTranslation, getTranslations, toCalculatorText } from '@i18n';
import { useDraftsStore, useHistoryStore } from '@stores';
import { omnesEntry, wasteFactorEntry } from '@test/history-fixtures';
import { setAnalyticsSink } from '@utils';
import { FORMULA_IDS } from '@utils/formulas';
import { HistoryList } from '../HistoryList';

const labels = getTranslations('es', 'history-page').list;

const formulas = Object.fromEntries(
  FORMULA_IDS.map((id) => {
    const text = getFormulaTranslation('es', id);
    return [id, { title: text.title, outputs: text.outputs }];
  }),
);

const setup = (entries = [wasteFactorEntry(), omnesEntry()], accountHref?: string) => {
  useHistoryStore.getState().replaceAll(entries);
  const loadText = vi.fn(async (lang: 'es' | 'en', id: (typeof FORMULA_IDS)[number]) =>
    toCalculatorText(getFormulaTranslation(lang, id)),
  );
  const assign = vi.fn();
  vi.stubGlobal('location', { ...window.location, assign });
  render(
    <HistoryList
      lang="es"
      labels={labels}
      ui={getTranslations('es', 'calculator')}
      formulas={formulas}
      calculatorHref="/es/calculator"
      accountHref={accountHref}
      loadText={loadText}
    />,
  );
  return { user: userEvent.setup(), loadText, assign };
};

const plain = (text: string | null) => (text ?? '').replace(/[  ]/g, ' ');

describe('HistoryList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAnalyticsSink(null);
  });

  it('should list saved calculations, newest first, with their main result', () => {
    setup();
    const items = screen.getAllByRole('article');
    expect(items).toHaveLength(2);
    expect(within(items[0] as HTMLElement).getByRole('heading')).toHaveTextContent(
      'Factor de desecho',
    );
    expect(plain(items[0]?.textContent ?? '')).toContain('Factor de desecho:1,429');
    expect(screen.getByText('2 de 15 cálculos guardados')).toBeInTheDocument();
  });

  it('should show the whole calculation on demand, loading its texts once', async () => {
    const { user, loadText } = setup();
    const [show] = screen.getAllByRole('button', { name: labels.show });
    await user.click(show as HTMLElement);
    expect(
      await screen.findByRole('heading', { name: labels['inputs-title'] }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: labels.hide })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await user.click(screen.getByRole('button', { name: labels.hide }));
    await user.click(screen.getAllByRole('button', { name: labels.show })[0] as HTMLElement);
    expect(loadText).toHaveBeenCalledOnce();
  });

  it('should explain when the texts of a calculation cannot load', async () => {
    const { user, loadText } = setup();
    loadText.mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getAllByRole('button', { name: labels.show })[0] as HTMLElement);
    expect(await screen.findByRole('alert')).toHaveTextContent(labels.unavailable);
  });

  it('should reopen a calculation in the calculator with its values', async () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const { user, assign } = setup();
    await user.click(screen.getAllByRole('button', { name: labels.open })[0] as HTMLElement);
    expect(useDraftsStore.getState().drafts['waste-factor']).toStrictEqual({
      wastePercentage: '30',
    });
    expect(assign).toHaveBeenCalledWith('/es/calculator?tool=waste-factor');
    expect(sink).toHaveBeenCalledWith('history_opened', { formula: 'waste-factor' });
  });

  it('should delete a calculation and announce it', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /^Borrar Factor de desecho del/ }));
    expect(useHistoryStore.getState().entries).toHaveLength(1);
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(labels.deleted);
  });

  it('should follow changes made elsewhere, such as the account sync', () => {
    setup([]);
    expect(screen.getByText(labels.empty)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: labels['go-to-calculator'] })).toHaveAttribute(
      'href',
      '/es/calculator',
    );
    act(() => {
      useHistoryStore.getState().replaceAll([wasteFactorEntry()]);
    });
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('should invite guests to sign in when accounts are enabled', () => {
    setup([], '/es/account');
    expect(screen.getByRole('link', { name: labels['sign-in'] })).toHaveAttribute(
      'href',
      '/es/account',
    );
  });

  it('should fall back to the formula id and skip the summary when there is no headline', () => {
    setup([{ ...wasteFactorEntry(), formulaId: 'retired-formula', headline: null }]);
    expect(screen.getByRole('heading', { name: 'retired-formula' })).toBeInTheDocument();
  });
});
