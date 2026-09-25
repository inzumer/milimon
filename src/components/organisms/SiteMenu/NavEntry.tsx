import { Accordion, cn } from '@inzumer/ui-library';
import { isActivePath } from '@utils';
import { navLinkStyles } from './SiteMenu.styles';

export interface SiteMenuItem {
  href: string;
  label: string;
  /** Sub-links shown in a collapsible group (e.g. every formula). */
  children?: SiteMenuItem[];
}

const normalize = (path: string) => path.replace(/\/+$/, '') || '/';

/** A main-menu entry: a link, or a collapsible group (ui-library `Accordion`, native `<details>`). */
export const NavEntry = ({ item, pathname }: { item: SiteMenuItem; pathname: string }) => {
  const current = normalize(pathname) === normalize(item.href);
  const inSection = isActivePath(pathname, item.href);

  if (!item.children) {
    return (
      <a
        href={item.href}
        aria-current={current ? 'page' : undefined}
        className={navLinkStyles({ active: inSection })}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Accordion
      open={inSection}
      summary={item.label}
      summaryClassName={navLinkStyles({ active: inSection })}
      contentClassName="px-0"
    >
      <ul className="mt-1 flex flex-col gap-1 border-l-2 border-[var(--border-default)] pl-3">
        {item.children.map((child) => {
          const childCurrent = normalize(pathname) === normalize(child.href);
          return (
            <li key={child.href}>
              <a
                href={child.href}
                aria-current={childCurrent ? 'page' : undefined}
                className={cn(navLinkStyles({ active: childCurrent }), 'text-base font-medium')}
              >
                {child.label}
              </a>
            </li>
          );
        })}
      </ul>
    </Accordion>
  );
};
