import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Mirrors ui-library's `buttonStyles` (same semantic CSS variables) for anchors: the library's
 * `Button` types `asChild` but doesn't implement it yet, and a link must stay an `<a>`.
 * Candidate to upstream (phase F9).
 */
export const buttonLinkStyles = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold leading-none no-underline',
    'rounded-lg',
    'transition-colors duration-150 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
    'select-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]',
          'border border-[var(--btn-primary-border)]',
          'hover:bg-[var(--btn-primary-bg-hover)] hover:text-[var(--btn-primary-text)]',
          'active:bg-[var(--btn-primary-bg-active)]',
        ],
        secondary: [
          'bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)]',
          'border border-[var(--btn-secondary-border)]',
          'hover:bg-[var(--btn-secondary-bg-hover)] hover:text-[var(--btn-secondary-text)]',
          'active:bg-[var(--btn-secondary-bg-active)]',
        ],
      },
      size: {
        md: 'min-h-11 px-4 text-base',
        lg: 'min-h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonLinkVariants = VariantProps<typeof buttonLinkStyles>;
