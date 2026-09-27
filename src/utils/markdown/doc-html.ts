export interface DocLinksOptions {
  /** Source file name (no `.md`) → slug of its page on the site. */
  pages: Record<string, string>;
  /** Base URL for links to other files of `docs/` (they aren't published on the site). */
  repoUrl: string;
  /** Folder of the documents inside `docs/` (`suggestions`), to resolve `../PLAN.md`. */
  folder: string;
}

const SIBLING = /^\.\/([\w-]+)\.md(#.*)?$/;

/** Resolves a link of a document to its page on the site, or to the file in the repository. */
export const resolveDocHref = (href: string, { pages, repoUrl, folder }: DocLinksOptions) => {
  const sibling = SIBLING.exec(href);
  const page = sibling?.[1] ? pages[sibling[1]] : undefined;
  if (page) {
    return `${page}${sibling?.[2] ?? ''}`;
  }
  if (!href.startsWith('.')) {
    return href;
  }
  const path = [folder, ...href.split('/')].reduce<string[]>((parts, part) => {
    if (part === '..') {
      return parts.slice(0, -1);
    }
    return part === '.' || part === '' ? parts : [...parts, part];
  }, []);
  return `${repoUrl}/${path.join('/')}`;
};

/**
 * Adapts the rendered HTML of an internal document to its page: drops its own `h1` (the page
 * shows the title) and resolves its links with `resolveDocHref`.
 */
export const adaptDocHtml = (html: string, options: DocLinksOptions): string =>
  html
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '')
    .replace(/href="([^"]*)"/g, (_, href: string) => `href="${resolveDocHref(href, options)}"`);
