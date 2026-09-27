import { render, screen } from '@testing-library/react';
import { getTranslations } from '@i18n';
import { sessionStoreWith } from '@test/session-store';
import { AdminGate } from '../AdminGate';

const labels = getTranslations('en', 'admin-page');

const renderGate = (role: Parameters<typeof sessionStoreWith>[0]) =>
  render(
    <AdminGate labels={labels} loginHref="/en/login" store={sessionStoreWith(role)}>
      <p>Internal guide</p>
    </AdminGate>,
  );

describe('AdminGate', () => {
  it('should show the content to editors and admins', () => {
    renderGate('editor');
    expect(screen.getByText('Internal guide')).toBeInTheDocument();
  });

  it('should ask visitors to sign in', () => {
    renderGate(null);
    expect(screen.queryByText('Internal guide')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: labels['sign-in'] })).toHaveAttribute(
      'href',
      '/en/login',
    );
  });

  it('should keep regular accounts out', () => {
    renderGate('user');
    expect(screen.queryByText('Internal guide')).not.toBeInTheDocument();
    expect(screen.getByText(labels.forbidden)).toBeInTheDocument();
  });
});
