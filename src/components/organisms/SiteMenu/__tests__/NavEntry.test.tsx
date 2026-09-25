import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavEntry, type SiteMenuItem } from '../NavEntry';

const formulas: SiteMenuItem = {
  href: '/es/formulas',
  label: 'Fórmulas',
  children: [
    { href: '/es/formulas', label: 'Todas las fórmulas' },
    { href: '/es/formulas/cooking-loss', label: 'Merma de cocción' },
    { href: '/es/formulas/waste-factor', label: 'Factor de desecho' },
  ],
};

describe('NavEntry', () => {
  it('should render a plain link marked as the current page only on exact match', () => {
    const { rerender } = render(
      <NavEntry
        item={{ href: '/es/calculator', label: 'Calculadora' }}
        pathname="/es/calculator/"
      />,
    );
    expect(screen.getByRole('link', { name: 'Calculadora' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    rerender(<NavEntry item={{ href: '/es/calculator', label: 'Calculadora' }} pathname="/es" />);
    expect(screen.getByRole('link', { name: 'Calculadora' })).not.toHaveAttribute('aria-current');
  });

  it('should open the group inside its section and mark the current child', () => {
    const { container } = render(<NavEntry item={formulas} pathname="/es/formulas/cooking-loss" />);
    expect(container.querySelector('details')).toHaveAttribute('open');
    expect(screen.getByRole('link', { name: 'Merma de cocción' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Factor de desecho' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('should keep the group closed elsewhere and open it from its summary', async () => {
    const user = userEvent.setup();
    const { container } = render(<NavEntry item={formulas} pathname="/es" />);
    const details = container.querySelector('details');
    expect(details).not.toHaveAttribute('open');

    await user.click(screen.getByText('Fórmulas'));
    expect(details).toHaveAttribute('open');
  });
});
