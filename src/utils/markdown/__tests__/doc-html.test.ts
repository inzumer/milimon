import { adaptDocHtml, resolveDocHref } from '@utils/markdown';

const options = {
  pages: { '02-cms-y-emails': 'cms-and-emails' },
  repoUrl: 'https://github.com/inzumer/milimon/blob/dev/docs',
  folder: 'suggestions',
};

describe('resolveDocHref', () => {
  it('should point links between documents to their pages, keeping the anchor', () => {
    expect(resolveDocHref('./02-cms-y-emails.md', options)).toBe('cms-and-emails');
    expect(resolveDocHref('./02-cms-y-emails.md#keystatic', options)).toBe(
      'cms-and-emails#keystatic',
    );
  });

  it('should point other relative links to the repository', () => {
    expect(resolveDocHref('../PLAN.md', options)).toBe(
      'https://github.com/inzumer/milimon/blob/dev/docs/PLAN.md',
    );
    expect(resolveDocHref('./99-draft.md', options)).toBe(
      'https://github.com/inzumer/milimon/blob/dev/docs/suggestions/99-draft.md',
    );
  });

  it('should leave external links and anchors alone', () => {
    expect(resolveDocHref('https://kubocuisine.es/', options)).toBe('https://kubocuisine.es/');
    expect(resolveDocHref('#referencias', options)).toBe('#referencias');
  });
});

describe('adaptDocHtml', () => {
  it('should drop the title and rewrite every link', () => {
    const html =
      '<h1 id="02--cms">02 · CMS</h1>\n<p>Ver <a href="./02-cms-y-emails.md">CMS</a> y <a href="../PLAN.md">plan</a>.</p>';

    expect(adaptDocHtml(html, options)).toBe(
      '\n<p>Ver <a href="cms-and-emails">CMS</a> y <a href="https://github.com/inzumer/milimon/blob/dev/docs/PLAN.md">plan</a>.</p>',
    );
  });
});
