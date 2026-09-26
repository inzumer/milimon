import type { HTMLAttributes } from 'react';
import { cn, RichText } from '@inzumer/ui-library';

export type SectionLabelProps = HTMLAttributes<HTMLHeadingElement>;

/**
 * Title of a group inside a menu or panel ("Recipes", "Preferences"): accent color, small caps and
 * a rule to its right, so it reads as a label and not as something to click.
 */
export const SectionLabel = ({ className, children, ...props }: SectionLabelProps) => (
  <RichText
    variant="h3"
    className={cn(
      'flex cursor-default items-center gap-3 text-xs font-bold tracking-widest text-[var(--text-accent)] uppercase select-none',
      'after:h-px after:flex-1 after:bg-[var(--border-default)] after:content-[""]',
      className,
    )}
    {...props}
  >
    {children}
  </RichText>
);
