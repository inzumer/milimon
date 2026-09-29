import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTranslations } from '@i18n';
import { CalculatorLayout } from '../CalculatorLayout';

const ui = getTranslations('en', 'calculator');

describe('CalculatorLayout', () => {
  it('should load examples, run the extra actions and reset', async () => {
    const user = userEvent.setup();
    const onLoad = vi.fn();
    const onReset = vi.fn();
    const onAdd = vi.fn();
    render(
      <CalculatorLayout
        scope="waste-factor"
        lang="en"
        ui={ui}
        examples={[{ id: 'cafe', label: 'Café', onLoad }]}
        onReset={onReset}
        actions={
          <button type="button" onClick={onAdd}>
            Add
          </button>
        }
        result={null}
      >
        <input aria-label="Field" />
      </CalculatorLayout>,
    );

    await user.click(screen.getByRole('button', { name: `${ui['load-example']}: Café` }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: ui.reset }));
    expect(onLoad).toHaveBeenCalledOnce();
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: ui.reset })).toHaveAttribute(
      'id',
      'waste-factor-button-reset',
    );
    expect(screen.getByText(ui['empty-result'])).toBeInTheDocument();
  });

  it('should show the result with the option to save it', () => {
    render(
      <CalculatorLayout
        scope="waste-factor"
        lang="en"
        ui={ui}
        examples={[]}
        onReset={() => undefined}
        result={{
          view: <p>Result view</p>,
          save: {
            formulaId: 'waste-factor',
            draft: {},
            currency: 'EUR',
            result: { value: {}, steps: [] },
          },
        }}
      >
        <input aria-label="Field" />
      </CalculatorLayout>,
    );

    expect(screen.getByText('Result view')).toBeInTheDocument();
    expect(screen.queryByText(ui['empty-result'])).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: ui.history.save })).toBeInTheDocument();
  });
});
