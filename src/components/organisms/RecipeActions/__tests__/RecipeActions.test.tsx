import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTranslations } from '@i18n';
import { useSavedRecipesStore } from '@stores';
import { setAnalyticsSink } from '@utils';
import { RecipeActions } from '../RecipeActions';

const labels = getTranslations('en', 'recipe-page').actions;
const HREF = '/milimon/en/recipes/lemon-loaf';

describe('RecipeActions', () => {
  afterEach(() => {
    setAnalyticsSink(null);
    vi.unstubAllGlobals();
  });

  it('should save the recipe and remove it again, tracking each change', async () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    render(<RecipeActions recipeId="lemon-loaf" title="Lemon loaf" href={HREF} labels={labels} />);
    const save = screen.getByRole('button', { name: labels.save });
    expect(save).toHaveAttribute('aria-pressed', 'false');
    expect(save).toHaveAttribute('id', 'recipe-button-save-lemon-loaf');

    await userEvent.click(save);
    expect(screen.getByRole('button', { name: labels.saved })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(useSavedRecipesStore.getState().ids).toEqual(['lemon-loaf']);
    expect(sink).toHaveBeenCalledWith('recipe_saved', { recipe: 'lemon-loaf' });

    await userEvent.click(screen.getByRole('button', { name: labels.saved }));
    expect(useSavedRecipesStore.getState().ids).toEqual([]);
    expect(sink).toHaveBeenCalledWith('recipe_unsaved', { recipe: 'lemon-loaf' });
  });

  it('should share the absolute recipe link with the share sheet', async () => {
    const share = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { ...navigator, share });
    render(<RecipeActions recipeId="lemon-loaf" title="Lemon loaf" href={HREF} labels={labels} />);
    await userEvent.click(screen.getByRole('button', { name: labels.share }));
    expect(share).toHaveBeenCalledWith({
      title: 'Lemon loaf',
      url: new URL(HREF, window.location.href).href,
    });
  });

  it('should copy the link without a share sheet and say so', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } });
    Reflect.deleteProperty(navigator, 'share');
    render(
      <RecipeActions
        variant="floating"
        recipeId="lemon-loaf"
        title="Lemon loaf"
        href={HREF}
        labels={labels}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: labels.share }));
    expect(writeText).toHaveBeenCalledWith(new URL(HREF, window.location.href).href);
    expect(screen.getByRole('status')).toHaveTextContent(labels.copied);
  });

  it('should show round icon buttons named for assistive tech over a card', () => {
    render(
      <RecipeActions
        variant="floating"
        recipeId="scones"
        title="Scones"
        href="/en/recipes/scones"
        labels={labels}
      />,
    );
    const save = screen.getByRole('button', { name: labels.save });
    expect(save).toHaveTextContent('');
    expect(save).toHaveAttribute('id', 'recipes-button-save-scones');
  });
});
