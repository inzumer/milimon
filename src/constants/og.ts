/** Site sections with their own Open Graph share image (public/og/og-<section>-<lang>.png). */
export const OG_SECTIONS = ['home', 'management', 'recipes', 'blog'] as const;

export type OgSection = (typeof OG_SECTIONS)[number];
