import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createLocalSettingsRepository } from '@repositories';
import { createMemoryStorage } from '@test/memory-storage';
import { setAnalyticsSink } from '@utils';
import { LanguageSwitcher } from '../LanguageSwitcher';

const setup = (pathname = '/es/formulas/cooking-loss') => {
  const navigate = vi.fn();
  const repository = createLocalSettingsRepository(createMemoryStorage());
  render(
    <LanguageSwitcher
      lang="es"
      pathname={pathname}
      label="Idioma"
      navigate={navigate}
      repository={repository}
    />,
  );
  return { navigate, repository, user: userEvent.setup() };
};

describe('LanguageSwitcher', () => {
  afterEach(() => {
    setAnalyticsSink(null);
  });

  it('should expose a labelled group with the current language selected', () => {
    setup();
    expect(screen.getByRole('listbox', { name: 'Idioma' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ES' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'EN' })).toHaveAttribute('aria-selected', 'false');
  });

  it('should navigate to the same route in the other language and remember it', async () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const { navigate, repository, user } = setup();

    await user.click(screen.getByRole('option', { name: 'EN' }));

    expect(navigate).toHaveBeenCalledWith('/en/formulas/cooking-loss');
    expect(repository.load().locale).toBe('en');
    expect(sink).toHaveBeenCalledWith('language_changed', { from: 'es', to: 'en' });
  });

  it('should do nothing when the current language is picked again', async () => {
    const { navigate, user } = setup();
    await user.click(screen.getByRole('option', { name: 'ES' }));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should navigate with a full page load by default', async () => {
    const user = userEvent.setup();
    const assign = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, hash: '', assign });
    render(<LanguageSwitcher lang="es" pathname="/es" label="Idioma" />);

    await user.click(screen.getByRole('option', { name: 'EN' }));

    expect(assign).toHaveBeenCalledWith('/en');
    vi.restoreAllMocks();
  });
});
