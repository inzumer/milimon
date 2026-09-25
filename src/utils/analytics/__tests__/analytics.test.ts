import { setAnalyticsSink, track } from '../analytics';

describe('analytics', () => {
  afterEach(() => {
    setAnalyticsSink(null);
  });

  it('should be a no-op by default', () => {
    expect(() => track('menu_opened', {})).not.toThrow();
  });

  it('should forward events to the registered sink', () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    track('theme_changed', { scheme: 'dark' });
    expect(sink).toHaveBeenCalledWith('theme_changed', { scheme: 'dark' });
  });

  it('should swallow sink errors', () => {
    setAnalyticsSink(() => {
      throw new Error('provider down');
    });
    expect(() => track('language_changed', { from: 'es', to: 'en' })).not.toThrow();
  });
});
