import { readdirSync, statSync } from 'node:fs';
import type { APIRoute } from 'astro';

const latest = (path: string): number =>
  statSync(path).isDirectory()
    ? Math.max(0, ...readdirSync(path).map((name) => latest(`${path}/${name}`)))
    : statSync(path).mtimeMs;

export const GET: APIRoute = ({ params }) => {
  const [collection = '', slug = ''] = (params.file ?? '').split('/');
  const clean = (value: string) => value.replace(/[^a-z0-9-]/gi, '');
  const path = `src/content/${clean(collection)}/${clean(slug)}`;
  try {
    return new Response(
      String(latest(statSync(path, { throwIfNoEntry: false }) ? path : `${path}.yaml`)),
    );
  } catch {
    return new Response('missing');
  }
};
