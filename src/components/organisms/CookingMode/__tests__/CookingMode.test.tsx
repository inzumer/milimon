import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTranslations } from '@i18n';
import { setAnalyticsSink } from '@utils';
import { CookingMode } from '../CookingMode';

const labels = getTranslations('en', 'cooking-mode');
const STEPS = [
  { text: 'Whisk the eggs with the sugar.' },
  { text: 'Fold in the flour.', image: { src: '/step-2.webp', alt: 'Batter in a bowl' } },
  { text: 'Bake for 45 minutes.' },
];

const renderCooking = (steps = STEPS) =>
  render(
    <CookingMode
      recipeId="lemon-loaf"
      title="Lemon loaf"
      ingredients={['200 g Plain flour', '3 Eggs']}
      steps={steps}
      labels={labels}
    />,
  );

describe('CookingMode', () => {
  afterEach(() => setAnalyticsSink(null));

  it('should open on the first step and track the start', async () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    renderCooking();
    await userEvent.click(screen.getByRole('button', { name: labels.start }));
    expect(screen.getByRole('dialog', { name: `${labels.title} · Lemon loaf` })).toBeVisible();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Whisk the eggs with the sugar.')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByRole('button', { name: labels.previous })).toBeDisabled();
    expect(sink).toHaveBeenCalledWith('cooking_started', { recipe: 'lemon-loaf' });
  });

  it('should move with the buttons and the arrow keys, and finish on the last step', async () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const user = userEvent.setup();
    renderCooking();
    await user.click(screen.getByRole('button', { name: labels.start }));
    await user.click(screen.getByRole('button', { name: labels.next }));
    expect(screen.getByRole('img', { name: 'Batter in a bowl' })).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', { name: labels.finish }));
    expect(sink).toHaveBeenCalledWith('cooking_finished', { recipe: 'lemon-loaf' });
  });

  it('should tick off ingredients and close from the body', async () => {
    const user = userEvent.setup();
    renderCooking();
    await user.click(screen.getByRole('button', { name: labels.start }));
    await user.click(screen.getByText(labels.ingredients));
    const eggs = screen.getByRole('checkbox', { name: '3 Eggs' });
    await user.click(eggs);
    expect(eggs).toBeChecked();
    await user.click(eggs);
    expect(eggs).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: labels.close }));
    expect(screen.getByRole('button', { name: labels.start })).toBeInTheDocument();
  });

  it('should render nothing for a recipe without steps', () => {
    const { container } = renderCooking([]);
    expect(container).toBeEmptyDOMElement();
  });
});
