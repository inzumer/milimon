/** Retries after the first attempt (so at most 4 requests), only for transient failures. */
export const API_MAX_RETRIES = 3;

/** Exponential backoff: 800 ms, 1.6 s, 3.2 s… capped at 10 s (or the server's `retry-after`). */
export const API_RETRY_BASE_DELAY_MS = 800;
export const API_RETRY_MAX_DELAY_MS = 10_000;

/** Per attempt. A free Render instance takes ~50 s to wake up; the retries cover the rest. */
export const API_TIMEOUT_MS = 30_000;

/** After this long, the UI tells the person the server is waking up. */
export const API_SLOW_REQUEST_MS = 3_000;

/** Statuses worth retrying: the request may succeed if sent again later. */
export const API_RETRYABLE_STATUS = [408, 429, 500, 502, 503, 504] as const;

/** Statuses that mean the server did not process the request (safe to retry anything). */
export const API_NOT_PROCESSED_STATUS = [429, 502, 503, 504] as const;

export const API_HEADERS = {
  appId: 'request-app-id',
  apiKey: 'x-api-key',
  requestId: 'request-id',
} as const;
