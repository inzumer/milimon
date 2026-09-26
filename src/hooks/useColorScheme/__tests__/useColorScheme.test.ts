import { act, renderHook } from '@testing-library/react';
import { useSettingsStore } from '@stores';
import { setAnalyticsSink } from '@utils';
import { useColorScheme } from '../useColorScheme';

describe('useColorScheme', () => {
  afterEach(() => {
    delete document.documentElement.dataset['colorScheme'];
    setAnalyticsSink(null);
  });

  it('should sync with the scheme applied by the head script', () => {
    document.documentElement.dataset['colorScheme'] = 'dark';
    const { result } = renderHook(() => useColorScheme());
    expect(result.current.scheme).toBe('dark');
  });

  it('should default to light when no scheme is applied', () => {
    const { result } = renderHook(() => useColorScheme());
    expect(result.current.scheme).toBe('light');
  });

  it('should apply, persist and track a new scheme', () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const { result } = renderHook(() => useColorScheme());

    act(() => {
      result.current.setScheme('dark');
    });

    expect(result.current.scheme).toBe('dark');
    expect(document.documentElement.dataset['colorScheme']).toBe('dark');
    expect(useSettingsStore.getState().colorScheme).toBe('dark');
    expect(sink).toHaveBeenCalledWith('theme_changed', { scheme: 'dark' });
  });

  it('should use localStorage by default', () => {
    const { result } = renderHook(() => useColorScheme());
    act(() => {
      result.current.setScheme('light');
    });
    expect(window.localStorage.getItem('milimon:settings')).toContain('"colorScheme":"light"');
  });
});
