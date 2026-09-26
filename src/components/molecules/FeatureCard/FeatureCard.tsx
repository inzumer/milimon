import { Card, CardDescription, CardFooter, CardHeader, CardTitle, cn } from '@inzumer/ui-library';
import { ButtonLink } from '@components/atoms/ButtonLink';
import { ArrowRightIcon } from '@components/atoms/Icons';

export interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  cta: string;
  highlighted?: boolean;
  headingLevel?: 'h2' | 'h3';
  ctaId: string;
}

/** Card that introduces a section and links to it. Static: rendered without hydration. */
export const FeatureCard = ({
  title,
  description,
  href,
  cta,
  highlighted = false,
  headingLevel = 'h3',
  ctaId,
}: FeatureCardProps) => (
  <Card
    noPadding
    className={cn(
      'flex h-full flex-col',
      highlighted
        ? 'border-transparent bg-primary-500 text-neutral-950'
        : 'bg-[var(--surface-primary)]',
    )}
  >
    <CardHeader className="gap-3">
      <CardTitle
        as={headingLevel}
        className={cn('text-2xl leading-tight font-bold', highlighted && 'text-neutral-950')}
      >
        {title}
      </CardTitle>
      <CardDescription className={cn('text-base', highlighted && 'text-neutral-950')}>
        {description}
      </CardDescription>
    </CardHeader>
    <CardFooter className="mt-auto">
      <ButtonLink id={ctaId} href={href} variant={highlighted ? 'secondary' : 'primary'}>
        {cta}
        <ArrowRightIcon aria-hidden="true" className="size-5" />
      </ButtonLink>
    </CardFooter>
  </Card>
);
