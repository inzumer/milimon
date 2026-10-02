import { useId } from 'react';
import { Button, RichText } from '@inzumer/ui-library';
import { BrandLoader } from '@components/atoms/BrandLoader';
import type { Translations } from '@i18n/translations';
import { trackingId } from '@utils';

export interface MigrationPromptProps {
  labels: Translations<'common'>['migration'];
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
      {busy && <BrandLoader screen />}
      <RichText variant="h2" bold id={titleId} className="font-display text-3xl">
        {labels.title}
      </RichText>
      <RichText>{labels.description}</RichText>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          id={trackingId(scope, 'button', 'migration-import')}
          type="button"
          className="min-h-11 flex-1"
          loading={busy}
          onClick={onImport}
        >
          {labels.import}
        </Button>
        <Button
          id={trackingId(scope, 'button', 'migration-fresh')}
          type="button"
          variant="secondary"
          className="min-h-11 flex-1"
          loading={busy}
          onClick={onStartFresh}
        >
          {labels.fresh}
        </Button>
      </div>
    </section>
  );
};
