import { useCallback, useId, useState } from 'react';
import { Button, Drawer } from '@inzumer/ui-library';
import { MenuIcon } from '@components/atoms/Icons';
import {
  AccountMenuSection,
  type AccountMenuSectionLabels,
} from '@components/molecules/AccountMenuSection';
import { CurrencySelect } from '@components/molecules/CurrencySelect';
import { LanguageSwitcher } from '@components/molecules/LanguageSwitcher';
import { ThemeToggle } from '@components/molecules/ThemeToggle';
import { track, trackingId, type Locale } from '@utils';
import { NavEntry, type SiteMenuItem } from './NavEntry';

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
  items: SiteMenuItem[];
  labels: SiteMenuLabels;
  account: { labels: AccountMenuSectionLabels; loginHref: string; accountHref: string };
}

/**
 * Hamburger button + side drawer (ui-library `Drawer`: focus trap, Escape/backdrop to close,
 * scroll lock) with the main navigation, language, theme and currency preferences.
 */
export const SiteMenu = ({ lang, pathname, items, labels, account }: SiteMenuProps) => {
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
        // Title row as tall as the site header and the same side padding, so the close button sits
        // exactly where the menu button is.
        className="px-4 pt-0 [&>div:first-child]:h-header [&>div:first-child]:shrink-0"
        closeLabel={labels.close}
        footer={
          <div className="flex flex-col gap-8">
            <AccountMenuSection
              labels={account.labels}
              loginHref={account.loginHref}
              accountHref={account.accountHref}
            />
            <section aria-labelledby={preferencesId} className="flex flex-col gap-4">
              <h3
                id={preferencesId}
                className="text-sm font-bold tracking-wide text-[var(--text-secondary)] uppercase"
              >
                {labels.preferences}
              </h3>
              <LanguageSwitcher lang={lang} pathname={pathname} label={labels.language} />
              <ThemeToggle label={labels.darkMode} />
              <CurrencySelect lang={lang} label={labels.currency} />
            </section>
          </div>
        }
      >
        <nav aria-label={labels.navigation}>
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <NavEntry item={item} pathname={pathname} />
              </li>
            ))}
          </ul>
        </nav>
      </Drawer>
    </>
  );
};
