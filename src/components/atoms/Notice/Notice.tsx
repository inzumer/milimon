import { cn, RichText, type RichTextProps } from '@inzumer/ui-library';

/** Message box for statuses, errors and "not available" states. */
export const Notice = ({ className, ...props }: RichTextProps) => (
  <RichText className={cn('rounded-lg bg-[var(--surface-secondary)] p-4', className)} {...props} />
);
