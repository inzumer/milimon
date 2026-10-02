import { Loader, type LoaderProps } from '@inzumer/ui-library';
import logo from '@assets/illustrations/logo-mark.webp';
import star from '@assets/illustrations/star-mark.webp';
import { LOADER_MESSAGE_MS } from '@constants';
import { getTranslations } from '@i18n/translations';
import { pageLocale } from '@utils';

const MARKS = { logo, star } as const;

export type BrandLoaderProps = Omit<LoaderProps, 'mark' | 'label'> & {
  /** Milagros' logo (default) or the milicitos star. */
  mark?: keyof typeof MARKS;
  /** What is loading; with `screen`, a generic "one moment" when left out. */
  label?: string;
};

/**
 * The ui-library `Loader` with a brand mark: the logo pulses and the star spins by default.
 * With `screen` it covers the page and rotates cooking one-liners in the page language.
 */
export const BrandLoader = ({
  mark = 'logo',
  effect,
  screen,
  label,
  ...props
}: BrandLoaderProps) => {
  const wait = screen ? getTranslations(pageLocale(), 'loader') : null;

  return (
    <Loader
      mark={<img src={MARKS[mark].src} alt="" className="rounded-full" />}
      effect={effect ?? (mark === 'star' ? 'spin' : 'pulse')}
      label={label ?? wait?.label ?? ''}
      {...(wait && {
        screen: true,
        size: 'xl' as const,
        messages: wait.messages,
        messageInterval: LOADER_MESSAGE_MS,
      })}
      {...props}
    />
  );
};
