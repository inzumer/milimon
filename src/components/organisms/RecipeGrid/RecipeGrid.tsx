import { Filter, RichText, Showcase, type FilterOption } from '@inzumer/ui-library';
import {
  BreadIcon,
  CupcakeIcon,
  CupIcon,
  PotIcon,
  SparkleIcon,
  type IconProps,
} from '@components/atoms/Icons';
import { RecipeActions, type RecipeActionsLabels } from '@components/organisms/RecipeActions';
import { RECIPE_CATEGORIES, RECIPE_FILTER_PARAM, type RecipeCategory } from '@constants';
import { useUrlFilter } from '@hooks';
import { trackingId } from '@utils';

type Choice = RecipeCategory | 'all';

export interface RecipeGridItem {
  id: string;
  category: RecipeCategory;
  src?: string;
  alt: string;
  title: string;
  subtitle: string;
  href: string;
}

export interface RecipeGridProps {
  items: RecipeGridItem[];
  labels: {
    'filter-label': string;
    'filter-all': string;
    'filter-empty': string;
    'filter-previous': string;
    'filter-next': string;
    categories: Record<RecipeCategory, string>;
    actions: RecipeActionsLabels;
  };
}

/** Each category's Milimon icon; every pill shares the `--filter-pill-*` colors (theme.css). */
const CATEGORY_ICONS: Record<Choice, (props: IconProps) => React.JSX.Element> = {
  all: SparkleIcon,
  sweet: CupcakeIcon,
  savory: PotIcon,
  bread: BreadIcon,
  drinks: CupIcon,
};

const CHOICES = ['all', ...RECIPE_CATEGORIES] as const;

const PILL_COLORS = { background: 'var(--filter-pill-bg)', text: 'var(--filter-pill-text)' };

/** Every recipe as photo cards, filtered by category with chips; the filter lives in `?category=`. */
export const RecipeGrid = ({ items, labels }: RecipeGridProps) => {
  const [filter, setFilter] = useUrlFilter<Choice>(RECIPE_FILTER_PARAM, CHOICES, 'all');
  const present = CHOICES.filter(
    (choice) => choice === 'all' || items.some((item) => item.category === choice),
  );
  const shown = filter === 'all' ? items : items.filter((item) => item.category === filter);
  const options: FilterOption<Choice>[] = present.map((choice) => {
    const Icon = CATEGORY_ICONS[choice];
    return {
      value: choice,
      id: trackingId('recipes', 'button', 'filter', choice),
      label: choice === 'all' ? labels['filter-all'] : labels.categories[choice],
      icon: <Icon className="size-5" />,
      colors: PILL_COLORS,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {present.length > 2 && (
        <Filter
          label={labels['filter-label']}
          previousLabel={labels['filter-previous']}
          nextLabel={labels['filter-next']}
          buttonIds={{
            previous: trackingId('recipes', 'button', 'filter-previous'),
            next: trackingId('recipes', 'button', 'filter-next'),
          }}
          options={options}
          value={filter}
          onChange={setFilter}
        />
      )}
      {shown.length === 0 ? (
        <RichText className="text-[var(--text-secondary)]">{labels['filter-empty']}</RichText>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map(({ id, src, alt, title, subtitle, href }) => (
            <li key={id}>
              <Showcase
                {...(src && { src })}
                alt={alt}
                title={title}
                subtitle={subtitle}
                href={href}
                linkId={trackingId('recipes', 'link', id)}
                actions={
                  <RecipeActions
                    variant="floating"
                    recipeId={id}
                    title={title}
                    href={href}
                    labels={labels.actions}
                  />
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
