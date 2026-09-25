import { cn } from '@inzumer/ui-library';
import { isActivePath } from '@utils';
import { navLinkStyles } from './SiteMenu.styles';

export interface SiteMenuItem {
  href: string;
  label: string;
  /** Sub-links shown in a collapsible group (e.g. every formula). */
  children?: SiteMenuItem[];
}

const normalize = (path: string) => path.replace(/\/+$/, '') || '/';

/** A main-menu entry: a link, or a native <details> group (keyboard accessible, no extra JS). */
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
    <details open={inSection} className="group">
      <summary
        className={cn(
          navLinkStyles({ active: inSection }),
          'cursor-pointer list-none justify-between [&::-webkit-details-marker]:hidden',
        )}
      >
        {item.label}
        <span
          aria-hidden="true"
          className="inline-block transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
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
    </details>
  );
};
