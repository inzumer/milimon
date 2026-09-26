import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setAnalyticsSink } from '@utils';
import { SiteMenu, type SiteMenuProps } from '../SiteMenu';

const props: SiteMenuProps = {
  lang: 'es',
  pathname: '/es/formulas/cooking-loss',
  groups: [
    { items: [{ href: '/es', label: 'Inicio' }] },
    {
      title: 'Administración gastronómica',
      items: [
        { href: '/es/calculator', label: 'Calculadora' },
        { href: '/es/formulas', label: 'Fórmulas' },
      ],
    },
    {
      title: 'Recetas y blog',
      items: [{ href: '/es/recipes', label: 'Recetas', badge: 'Próximamente' }],
    },
  ],
  labels: {
    open: 'Abrir menú',
    close: 'Cerrar menú',
    title: 'Menú',
    navigation: 'Navegación principal',
    preferences: 'Preferencias',
    language: 'Idioma',
    darkMode: 'Modo oscuro',
    currency: 'Moneda',
  },
  account: {
    loginHref: '/es/login',
    accountHref: '/es/account',
    adminHref: '/es/admin',
    labels: {
      title: 'Tu cuenta',
      signedInAs: 'Sesión iniciada como',
      signIn: 'Iniciar sesión',
      signOut: 'Cerrar sesión',
      account: 'Mi cuenta',
      admin: 'Administración',
      signedOutHint: 'Guardá tu configuración.',
    },
  },
};

const openMenu = async () => {
  const user = userEvent.setup();
  render(<SiteMenu {...props} />);
  await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
  return user;
};

describe('SiteMenu', () => {
  afterEach(() => {
    setAnalyticsSink(null);
  });

  it('should group the links under their section titles, with badges', async () => {
    await openMenu();
    const management = screen.getByRole('list', { name: 'Administración gastronómica' });
    expect(management).toHaveTextContent('Calculadora');
    const content = screen.getByRole('list', { name: 'Recetas y blog' });
    expect(content).toHaveTextContent('RecetasPróximamente');
    expect(screen.getByRole('link', { name: /Recetas/ })).toHaveAttribute('href', '/es/recipes');
  });

  it('should render a collapsed hamburger button', () => {
    render(<SiteMenu {...props} />);
    const trigger = screen.getByRole('button', { name: 'Abrir menú' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should open a modal dialog with the navigation and preferences', async () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    await openMenu();

    expect(screen.getByRole('dialog', { name: 'Menú' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Idioma' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Modo oscuro' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Moneda/ })).toHaveTextContent(/^ARS/);
    expect(sink).toHaveBeenCalledWith('menu_opened', {});
  });

  it('should mark only the exact current page with aria-current', async () => {
    await openMenu();
    expect(screen.getByRole('link', { name: 'Fórmulas' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  it('should move focus into the dialog', async () => {
    await openMenu();
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveFocus();
  });

  it('should close with the close button and return focus to the trigger', async () => {
    const user = await openMenu();
    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveFocus();
  });

  it('should close with Escape', async () => {
    const user = await openMenu();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('should lock page scroll while open', async () => {
    const user = await openMenu();
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.body.style.overflow).toBe(''));
  });
});
