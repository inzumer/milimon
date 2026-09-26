import { SHARE_NETWORKS, type ShareNetwork } from '@constants';

/** Share URL of each network for a page, with the page URL and text encoded. */
export const shareLinks = (url: string, text: string): Record<ShareNetwork, string> =>
  Object.fromEntries(
    Object.entries(SHARE_NETWORKS).map(([network, template]) => [
      network,
      template
        .replace('{url}', encodeURIComponent(url))
        .replace('{text}', encodeURIComponent(text)),
    ]),
  ) as Record<ShareNetwork, string>;
