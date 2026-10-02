import { useEffect, useState } from 'react';
import { SHARE_COPIED_MS } from '@constants';
import { useHydrated } from '@hooks/useHydrated';
import { track } from '@utils';

/** Sharing a page (absolute or site-relative `url`): share sheet or "copy link", tracked as `page_shared`. */
export const useShare = (url: string, title: string) => {
  const hydrated = useHydrated();
  const [copied, setCopied] = useState(false);
  const path = new URL(url, 'https://milimon.invalid').pathname;
  const absolute = () => new URL(url, window.location.href).href;
  const canShare = hydrated && typeof navigator !== 'undefined' && 'share' in navigator;
  const canCopy = hydrated && typeof navigator !== 'undefined' && 'clipboard' in navigator;

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timer = setTimeout(() => setCopied(false), SHARE_COPIED_MS);

    return () => clearTimeout(timer);
  }, [copied]);

  const shareNative = async () => {
    try {
      await navigator.share({ title, url: absolute() });
      track('page_shared', { method: 'native', path });
    } catch {
      // Dismissed by the person: nothing to do.
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absolute());
      setCopied(true);
      track('page_shared', { method: 'copy', path });
    } catch {
      setCopied(false);
    }
  };

  /** The share sheet where there is one, the clipboard otherwise. */
  const share = () => (canShare ? shareNative() : copy());

  return { path, canShare, canCopy, copied, shareNative, copy, share };
};
