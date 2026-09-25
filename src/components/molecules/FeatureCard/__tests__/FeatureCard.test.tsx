import { render, screen } from '@testing-library/react';
import { FeatureCard } from '../FeatureCard';

const props = {
  title: 'Calculadora',
  description: 'Elegí la cuenta que necesitás.',
  href: '/es/calculator',
  cta: 'Ir a la calculadora',
};

describe('FeatureCard', () => {
  it('should render the title as a heading, the description and the call to action', () => {
    render(<FeatureCard {...props} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Calculadora' })).toBeInTheDocument();
    expect(screen.getByText('Elegí la cuenta que necesitás.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a la calculadora' })).toHaveAttribute(
      'href',
      '/es/calculator',
    );
  });

  it('should support a custom heading level and the highlighted style', () => {
    render(<FeatureCard {...props} headingLevel="h2" highlighted />);
    expect(screen.getByRole('heading', { level: 2, name: 'Calculadora' })).toBeInTheDocument();
  });
});
