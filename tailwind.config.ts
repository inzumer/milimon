import type { Config } from 'tailwindcss';
import { DefaultPreset } from '@inzumer/tokens/tailwind';

/**
 * Tailwind v4 loads this legacy JS config through `@config` in `src/styles/global.css`,
 * so the `@inzumer/tokens` preset (written for the v3 config format) keeps working as-is.
 * Content sources are declared with `@source` in that same CSS file.
 */
const config: Config = {
  presets: [DefaultPreset],
  content: [],
};

export default config;
