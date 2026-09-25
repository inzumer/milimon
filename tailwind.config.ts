import type { Config } from 'tailwindcss';
import { DefaultPreset } from '@inzumer/tokens/tailwind';

/**
 * Tailwind v4 loads this legacy JS config through `@config` in `src/styles/global.css`,
 * so the `@inzumer/tokens` preset (written for the v3 config format) keeps working as-is.
 * Content sources are declared with `@source` in that same CSS file.
 * Brand values live as CSS variables in `src/styles/theme.css`; this file only exposes them.
 */
const config: Config = {
  presets: [DefaultPreset],
  content: [],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      maxWidth: {
        layout: 'var(--layout-max-width)',
      },
      height: {
        header: 'var(--header-height)',
      },
      spacing: {
        header: 'var(--header-height)',
      },
    },
  },
};

export default config;
