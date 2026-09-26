import { render, screen } from '@testing-library/react';
import { FeatureCard } from '../FeatureCard';

const props = {
  title: 'Calculadora',
  description: 'Elegí la cuenta que necesitás.',
  href: '/es/calculator',
  cta: 'Ir a la calculadora',
  ctaId: 'home-link-calculator',
};

describe('FeatureCard', () => {
  it('should render the title as a heading, the description and the tracked call to action', () => {
    render(<FeatureCard {...props} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Calculadora' })).toBeInTheDocument();
    expect(screen.getByText('Elegí la cuenta que necesitás.')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Ir a la calculadora' });
    expect(link).toHaveAttribute('href', '/es/calculator');
    expect(link).toHaveAttribute('id', 'home-link-calculator');
  });

  it('should support a custom heading level and the highlighted style', () => {
    render(<FeatureCard {...props} headingLevel="h2" highlighted />);
    expect(screen.getByRole('heading', { level: 2, name: 'Calculadora' })).toBeInTheDocument();
  });

  it('should show a pill above the title when given a badge', () => {
    render(<FeatureCard {...props} badge="Destacado" />);
    expect(screen.getByText('Destacado')).toBeInTheDocument();
  });
});
