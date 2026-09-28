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

/** A real `<a>` styled as a ui-library `Button`, with a 44px touch target. */
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
