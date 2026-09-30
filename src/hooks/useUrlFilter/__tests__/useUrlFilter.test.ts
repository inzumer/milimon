import { act, renderHook } from '@testing-library/react';
import { useUrlFilter } from '../useUrlFilter';

const OPTIONS = ['all', 'sweet', 'drinks'] as const;

describe('useUrlFilter', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('should start with the fallback when the URL has no valid value', () => {
    window.history.replaceState(null, '', '/?category=pizza');
    const { result } = renderHook(() => useUrlFilter('category', OPTIONS, 'all'));
    expect(result.current[0]).toBe('all');
  });

  it('should read the value from the URL', () => {
    window.history.replaceState(null, '', '/?category=drinks');
    const { result } = renderHook(() => useUrlFilter('category', OPTIONS, 'all'));
    expect(result.current[0]).toBe('drinks');
  });

  it('should keep the choice in the URL and drop it for the fallback', () => {
    window.history.replaceState(null, '', '/?page=2');
    const { result } = renderHook(() => useUrlFilter('category', OPTIONS, 'all'));

    act(() => result.current[1]('sweet'));
    expect(result.current[0]).toBe('sweet');
    expect(window.location.search).toBe('?page=2&category=sweet');

    act(() => result.current[1]('all'));
    expect(result.current[0]).toBe('all');
    expect(window.location.search).toBe('?page=2');
  });
});
