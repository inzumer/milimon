import { shareLinks } from '../share';

describe('shareLinks', () => {
  it('should build every network link with the page URL and text encoded', () => {
    const links = shareLinks('https://inzumer.github.io/milimon/es?a=1', 'Costos & mermas');
    expect(links.whatsapp).toBe(
      'https://wa.me/?text=Costos%20%26%20mermas%20https%3A%2F%2Finzumer.github.io%2Fmilimon%2Fes%3Fa%3D1',
    );
    expect(links.facebook).toContain('u=https%3A%2F%2Finzumer.github.io');
    expect(links.x).toContain('text=Costos%20%26%20mermas&url=https%3A%2F%2F');
    expect(links.linkedin).toContain('url=https%3A%2F%2F');
    expect(links.email).toBe(
      'mailto:?subject=Costos%20%26%20mermas&body=https%3A%2F%2Finzumer.github.io%2Fmilimon%2Fes%3Fa%3D1',
    );
  });
});
