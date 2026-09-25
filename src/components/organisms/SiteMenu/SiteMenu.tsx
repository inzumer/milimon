import { useCallback, useId, useRef, useState } from 'react';
import { Button, useDelayedUnmount, useDismissableLayer } from '@inzumer/ui-library';
import { CloseIcon, MenuIcon } from '@components/atoms/Icons';
import { CurrencySelect } from '@components/molecules/CurrencySelect';
import { LanguageSwitcher } from '@components/molecules/LanguageSwitcher';
import { ThemeToggle } from '@components/molecules/ThemeToggle';
import { useFocusTrap, useScrollLock } from '@hooks';
import { track, type Locale } from '@utils';
import { NavEntry, type SiteMenuItem } from './NavEntry';
import { overlayStyles, panelStyles } from './SiteMenu.styles';

const EXIT_DURATION_MS = 200;

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
}

/** Hamburger button + side drawer with the main navigation, language and theme preferences. */
export const SiteMenu = ({ lang, pathname, items, labels }: SiteMenuProps) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const panelId = useId();
  const preferencesId = useId();
  const { mounted, visible } = useDelayedUnmount(open, EXIT_DURATION_MS);

  const close = useCallback(() => setOpen(false), []);
  const openMenu = () => {
    setOpen(true);
    track('menu_opened', {});
  };

  useDismissableLayer(open, close, panelRef);
  // The panel mounts one render after `open` flips (useDelayedUnmount), so trap once it exists.
  useFocusTrap(open && mounted, panelRef);
  useScrollLock(open);

  return (
    <>
      <Button
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

      {mounted && (
        <div className="fixed inset-0 z-50">
          <div aria-hidden="true" className={overlayStyles({ visible })} />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={panelStyles({ visible })}
          >
            <div className="flex items-center justify-between">
              <h2 id={titleId} className="text-3xl">
                {labels.title}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label={labels.close}
                onClick={close}
                className="size-11"
              >
                <CloseIcon aria-hidden="true" className="size-7" />
              </Button>
            </div>

            <nav aria-label={labels.navigation}>
              <ul className="flex flex-col gap-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <NavEntry item={item} pathname={pathname} />
                  </li>
                ))}
              </ul>
            </nav>

            <section aria-labelledby={preferencesId} className="mt-auto flex flex-col gap-4">
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
        </div>
      )}
    </>
  );
};
