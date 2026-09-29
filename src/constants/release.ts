/** Automatic releases (inzumer-ci): the PR is cut on Fridays and merged on Mondays, Madrid time. */
export const RELEASE_TIME_ZONE = 'Europe/Madrid';
export const RELEASE_CUTOFF = { weekday: 5, hour: 12, minute: 0 } as const;
export const RELEASE_PUBLISH = { weekday: 1, hour: 12, minute: 30 } as const;
