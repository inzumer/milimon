import { renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useHydrated } from '../useHydrated';

const Probe = () => <span>{useHydrated() ? 'client' : 'server'}</span>;

describe('useHydrated', () => {
  it('should be false on the server', () => {
    expect(renderToString(<Probe />)).toContain('server');
  });

  it('should be true once rendered in the browser', () => {
    expect(renderHook(() => useHydrated()).result.current).toBe(true);
  });
});
