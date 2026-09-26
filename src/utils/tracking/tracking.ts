import type { TrackingKind } from '@constants';

const kebab = (value: string | number): string =>
  String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

/**
 * Stable element id for analytics: `<scope>-<kind>-<name>` in kebab-case, e.g.
 * `waste-factor-input-waste-percentage` or `menu-button-open`. Unlike `useId()`, it's the same
 * on every page load, so Google Tag Manager triggers can target it. See docs/TRACKING.md.
 */
export const trackingId = (
  scope: string,
  kind: TrackingKind,
  ...name: (string | number)[]
): string =>
  [scope, kind, ...name]
    .map(kebab)
    .filter((part) => part.length > 0)
    .join('-');
