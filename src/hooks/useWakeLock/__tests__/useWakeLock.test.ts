import { renderHook, waitFor } from '@testing-library/react';
import { useWakeLock } from '../useWakeLock';

const stubWakeLock = (request: () => Promise<unknown>) =>
  vi.stubGlobal('navigator', { ...navigator, wakeLock: { request: vi.fn(request) } });

describe('useWakeLock', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('should keep the screen on while active and let go afterwards', async () => {
    const release = vi.fn(async () => undefined);
    stubWakeLock(async () => ({ release }));
    const { rerender } = renderHook(({ active }) => useWakeLock(active), {
      initialProps: { active: true },
    });
    await waitFor(() => expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen'));
    rerender({ active: false });
    await waitFor(() => expect(release).toHaveBeenCalled());
  });

  it('should ask again when the tab becomes visible', async () => {
    stubWakeLock(async () => ({ release: vi.fn(async () => undefined) }));
    renderHook(() => useWakeLock(true));
    await waitFor(() => expect(navigator.wakeLock.request).toHaveBeenCalledTimes(1));
    document.dispatchEvent(new Event('visibilitychange'));
    await waitFor(() => expect(navigator.wakeLock.request).toHaveBeenCalledTimes(2));
  });

  it('should ignore a refused lock and browsers without the API', async () => {
    stubWakeLock(async () => Promise.reject(new Error('denied')));
    renderHook(() => useWakeLock(true));
    await waitFor(() => expect(navigator.wakeLock.request).toHaveBeenCalled());
    vi.unstubAllGlobals();
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });
});
