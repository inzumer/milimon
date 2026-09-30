import { Button, cn, RichText } from '@inzumer/ui-library';
import { BookmarkFilledIcon, BookmarkIcon, ShareIcon } from '@components/atoms/Icons';
import { useHydrated, useShare } from '@hooks';
import { useSavedRecipesStore } from '@stores';
import { track, trackingId } from '@utils';

export interface RecipeActionsLabels {
  save: string;
  saved: string;
  share: string;
  copied: string;
}

export interface RecipeActionsProps {
  recipeId: string;
  title: string;
  /** The recipe page, absolute or site-relative. */
  href: string;
  labels: RecipeActionsLabels;
  /** `bar` on the recipe page (icon and text); `floating` over a card photo (round icons). */
  variant?: 'bar' | 'floating';
}

/** Save the recipe on this device and share it (share sheet or copied link). */
export const RecipeActions = ({
  recipeId,
  title,
  href,
  labels,
  variant = 'bar',
}: RecipeActionsProps) => {
  const hydrated = useHydrated();
  const saved = useSavedRecipesStore((state) => hydrated && state.ids.includes(recipeId));
  const toggle = useSavedRecipesStore((state) => state.toggle);
  const { copied, share } = useShare(href, title);
  const floating = variant === 'floating';
  const SaveIcon = saved ? BookmarkFilledIcon : BookmarkIcon;
  const scope = floating ? 'recipes' : 'recipe';

  const onSave = () => {
    toggle(recipeId);
    track(saved ? 'recipe_unsaved' : 'recipe_saved', { recipe: recipeId });
  };

  const buttonClass = floating
    ? 'size-11 rounded-full p-0 shadow-md'
    : 'min-h-11 gap-2 rounded-full px-4';

  return (
    // Over a card: no box around both buttons (Showcase shades its actions); each one has its own shadow.
    <div className={cn('flex items-center gap-2', floating ? 'shadow-none!' : 'flex-wrap')}>
      <Button
        id={trackingId(scope, 'button', 'save', recipeId)}
        type="button"
        variant="secondary"
        aria-pressed={saved}
        {...(floating && { 'aria-label': saved ? labels.saved : labels.save })}
        className={buttonClass}
        onClick={onSave}
      >
        <SaveIcon className="size-5" />
        {!floating && (saved ? labels.saved : labels.save)}
      </Button>
      <Button
        id={trackingId(scope, 'button', 'share', recipeId)}
        type="button"
        variant="secondary"
        {...(floating && { 'aria-label': labels.share })}
        className={buttonClass}
        onClick={() => void share()}
      >
        <ShareIcon className="size-5" />
        {!floating && labels.share}
      </Button>
      <RichText
        as="span"
        role="status"
        variant="p3"
        className={floating ? 'sr-only' : 'text-[var(--text-secondary)]'}
      >
        {copied ? labels.copied : ''}
      </RichText>
    </div>
  );
};
