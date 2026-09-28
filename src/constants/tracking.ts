/** Element kinds in tracking ids (`<scope>-<kind>-<name>`), for "Click ID contains" triggers. */
export const TRACKING_KINDS = ['input', 'select', 'switch', 'button', 'link'] as const;

export type TrackingKind = (typeof TRACKING_KINDS)[number];
