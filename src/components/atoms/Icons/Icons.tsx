import type { CSSProperties } from 'react';
import { cn } from '@inzumer/ui-library';
import arrowRight from '@assets/icons/arrow-right.svg?url';
import bookmarkFilled from '@assets/icons/bookmark-filled.svg?url';
import bookmark from '@assets/icons/bookmark.svg?url';
import bread from '@assets/icons/bread.svg?url';
import cup from '@assets/icons/cup.svg?url';
import cupcake from '@assets/icons/cupcake.svg?url';
import menu from '@assets/icons/menu.svg?url';
import pot from '@assets/icons/pot.svg?url';
import share from '@assets/icons/share.svg?url';
import sparkle from '@assets/icons/sparkle.svg?url';

export interface IconProps {
  className?: string;
}

/**
 * Milimon's icon family: line SVGs in `src/assets/icons` (1.5 stroke, round ends, no fill), used
 * as a mask and painted with `currentColor`, so they follow the text color in light and dark mode.
 */
const svgIcon = (src: string) => {
  const mask = `url("${src}") center / contain no-repeat`;
  const style: CSSProperties = { mask, WebkitMask: mask };
  const SvgIcon = ({ className }: IconProps) => (
    <span
      aria-hidden
      className={cn('inline-block size-6 shrink-0 bg-current', className)}
      style={style}
    />
  );

  return SvgIcon;
};

export const ArrowRightIcon = svgIcon(arrowRight);
export const BookmarkFilledIcon = svgIcon(bookmarkFilled);
export const BookmarkIcon = svgIcon(bookmark);
export const BreadIcon = svgIcon(bread);
export const CupIcon = svgIcon(cup);
export const CupcakeIcon = svgIcon(cupcake);
export const MenuIcon = svgIcon(menu);
export const PotIcon = svgIcon(pot);
export const ShareIcon = svgIcon(share);
export const SparkleIcon = svgIcon(sparkle);
