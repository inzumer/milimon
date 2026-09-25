import { renderHook } from '@testing-library/react';
import { useScrollLock } from '../useScrollLock';

describe('useScrollLock', () => {
  it('should lock body scroll while active and restore it afterwards', () => {
    document.body.style.overflow = 'auto';
    const { rerender } = renderHook(({ active }) => useScrollLock(active), {
      initialProps: { active: true },
    });
    expect(document.body.style.overflow).toBe('hidden');

    rerender({ active: false });
    expect(document.body.style.overflow).toBe('auto');
  });

  it('should do nothing while inactive', () => {
    document.body.style.overflow = '';
    renderHook(() => useScrollLock(false));
    expect(document.body.style.overflow).toBe('');
  });
});
