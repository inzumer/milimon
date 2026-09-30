import { useEffect, useState } from 'react';
import { Button, Image, Modal, RichText } from '@inzumer/ui-library';
import { useWakeLock } from '@hooks';
import type { Translations } from '@i18n/translations';
import { interpolate, track, trackingId } from '@utils';

export type CookingModeLabels = Translations<'cooking-mode'>;

export interface CookingStep {
  text: string;
  image?: { src: string; alt: string };
}

export interface CookingModeProps {
  recipeId: string;
  title: string;
  ingredients: string[];
  steps: CookingStep[];
  labels: CookingModeLabels;
}

/** Step-by-step view to cook along: big text, arrows, an ingredient checklist and the screen kept on. */
export const CookingMode = ({ recipeId, title, ingredients, steps, labels }: CookingModeProps) => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const step = steps[index];
  const last = index === steps.length - 1;
  useWakeLock(open);

  const start = () => {
    setIndex(0);
    setOpen(true);
    track('cooking_started', { recipe: recipeId });
  };

  const go = (next: number) => setIndex(Math.min(Math.max(next, 0), steps.length - 1));

  const finish = () => {
    setOpen(false);
    track('cooking_finished', { recipe: recipeId });
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        setIndex((current) => Math.min(current + 1, steps.length - 1));
      } else if (event.key === 'ArrowLeft') {
        setIndex((current) => Math.max(current - 1, 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, steps.length]);

  const toggle = (item: number) =>
    setChecked((current) => {
      const next = new Set(current);
      if (!next.delete(item)) {
        next.add(item);
      }
      return next;
    });

  if (steps.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        id={trackingId('recipe', 'button', 'start-cooking', recipeId)}
        type="button"
        className="min-h-11 self-start rounded-full px-6"
        onClick={start}
      >
        {labels.start}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${labels.title} · ${title}`}
        maxHeight="tall"
        closeOnBackdropClick={false}
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <Button
              id={trackingId('cooking', 'button', 'previous')}
              type="button"
              variant="secondary"
              className="min-h-12 rounded-full px-5"
              disabled={index === 0}
              onClick={() => go(index - 1)}
            >
              {labels.previous}
            </Button>
            <Button
              id={trackingId('cooking', 'button', last ? 'finish' : 'next')}
              type="button"
              className="min-h-12 rounded-full px-5"
              onClick={last ? finish : () => go(index + 1)}
            >
              {last ? labels.finish : labels.next}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <RichText variant="s2" bold aria-live="polite">
              {interpolate(labels.progress, { n: index + 1, total: steps.length })}
            </RichText>
            <div
              role="progressbar"
              aria-label={labels.steps}
              aria-valuemin={1}
              aria-valuemax={steps.length}
              aria-valuenow={index + 1}
              className="h-2 overflow-hidden rounded-full bg-[var(--surface-tertiary)]"
            >
              <div
                className="h-full rounded-full bg-[var(--btn-primary-bg)] transition-[width] motion-reduce:transition-none"
                style={{ width: `${((index + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
          {step && (
            <div className="flex flex-col gap-4">
              <RichText variant="p1" className="text-2xl leading-relaxed">
                {step.text}
              </RichText>
              {step.image && (
                <Image
                  src={step.image.src}
                  alt={step.image.alt}
                  className="max-h-72 w-full rounded-2xl object-cover"
                />
              )}
            </div>
          )}
          {ingredients.length > 0 && (
            <details className="rounded-xl border border-[var(--border-default)] p-4">
              <RichText as="summary" variant="s2" bold className="cursor-pointer">
                {labels.ingredients}
              </RichText>
              <ul className="mt-3 flex flex-col gap-2">
                {ingredients.map((ingredient, item) => (
                  <li key={ingredient}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3">
                      <input
                        id={trackingId('cooking', 'input', 'ingredient', String(item + 1))}
                        type="checkbox"
                        className="size-5 accent-[var(--btn-primary-bg)]"
                        checked={checked.has(item)}
                        onChange={() => toggle(item)}
                      />
                      <RichText
                        as="span"
                        className={checked.has(item) ? 'line-through opacity-60' : ''}
                      >
                        {ingredient}
                      </RichText>
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <RichText variant="p4" className="text-[var(--text-secondary)]">
              {labels['screen-on']}
            </RichText>
            <Button
              id={trackingId('cooking', 'button', 'close')}
              type="button"
              variant="ghost"
              className="min-h-11 rounded-full px-4"
              onClick={() => setOpen(false)}
            >
              {labels.close}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
