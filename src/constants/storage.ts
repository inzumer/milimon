/** Shared with the inline theme and language scripts, which run before any module loads. */
export const SETTINGS_STORAGE_KEY = 'milimon:settings';

/** Calculator drafts (the key predates the drafts store and keeps saved data). */
export const DRAFTS_STORAGE_KEY = 'milimon:calculations';

export const HISTORY_STORAGE_KEY = 'milimon:history';

/** Oldest saved calculations are dropped beyond this many (the API enforces it too). */
export const HISTORY_LIMIT = 15;
