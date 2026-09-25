import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Button, cn } from '@inzumer/ui-library';

const SIZE_CLASSES = {
  md: 'min-h-11 px-4 text-base font-semibold',
  lg: 'min-h-12 px-6 text-lg font-semibold',
} as const;

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: keyof typeof SIZE_CLASSES;
}

/**
 * A navigation link styled as a ui-library `Button` (`asChild`), with a touch target of at least
 * 44px. It stays a real `<a>` so it works without JavaScript and in static pages.
 */
export const ButtonLink = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonLinkProps) => (
  <Button asChild variant={variant} className={cn(SIZE_CLASSES[size], 'no-underline', className)}>
    <a {...props}>{children}</a>
  </Button>
);
