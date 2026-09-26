import { HttpError, NetworkError, requestJson, retryDelay } from '../http';

const json = (status: number, body: unknown = {}, headers: Record<string, string> = {}) =>
  new Response(body === null ? null : JSON.stringify(body), { status, headers });

const setup = (...responses: (Response | Error)[]) => {
  const fetchImpl = vi.fn(async () => {
    const next = responses.shift();
    if (next instanceof Error) {
      throw next;
    }
    return next ?? json(200);
  });
  const sleep = vi.fn(async () => undefined);
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls: fetchImpl, sleep };
};

describe('requestJson', () => {
  it('should return the parsed body of a successful answer', async () => {
    const { fetchImpl, sleep } = setup(json(200, { ok: true }));
    await expect(requestJson('/x', {}, { fetchImpl, sleep })).resolves.toStrictEqual({ ok: true });
  });

  it('should return null for empty answers', async () => {
    const { fetchImpl, sleep } = setup(
      new Response(null, { status: 204 }),
      new Response('', { status: 200 }),
    );
    await expect(requestJson('/x', {}, { fetchImpl, sleep })).resolves.toBeNull();
    await expect(requestJson('/x', {}, { fetchImpl, sleep })).resolves.toBeNull();
  });

  it('should retry transient failures at most 3 times with backoff', async () => {
    const { fetchImpl, calls, sleep } = setup(
      new TypeError('offline'),
      json(503),
      json(502),
      json(200, { ok: true }),
    );
    await expect(requestJson('/x', {}, { fetchImpl, sleep })).resolves.toStrictEqual({ ok: true });
    expect(calls).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls).toStrictEqual([[800], [1600], [3200]]);
  });

  it('should give up after the last retry', async () => {
    const { fetchImpl, calls, sleep } = setup(
      json(503),
      json(503),
      json(503),
      json(503, { m: 'down' }),
    );
    const error = await requestJson('/x', {}, { fetchImpl, sleep }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 503, body: { m: 'down' } });
    expect(calls).toHaveBeenCalledTimes(4);
  });

  it('should not retry answers that will not change', async () => {
    const { fetchImpl, calls, sleep } = setup(json(400, { message: ['bad'] }));
    await expect(requestJson('/x', {}, { fetchImpl, sleep })).rejects.toMatchObject({
      status: 400,
    });
    expect(calls).toHaveBeenCalledOnce();
  });

  it('should honor retry-after', async () => {
    const { fetchImpl, sleep } = setup(json(429, {}, { 'retry-after': '2' }), json(200));
    await requestJson('/x', {}, { fetchImpl, sleep });
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it('should only retry unprocessed requests when repeating is not safe', async () => {
    const network = setup(new TypeError('offline'));
    await expect(
      requestJson('/x', {}, { ...network, retryAmbiguous: false }),
    ).rejects.toBeInstanceOf(NetworkError);
    expect(network.calls).toHaveBeenCalledOnce();

    const serverError = setup(json(500));
    await expect(
      requestJson('/x', {}, { ...serverError, retryAmbiguous: false }),
    ).rejects.toMatchObject({ status: 500 });

    const unavailable = setup(json(503), json(200, { ok: true }));
    await expect(
      requestJson('/x', {}, { ...unavailable, retryAmbiguous: false }),
    ).resolves.toStrictEqual({ ok: true });
  });

  it('should abort attempts that take too long', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    ) as unknown as typeof fetch;
    const outcome = requestJson('/x', {}, { fetchImpl, retries: 0, timeoutMs: 100 }).catch(
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(100);
    expect(await outcome).toBeInstanceOf(NetworkError);
    vi.useRealTimers();
  });

  it('should keep non-JSON error bodies as text', async () => {
    const { fetchImpl, sleep } = setup(new Response('Bad gateway', { status: 418 }));
    await expect(requestJson('/x', {}, { fetchImpl, sleep })).rejects.toMatchObject({
      status: 418,
      body: 'Bad gateway',
    });
  });
});

describe('retryDelay', () => {
  it('should double the delay and cap it', () => {
    expect(retryDelay(0)).toBe(800);
    expect(retryDelay(2)).toBe(3200);
    expect(retryDelay(10)).toBe(10_000);
  });

  it('should prefer a valid retry-after', () => {
    expect(retryDelay(0, '5')).toBe(5000);
    expect(retryDelay(0, 'soon')).toBe(800);
    expect(retryDelay(0, '120')).toBe(10_000);
  });
});
