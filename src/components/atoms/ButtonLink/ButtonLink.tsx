import type { AnchorHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '@inzumer/ui-library';
import { buttonLinkStyles, type ButtonLinkVariants } from './ButtonLink.styles';

export interface ButtonLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>, ButtonLinkVariants {
  href: string;
  children: ReactNode;
  ref?: Ref<HTMLAnchorElement>;
}

/** A navigation link that looks like a button. */
export const ButtonLink = ({ className, variant, size, children, ...props }: ButtonLinkProps) => (
  <a className={cn(buttonLinkStyles({ variant, size }), className)} {...props}>
    {children}
  </a>
);
