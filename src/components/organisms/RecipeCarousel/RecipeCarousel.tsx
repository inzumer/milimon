import { Carousel, Showcase } from '@inzumer/ui-library';
import { interpolate, trackingId } from '@utils';

export interface RecipeCarouselItem {
  id: string;
  src?: string;
  alt: string;
  title: string;
  subtitle: string;
  href: string;
}

export interface RecipeCarouselProps {
  items: RecipeCarouselItem[];
  labels: { featured: string; previous: string; next: string; choose: string; 'go-to': string };
}

/** Featured recipes as a carousel of photo cards (React island). */
export const RecipeCarousel = ({ items, labels }: RecipeCarouselProps) => (
  <Carousel
    label={labels.featured}
    previousLabel={labels.previous}
    nextLabel={labels.next}
    indicatorsLabel={labels.choose}
    goToLabel={(index, total) => interpolate(labels['go-to'], { n: index + 1, total })}
    buttonIds={{
      previous: trackingId('recipes', 'button', 'carousel-previous'),
      next: trackingId('recipes', 'button', 'carousel-next'),
    }}
  >
    {items.map(({ id, src, ...card }) => (
      <Showcase
        key={id}
        {...(src && { src })}
        {...card}
        linkId={trackingId('recipes', 'link', 'featured', id)}
      />
    ))}
  </Carousel>
);
