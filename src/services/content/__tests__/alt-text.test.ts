import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BLOG = 'src/content/blog';

/** Every Markdoc image of the CMS articles: `![alt](src)`. */
const images = (file: string) =>
  [...readFileSync(file, 'utf8').matchAll(/!\[([^\]]*)\]\(([^)]*)\)/g)].map(
    ([, alt = '', src = '']) => ({
      alt,
      src,
    }),
  );

describe('content alt text', () => {
  const articles = existsSync(BLOG) ? readdirSync(BLOG) : [];

  it('should describe every image of the articles', () => {
    for (const article of articles) {
      for (const lang of ['es', 'en']) {
        const file = join(BLOG, article, 'content', `${lang}.mdoc`);
        for (const { alt, src } of existsSync(file) ? images(file) : []) {
          expect(alt.trim(), `${file}: ${src} needs its description`).not.toBe('');
        }
      }
    }
  });
});
