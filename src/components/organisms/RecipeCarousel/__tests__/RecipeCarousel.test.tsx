import { render, screen } from '@testing-library/react';
import { RecipeCarousel } from '../RecipeCarousel';

const labels = {
  featured: 'Featured',
  previous: 'Previous recipes',
  next: 'Next recipes',
  choose: 'Choose a recipe',
  'go-to': 'Recipe {n} of {total}',
};

describe('RecipeCarousel', () => {
  beforeAll(() => {
    window.matchMedia ??= ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })) as unknown as typeof window.matchMedia;
  });

  it('should show one linked card per recipe, with indicators and no arrows', () => {
    render(
      <RecipeCarousel
        labels={labels}
        items={[
          {
            id: 'lemon-loaf',
            alt: '',
            title: 'Lemon loaf',
            subtitle: 'Sweet · 70 min',
            href: '/en/recipes/lemon-loaf',
          },
          {
            id: 'scones',
            src: '/scones.webp',
            alt: 'Scones',
            title: 'Scones',
            subtitle: 'Sweet',
            href: '/en/recipes/scones',
          },
        ]}
      />,
    );
    const link = screen.getByRole('link', { name: 'Lemon loaf' });
    expect(link).toHaveAttribute('href', '/en/recipes/lemon-loaf');
    expect(link).toHaveAttribute('id', 'recipes-link-featured-lemon-loaf');
    expect(screen.getByRole('button', { name: 'Recipe 2 of 2' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next recipes' })).not.toBeInTheDocument();
  });
});
