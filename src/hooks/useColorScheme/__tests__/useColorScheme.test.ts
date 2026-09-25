import { act, renderHook } from '@testing-library/react';
import { createLocalSettingsRepository } from '@repositories';
import { createMemoryStorage } from '@test/memory-storage';
import { setAnalyticsSink } from '@utils';
import { useColorScheme } from '../useColorScheme';

describe('useColorScheme', () => {
  afterEach(() => {
    delete document.documentElement.dataset['colorScheme'];
    setAnalyticsSink(null);
  });

  it('syncs with the scheme applied by the head script', () => {
    document.documentElement.dataset['colorScheme'] = 'dark';
    const { result } = renderHook(() =>
      useColorScheme(createLocalSettingsRepository(createMemoryStorage())),
    );
    expect(result.current.scheme).toBe('dark');
  });

  it('defaults to light when no scheme is applied', () => {
    const { result } = renderHook(() =>
      useColorScheme(createLocalSettingsRepository(createMemoryStorage())),
    );
    expect(result.current.scheme).toBe('light');
  });

  it('applies, persists and tracks a new scheme', () => {
    const repository = createLocalSettingsRepository(createMemoryStorage());
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const { result } = renderHook(() => useColorScheme(repository));

    act(() => {
      result.current.setScheme('dark');
    });

    expect(result.current.scheme).toBe('dark');
    expect(document.documentElement.dataset['colorScheme']).toBe('dark');
    expect(repository.load().colorScheme).toBe('dark');
    expect(sink).toHaveBeenCalledWith('theme_changed', { scheme: 'dark' });
  });

  it('uses localStorage by default', () => {
    const { result } = renderHook(() => useColorScheme());
    act(() => {
      result.current.setScheme('light');
    });
    expect(window.localStorage.getItem('milimon:settings')).toContain('"colorScheme":"light"');
  });
});
