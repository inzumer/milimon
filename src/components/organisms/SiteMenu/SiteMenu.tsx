import { useCallback, useId, useState } from 'react';
import { Button, Drawer, RichText } from '@inzumer/ui-library';
import { MenuIcon } from '@components/atoms/Icons';
import { SectionLabel } from '@components/atoms/SectionLabel';
import {
  AccountMenuSection,
  type AccountMenuSectionLabels,
} from '@components/molecules/AccountMenuSection';
import { LanguageSwitcher } from '@components/molecules/LanguageSwitcher';
import { ThemeToggle } from '@components/molecules/ThemeToggle';
import { useAccountUser } from '@hooks';
import { ADMIN_SECTION_ROLES, createSessionStore, type SessionStore } from '@services/account';
import { track, trackingId, type Locale } from '@utils';
import { NavEntry, type SiteMenuGroup } from './NavEntry';

export interface SiteMenuLabels {
  open: string;
  close: string;
  title: string;
  navigation: string;
  preferences: string;
  language: string;
  languageHint: string;
  darkMode: string;
  darkModeHint: string;
}

export interface SiteMenuProps {
  lang: Locale;
  pathname: string;
  groups: SiteMenuGroup[];
  /** Site management links, shown only to editors and admins. */
  adminGroup: SiteMenuGroup;
  labels: SiteMenuLabels;
  account: {
    labels: AccountMenuSectionLabels;
    loginHref: string;
    accountHref: string;
  };
  store?: SessionStore;
}

/** Hamburger and side drawer: navigation, management links for editors and admins, preferences. */
export const SiteMenu = ({
  lang,
  pathname,
  groups,
  adminGroup,
  labels,
  account,
  store = createSessionStore(),
}: SiteMenuProps) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const preferencesId = useId();
  const user = useAccountUser(store);
  const visibleGroups =
    user && ADMIN_SECTION_ROLES.includes(user.role) ? [...groups, adminGroup] : groups;

  const close = useCallback(() => setOpen(false), []);
  const openMenu = () => {
    setOpen(true);
    track('menu_opened', {});
  };

  return (
    <>
      <Button
        id={trackingId('menu', 'button', 'open')}
        variant="ghost"
        size="icon"
        aria-label={labels.open}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={openMenu}
        className="size-11"
      >
        <MenuIcon aria-hidden="true" className="size-7" />
      </Button>

      <Drawer
        id={panelId}
        open={open}
        onClose={close}
        title={labels.title}
        titleClassName="font-display text-3xl"
        className="w-[85vw] max-w-none px-4 pt-0 md:w-full md:max-w-80 [&>div:first-child]:h-header [&>div:first-child]:shrink-0"
        closeLabel={labels.close}
        footer={
          <div className="flex flex-col gap-8">
            <AccountMenuSection
              labels={account.labels}
              loginHref={account.loginHref}
              accountHref={account.accountHref}
              store={store}
            />
            <section aria-labelledby={preferencesId} className="flex flex-col gap-4">
              <SectionLabel id={preferencesId}>{labels.preferences}</SectionLabel>
              <div className="flex items-center justify-between gap-4">
                <RichText as="div" className="flex flex-col">
                  <RichText as="span" variant="s2" className="font-semibold">
                    {labels.language}
                  </RichText>
                  <RichText
                    as="span"
                    id={`${preferencesId}-language`}
                    variant="s4"
                    className="text-[var(--text-secondary)]"
                  >
                    {labels.languageHint}
                  </RichText>
                </RichText>
                <LanguageSwitcher
                  lang={lang}
                  pathname={pathname}
                  label={labels.language}
                  describedBy={`${preferencesId}-language`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <ThemeToggle label={labels.darkMode} describedBy={`${preferencesId}-dark-mode`} />
                <RichText
                  as="span"
                  id={`${preferencesId}-dark-mode`}
                  variant="s4"
                  className="text-[var(--text-secondary)]"
                >
                  {labels.darkModeHint}
                </RichText>
              </div>
            </section>
          </div>
        }
      >
        <nav aria-label={labels.navigation} className="flex flex-col gap-6">
          {visibleGroups.map((group, index) => (
            <div key={group.title ?? group.items[0]?.href} className="flex flex-col gap-2">
              {group.title && (
                <SectionLabel id={`${panelId}-group-${index}`} className="px-3">
                  {group.title}
                </SectionLabel>
              )}
              <ul
                className="flex flex-col gap-1"
                aria-labelledby={group.title ? `${panelId}-group-${index}` : undefined}
              >
                {group.items.map((item) => (
                  <li key={item.href}>
                    <NavEntry item={item} pathname={pathname} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </Drawer>
    </>
  );
};
