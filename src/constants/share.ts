/** Networks offered in "Share this page", with their share URL (`{url}` and `{text}` are encoded). */
export const SHARE_NETWORKS = {
  whatsapp: 'https://wa.me/?text={text}%20{url}',
  facebook: 'https://www.facebook.com/sharer/sharer.php?u={url}',
  x: 'https://x.com/intent/post?text={text}&url={url}',
  linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url={url}',
  email: 'mailto:?subject={text}&body={url}',
} as const;

export type ShareNetwork = keyof typeof SHARE_NETWORKS;

/** How long "Link copied" stays visible (ms). */
export const SHARE_COPIED_MS = 2_500;
