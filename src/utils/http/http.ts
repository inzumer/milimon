import {
  API_MAX_RETRIES,
  API_NOT_PROCESSED_STATUS,
  API_RETRY_BASE_DELAY_MS,
  API_RETRY_MAX_DELAY_MS,
  API_RETRYABLE_STATUS,
  API_TIMEOUT_MS,
} from '@constants';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`HTTP ${status}`);
    this.name = 'HttpError';
  }
}

/** The request never got an answer (offline, DNS, timeout). */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Network request failed', { cause });
    this.name = 'NetworkError';
  }
}

export interface RequestOptions {
  retries?: number;
  timeoutMs?: number;
  /**
   * Whether the request may be repeated when it may already have reached the server (network
   * errors, 500, 408). Off for single-use operations such as rotating a refresh token.
   */
  retryAmbiguous?: boolean;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Backoff for the given retry (0-based), or the server's `retry-after` (seconds) when present. */
export const retryDelay = (retry: number, retryAfter: string | null = null): number => {
  const seconds = retryAfter === null ? Number.NaN : Number(retryAfter);
  const delay = Number.isFinite(seconds) ? seconds * 1000 : API_RETRY_BASE_DELAY_MS * 2 ** retry;
  return Math.min(Math.max(delay, 0), API_RETRY_MAX_DELAY_MS);
};

const includes = (list: readonly number[], status: number) => list.includes(status);

const parseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (text === '') {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

/**
 * `fetch` for JSON APIs: per-attempt timeout and up to `API_MAX_RETRIES` retries with exponential
 * backoff, only for transient failures (network errors, 408, 429 and 5xx). Other statuses are
 * answers, not failures: they are thrown as `HttpError` right away.
 */
export const requestJson = async <T>(
  url: string,
  init: RequestInit,
  {
    retries = API_MAX_RETRIES,
    timeoutMs = API_TIMEOUT_MS,
    retryAmbiguous = true,
    fetchImpl = fetch,
    sleep = defaultSleep,
  }: RequestOptions = {},
): Promise<T> => {
  for (let attempt = 0; ; attempt += 1) {
    const canRetry = attempt < retries;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetchImpl(url, { ...init, signal: controller.signal });
    } catch (error) {
      clearTimeout(timer);
      if (canRetry && retryAmbiguous) {
        await sleep(retryDelay(attempt));
        continue;
      }
      throw new NetworkError(error);
    }
    clearTimeout(timer);

    if (response.ok) {
      return (await parseBody(response)) as T;
    }

    const retryable = retryAmbiguous
      ? includes(API_RETRYABLE_STATUS, response.status)
      : includes(API_NOT_PROCESSED_STATUS, response.status);
    if (canRetry && retryable) {
      await sleep(retryDelay(attempt, response.headers.get('retry-after')));
      continue;
    }
    throw new HttpError(response.status, await parseBody(response));
  }
};
