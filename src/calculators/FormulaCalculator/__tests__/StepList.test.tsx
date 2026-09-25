import { render, screen } from '@testing-library/react';
import { StepList } from '../StepList';

describe('StepList', () => {
  it('should format each value by kind and fall back to the step id without a template', () => {
    render(
      <StepList
        steps={[
          { id: 'rent-share', values: { rent: 41_000, rentShare: 5.2 } },
          { id: 'unknown-step', values: {} },
        ]}
        templates={{ 'rent-share': '{rent} → {rentShare}' }}
        kinds={{ rent: 'currency', rentShare: 'percentage' }}
        context={{ lang: 'en', currency: 'USD' }}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('$41,000.00 → 5.2%');
    expect(items[1]).toHaveTextContent('unknown-step');
  });
});
