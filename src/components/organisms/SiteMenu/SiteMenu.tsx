import { useCallback, useId, useState } from 'react';
import { Button, Drawer } from '@inzumer/ui-library';
import { MenuIcon } from '@components/atoms/Icons';
import { SectionLabel } from '@components/atoms/SectionLabel';
import {
  AccountMenuSection,
  type AccountMenuSectionLabels,
} from '@components/molecules/AccountMenuSection';
import { CurrencySelect } from '@components/molecules/CurrencySelect';
import { LanguageSwitcher } from '@components/molecules/LanguageSwitcher';
import { ThemeToggle } from '@components/molecules/ThemeToggle';
import { track, trackingId, type Locale } from '@utils';
import { NavEntry, type SiteMenuGroup } from './NavEntry';

export interface SiteMenuLabels {
  open: string;
  close: string;
  title: string;
  navigation: string;
  preferences: string;
  language: string;
  darkMode: string;
  currency: string;
}

export interface SiteMenuProps {
  lang: Locale;
  pathname: string;
  groups: SiteMenuGroup[];
  labels: SiteMenuLabels;
  account: { labels: AccountMenuSectionLabels; loginHref: string; accountHref: string };
}

/**
 * Hamburger button + side drawer (ui-library `Drawer`: focus trap, Escape/backdrop to close,
 * scroll lock) with the main navigation, language, theme and currency preferences.
 */
export const SiteMenu = ({ lang, pathname, groups, labels, account }: SiteMenuProps) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const preferencesId = useId();

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
            />
            <section aria-labelledby={preferencesId} className="flex flex-col gap-4">
              <SectionLabel id={preferencesId}>{labels.preferences}</SectionLabel>
              <LanguageSwitcher lang={lang} pathname={pathname} label={labels.language} />
              <ThemeToggle label={labels.darkMode} />
              <CurrencySelect lang={lang} label={labels.currency} />
            </section>
          </div>
        }
      >
        <nav aria-label={labels.navigation} className="flex flex-col gap-6">
          {groups.map((group, index) => (
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
