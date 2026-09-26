import { cn, Image } from '@inzumer/ui-library';

export const MILICITOS_MAX = 5;

export interface MilicitosRatingProps {
  /** 1 to 5. */
  rating: number;
  /** Accessible name, e.g. "4 de 5 milicitos". */
  label: string;
  /** URL of the milicito (star) image, already resized by the page. */
  imageSrc: string;
  className?: string;
}

/** Our 1–5 rating in milicitos (Milimon stars): the earned ones in color, the rest faded. */
export const MilicitosRating = ({ rating, label, imageSrc, className }: MilicitosRatingProps) => (
  <span role="img" aria-label={label} className={cn('inline-flex items-center gap-1', className)}>
    {Array.from({ length: MILICITOS_MAX }, (_, index) => (
      <Image
        key={index}
        src={imageSrc}
        alt=""
        width={32}
        height={32}
        fit="contain"
        className={cn('size-8', index >= rating && 'opacity-25 grayscale')}
      />
    ))}
  </span>
);
