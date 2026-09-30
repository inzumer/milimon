import { useId } from 'react';
import { Button, RichText } from '@inzumer/ui-library';
import { SHARE_NETWORKS, type ShareNetwork } from '@constants';
import { useShare } from '@hooks';
import type { Translations } from '@i18n/translations';
import { shareLinks, track, trackingId } from '@utils';

export type SharePageLabels = Translations<'common'>['share'];

export interface SharePageProps {
  url: string;
  title: string;
  labels: SharePageLabels;
}

const NETWORKS = Object.keys(SHARE_NETWORKS) as ShareNetwork[];

const linkClass =
  'inline-flex min-h-11 items-center rounded-full border border-[var(--border-default)] px-4 text-sm font-semibold text-[var(--text-primary)] no-underline hover:bg-[var(--surface-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:outline-none';

/** Share sheet when available, plus direct links and "Copy link"; every option is tracked. */
export const SharePage = ({ url, title, labels }: SharePageProps) => {
  const titleId = useId();
  const { path, canShare, canCopy, copied, shareNative, copy } = useShare(url, title);
  const links = shareLinks(url, title);

  return (
    <section
      aria-labelledby={titleId}
      className="mt-12 flex flex-col gap-3 border-t border-[var(--border-default)] pt-8"
    >
      <RichText variant="h2" id={titleId} className="text-xl font-bold">
        {labels.title}
      </RichText>
      <RichText variant="p3" className="text-[var(--text-secondary)]">
        {labels.description}
      </RichText>
      <ul className="flex flex-wrap gap-2">
        {canShare && (
          <li>
            <Button
              id={trackingId('share', 'button', 'native')}
              type="button"
              className="min-h-11 rounded-full px-4"
              onClick={() => void shareNative()}
            >
              {labels.native}
            </Button>
          </li>
        )}
        {NETWORKS.map((network) => (
          <li key={network}>
            <a
              id={trackingId('share', 'link', network)}
              href={links[network]}
              {...(network === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              className={linkClass}
              onClick={() => track('page_shared', { method: network, path })}
            >
              {labels[network]}
              {network !== 'email' && (
                <RichText variant="s3" className="sr-only">
                  {' '}
                  {labels['new-tab']}
                </RichText>
              )}
            </a>
          </li>
        ))}
        {canCopy && (
          <li>
            <Button
              id={trackingId('share', 'button', 'copy')}
              type="button"
              variant="secondary"
              className="min-h-11 rounded-full px-4"
              onClick={() => void copy()}
            >
              {labels.copy}
            </Button>
          </li>
        )}
      </ul>
      <RichText role="status" variant="p3" className="min-h-6 text-[var(--text-secondary)]">
        {copied ? labels.copied : ''}
      </RichText>
    </section>
  );
};
