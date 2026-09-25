import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@inzumer/ui-library';
import {
  createLocalSettingsRepository,
  onSettingsChange,
  type AnalyticsConsent,
  type SettingsRepository,
} from '@repositories';

export interface ConsentBannerLabels {
  title: string;
  message: string;
  accept: string;
  reject: string;
  'privacy-link': string;
}

export interface ConsentBannerProps {
  labels: ConsentBannerLabels;
  privacyHref: string;
  /** Injected in tests; defaults to the localStorage repository. */
  repository?: SettingsRepository;
}

/**
 * Asks for consent before any analytics cookie is written. Shown at the bottom of every page
 * until the person answers; the answer is stored in the settings repository, which the Google
 * Analytics service follows. Not modal: the page stays usable while it's open.
 */
export const ConsentBanner = ({
  labels,
  privacyHref,
  repository = createLocalSettingsRepository(),
}: ConsentBannerProps) => {
  const titleId = useId();
  const settingsRef = useRef(repository);
  // Hidden on the server and until hydration, so people who already answered never see a flash.
  const [consent, setConsent] = useState<AnalyticsConsent | null | undefined>(undefined);

  useEffect(() => {
    setConsent(settingsRef.current.load().analyticsConsent);
    return onSettingsChange((next) => setConsent(next.analyticsConsent));
  }, []);

  if (consent !== null) {
    return null;
  }

  const answer = (next: AnalyticsConsent) => {
    settingsRef.current.save({ analyticsConsent: next });
  };

  return (
    <section
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-default)] bg-[var(--surface-primary)] shadow-lg"
    >
      <div className="mx-auto flex w-full max-w-layout flex-col gap-3 px-4 py-4">
        <h2 id={titleId} className="text-lg font-bold text-[var(--text-primary)]">
          {labels.title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {labels.message}{' '}
          <a href={privacyHref} className="font-semibold text-[var(--text-link)] underline">
            {labels['privacy-link']}
          </a>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="min-h-11 flex-1" onClick={() => answer('granted')}>
            {labels.accept}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 flex-1"
            onClick={() => answer('denied')}
          >
            {labels.reject}
          </Button>
        </div>
      </div>
    </section>
  );
};
