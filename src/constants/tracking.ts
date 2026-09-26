/**
 * Element kinds used in tracking ids (`<scope>-<kind>-<name>`), so GTM triggers can match
 * families of elements with a simple "Click ID contains -button-" rule.
 */
export const TRACKING_KINDS = ['input', 'select', 'switch', 'button', 'link'] as const;

export type TrackingKind = (typeof TRACKING_KINDS)[number];
