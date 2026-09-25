import { cva } from 'class-variance-authority';

export const navLinkStyles = cva(
  [
    'flex min-h-11 items-center rounded-lg px-3 text-lg font-semibold no-underline',
    'text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
  ],
  {
    variants: {
      active: {
        true: 'bg-[var(--surface-secondary)] underline decoration-[var(--color-primary-500)] decoration-4 underline-offset-8',
        false: '',
      },
    },
  },
);
