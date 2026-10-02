import { Button, RichText } from '@inzumer/ui-library';
import { BrandLoader } from '@components/atoms/BrandLoader';
import { ButtonLink } from '@components/atoms/ButtonLink';
import { Notice } from '@components/atoms/Notice';
import type { AdminAccess } from '@hooks';
import { trackingId } from '@utils';

export interface AdminAccessNoticeLabels {
  loading: string;
  unavailable: string;
  'signed-out': string;
  'sign-in': string;
  forbidden: string;
  error: string;
  retry: string;
}

export interface AdminAccessNoticeProps {
  access: Exclude<AdminAccess, { kind: 'ready' }>;
  labels: AdminAccessNoticeLabels;
  loginHref: string;
  onRetry: () => void;
  /** Tracking scope of the page (`admin`, `agenda`…). */
  scope: string;
}

/** What the administration pages show until access is confirmed, or instead of the content. */
export const AdminAccessNotice = ({
  access,
  labels,
  loginHref,
  onRetry,
  scope,
}: AdminAccessNoticeProps) => {
  if (access.kind === 'loading') {
    return <BrandLoader screen label={labels.loading} />;
  }

  if (access.kind === 'signed-out') {
    return (
      <div className="flex flex-col items-start gap-4">
        <RichText>{labels['signed-out']}</RichText>
        <ButtonLink id={trackingId(scope, 'link', 'sign-in')} href={loginHref}>
          {labels['sign-in']}
        </ButtonLink>
      </div>
    );
  }

  if (access.kind === 'error') {
    return (
      <div className="flex flex-col items-start gap-4">
        <RichText role="alert">{labels.error}</RichText>
        <Button
          id={trackingId(scope, 'button', 'retry')}
          type="button"
          variant="secondary"
          className="min-h-11"
          onClick={onRetry}
        >
          {labels.retry}
        </Button>
      </div>
    );
  }

  return <Notice>{access.kind === 'unavailable' ? labels.unavailable : labels.forbidden}</Notice>;
};
