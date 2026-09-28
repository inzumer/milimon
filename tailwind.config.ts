import type { Config } from 'tailwindcss';
import { DefaultPreset } from '@inzumer/tokens/tailwind';

/** Legacy config loaded by `@config` in global.css so the `@inzumer/tokens` preset keeps working. */
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
