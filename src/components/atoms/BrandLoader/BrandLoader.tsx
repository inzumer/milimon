import { Loader, type LoaderProps } from '@inzumer/ui-library';
import logo from '@assets/illustrations/logo-mark.webp';
import star from '@assets/illustrations/star-mark.webp';

const MARKS = { logo, star } as const;

export type BrandLoaderProps = Omit<LoaderProps, 'mark'> & {
  /** Milagros' logo (default) or the milicitos star. */
  mark?: keyof typeof MARKS;
};

/** The ui-library `Loader` with a brand mark: the logo pulses and the star spins by default. */
export const BrandLoader = ({ mark = 'logo', effect, ...props }: BrandLoaderProps) => (
  <Loader
    mark={<img src={MARKS[mark].src} alt="" className="rounded-full" />}
    effect={effect ?? (mark === 'star' ? 'spin' : 'pulse')}
    {...props}
  />
);
