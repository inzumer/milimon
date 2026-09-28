import type { HTMLAttributes } from 'react';
import { cn, RichText } from '@inzumer/ui-library';

export type SectionLabelProps = HTMLAttributes<HTMLHeadingElement>;

/** Group title in a menu or panel: accent small caps with a rule, not clickable. */
export const SectionLabel = ({ className, children, ...props }: SectionLabelProps) => (
  <RichText
    variant="h3"
    className={cn(
      'flex cursor-default items-center gap-3 text-xs font-bold tracking-widest text-[var(--text-accent)] uppercase select-none',
      'after:h-px after:min-w-8 after:flex-1 after:bg-[var(--border-default)] after:content-[""]',
      className,
    )}
    {...props}
  >
    {children}
  </RichText>
);
