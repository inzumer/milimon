import { render, screen } from '@testing-library/react';
import { SectionLabel } from '../SectionLabel';

describe('SectionLabel', () => {
  it('should render a level-3 heading in the accent color, not a link', () => {
    render(<SectionLabel id="recipes">Recetas</SectionLabel>);
    const heading = screen.getByRole('heading', { level: 3, name: 'Recetas' });
    expect(heading).toHaveAttribute('id', 'recipes');
    expect(heading.className).toContain('text-[var(--text-accent)]');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
