import { loadScript } from '../load-script';

const scripts = (src: string) => document.head.querySelectorAll(`script[src="${src}"]`);

describe('loadScript', () => {
  it('should add the script once and resolve when it loads', async () => {
    const first = loadScript('https://example.com/a.js');
    const second = loadScript('https://example.com/a.js');
    expect(scripts('https://example.com/a.js')).toHaveLength(1);
    scripts('https://example.com/a.js')[0]?.dispatchEvent(new Event('load'));
    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBeUndefined();
  });

  it('should reject on error and allow a new attempt', async () => {
    const failed = loadScript('https://example.com/b.js');
    scripts('https://example.com/b.js')[0]?.dispatchEvent(new Event('error'));
    await expect(failed).rejects.toThrow('Could not load https://example.com/b.js');
    expect(scripts('https://example.com/b.js')).toHaveLength(0);

    const retry = loadScript('https://example.com/b.js');
    scripts('https://example.com/b.js')[0]?.dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBeUndefined();
  });
});
