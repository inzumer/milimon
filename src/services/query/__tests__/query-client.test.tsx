import { render, screen } from '@testing-library/react';
import { QueryProvider } from '@components/atoms/QueryProvider';
import { AdminPanel } from '@components/organisms/AdminPanel';
import { AgendaPanel } from '@components/organisms/AgendaPanel';
import { getTranslations } from '@i18n';
import type { AccountSession } from '@services/account';
import { createFakeAccountBackend, TEST_USER } from '@test/fake-account-backend';
import { getQueryClient, queryKeys, resetQueryClient } from '../query-client';

describe('query client', () => {
  it('should share one cache per page and start over after a reset', () => {
    const client = getQueryClient();
    expect(getQueryClient()).toBe(client);
    expect(client.getDefaultOptions().queries).toMatchObject({ retry: false });
    resetQueryClient();
    expect(getQueryClient()).not.toBe(client);
  });

  it('should nest every agenda and admin key under its group, for invalidation', () => {
    expect(queryKeys.agenda('2026-10-01', '2027-03-30').slice(0, 1)).toEqual(queryKeys.agendaAll);
    expect(queryKeys.adminUsers('ada', 2).slice(0, 1)).toEqual(queryKeys.adminAll);
    expect(queryKeys.roleChanges(1).slice(0, 1)).toEqual(queryKeys.adminAll);
  });

  it('should ask the API who is signed in once for every island on the page', async () => {
    const backend = createFakeAccountBackend({ user: { ...TEST_USER, role: 'admin' } });
    const session = { backend } as unknown as AccountSession;
    const loadSession = () => session;
    render(
      <>
        <AdminPanel
          lang="en"
          labels={getTranslations('en', 'admin-page')}
          loginHref="/en/login"
          loadSession={loadSession}
        />
        <AgendaPanel
          lang="en"
          labels={getTranslations('en', 'agenda-page')}
          accessLabels={getTranslations('en', 'admin-page')}
          loginHref="/en/login"
          loadSession={loadSession}
          today={new Date(2026, 9, 2, 10)}
        />
      </>,
    );

    expect(await screen.findByText(getTranslations('en', 'agenda-page').empty)).toBeInTheDocument();
    expect(backend.fetchMe).toHaveBeenCalledTimes(1);
  });

  it('should render its children inside the shared provider', () => {
    render(<QueryProvider>Milimon</QueryProvider>);
    expect(screen.getByText('Milimon')).toBeInTheDocument();
  });
});
