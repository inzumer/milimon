import { renderHook } from '@testing-library/react';
import { useScrollLock } from '../useScrollLock';

describe('useScrollLock', () => {
  it('locks body scroll while active and restores it afterwards', () => {
    document.body.style.overflow = 'auto';
    const { rerender } = renderHook(({ active }) => useScrollLock(active), {
      initialProps: { active: true },
    });
    expect(document.body.style.overflow).toBe('hidden');

    rerender({ active: false });
    expect(document.body.style.overflow).toBe('auto');
  });

  it('does nothing while inactive', () => {
    document.body.style.overflow = '';
    renderHook(() => useScrollLock(false));
    expect(document.body.style.overflow).toBe('');
  });
});
