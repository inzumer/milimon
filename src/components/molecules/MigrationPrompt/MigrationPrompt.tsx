import { useId } from 'react';
import { Button } from '@inzumer/ui-library';
import type { Translations } from '@i18n/translations';
import { trackingId } from '@utils';

export interface MigrationPromptProps {
  labels: Translations<'common'>['migration'];
  /** Tracking scope of the page that shows it (`login` or `account`). */
  scope: string;
  busy: boolean;
  onImport: () => void;
  onStartFresh: () => void;
}

/** First sign-in with data on this device: keep it in the new account, or start fresh. */
export const MigrationPrompt = ({
  labels,
  scope,
  busy,
  onImport,
  onStartFresh,
}: MigrationPromptProps) => {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <h2 id={titleId} className="text-3xl">
        {labels.title}
      </h2>
      <p>{labels.description}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          id={trackingId(scope, 'button', 'migration-import')}
          type="button"
          className="min-h-11 flex-1"
          disabled={busy}
          onClick={onImport}
        >
          {labels.import}
        </Button>
        <Button
          id={trackingId(scope, 'button', 'migration-fresh')}
          type="button"
          variant="secondary"
          className="min-h-11 flex-1"
          disabled={busy}
          onClick={onStartFresh}
        >
          {labels.fresh}
        </Button>
      </div>
    </section>
  );
};
