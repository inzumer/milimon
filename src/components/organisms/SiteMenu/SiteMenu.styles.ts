import { cva } from 'class-variance-authority';

export const overlayStyles = cva(
  'absolute inset-0 bg-[var(--surface-overlay)] transition-opacity duration-200 ease-out',
  {
    variants: { visible: { true: 'opacity-100', false: 'opacity-0' } },
  },
);

export const panelStyles = cva(
  [
    'absolute inset-y-0 right-0 flex w-full max-w-80 flex-col gap-6 overflow-y-auto',
    'border-l border-[var(--border-default)] bg-[var(--surface-primary)] p-6 shadow-xl',
    'transition-transform duration-200 ease-out focus:outline-none',
  ],
  {
    variants: { visible: { true: 'translate-x-0', false: 'translate-x-full' } },
  },
);

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
