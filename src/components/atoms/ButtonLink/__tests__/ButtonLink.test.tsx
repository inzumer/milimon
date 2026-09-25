import { render, screen } from '@testing-library/react';
import { ButtonLink } from '../ButtonLink';

describe('ButtonLink', () => {
  it('renders a link with its href and accessible name', () => {
    render(<ButtonLink href="/es/calculator">Ir a la calculadora</ButtonLink>);
    expect(screen.getByRole('link', { name: 'Ir a la calculadora' })).toHaveAttribute(
      'href',
      '/es/calculator',
    );
  });

  it('merges custom classes and forwards attributes', () => {
    render(
      <ButtonLink href="/es" variant="secondary" size="lg" className="w-full" aria-current="page">
        Inicio
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Inicio' });
    expect(link).toHaveClass('w-full');
    expect(link).toHaveAttribute('aria-current', 'page');
  });
});
