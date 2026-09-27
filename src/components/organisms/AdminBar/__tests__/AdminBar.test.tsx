import { act, render, screen } from '@testing-library/react';
import { getTranslations } from '@i18n';
import { sessionStoreWith } from '@test/session-store';
import { AdminBar } from '../AdminBar';

const labels = getTranslations('es', 'common')['admin-bar'];

describe('AdminBar', () => {
  it('should stay hidden for visitors and regular accounts', () => {
    for (const role of [null, 'user'] as const) {
      const { container, unmount } = render(
        <AdminBar labels={labels} href="/es/admin" store={sessionStoreWith(role)} />,
      );
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });

  it('should show management mode and the role to editors and admins', () => {
    render(<AdminBar labels={labels} href="/es/admin" store={sessionStoreWith('editor')} />);

    const bar = screen.getByRole('complementary', { name: 'Modo gestión' });
    expect(bar).toHaveTextContent('Rol: Editor');
    expect(screen.getByRole('link', { name: /Modo gestión/ })).toHaveAttribute('href', '/es/admin');
  });

  it('should disappear when the session ends', () => {
    const store = sessionStoreWith('admin');
    render(<AdminBar labels={labels} href="/es/admin" store={store} />);
    expect(screen.getByText('Rol: Admin')).toBeInTheDocument();

    act(() => store.clear());

    expect(screen.queryByText('Rol: Admin')).not.toBeInTheDocument();
  });
});
