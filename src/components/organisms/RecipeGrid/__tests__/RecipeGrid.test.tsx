import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTranslations } from '@i18n';
import { RecipeGrid, type RecipeGridItem } from '../RecipeGrid';

const text = getTranslations('en', 'recipe-page');
const labels = { ...text.index, categories: text.categories };

const card = (id: string, category: RecipeGridItem['category']): RecipeGridItem => ({
  id,
  category,
  alt: '',
  title: id,
  subtitle: text.categories[category],
  href: `/en/recipes/${id}`,
});

const ITEMS = [card('lemon-loaf', 'sweet'), card('scones', 'bread'), card('lemonade', 'drinks')];

const titles = () =>
  within(screen.getByRole('list'))
    .getAllByRole('link')
    .map((link) => link.textContent);

describe('RecipeGrid', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('should offer "All" and only the categories that have recipes, with stable ids', () => {
    render(<RecipeGrid items={ITEMS} labels={labels} />);
    const group = screen.getByRole('group', { name: labels['filter-label'] });
    const chips = within(group).getAllByRole('button');
    expect(chips.map((chip) => chip.textContent)).toEqual(['All', 'Sweet', 'Bakery', 'Drinks']);
    expect(chips[0]).toHaveAttribute('aria-pressed', 'true');
    expect(chips[1]).toHaveAttribute('id', 'recipes-button-filter-sweet');
    expect(chips[1]?.style.getPropertyValue('--badge-bg')).toBe('var(--category-sweet-bg)');
  });

  it('should filter the cards and keep the choice in the URL', async () => {
    render(<RecipeGrid items={ITEMS} labels={labels} />);
    await userEvent.click(screen.getByRole('button', { name: 'Drinks' }));
    expect(titles()).toEqual([expect.stringContaining('lemonade')]);
    expect(window.location.search).toBe('?category=drinks');
    await userEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(titles()).toHaveLength(3);
  });

  it('should open with the category in the URL and say when it has no recipes', () => {
    window.history.replaceState(null, '', '/?category=savory');
    render(<RecipeGrid items={ITEMS} labels={labels} />);
    expect(screen.getByText(labels['filter-empty'])).toBeInTheDocument();
  });

  it('should hide the filter when there is a single category', () => {
    render(<RecipeGrid items={ITEMS.slice(0, 1)} labels={labels} />);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(titles()).toHaveLength(1);
  });
});
