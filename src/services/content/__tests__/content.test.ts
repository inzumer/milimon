import { getBlogIndex, getPublishedPosts, getPublishedRecipes } from '../content';

const entries = {
  recipes: [
    { id: 'scones', data: { title: 'Scones', draft: false, featured: false } },
    { id: 'draft', data: { title: 'Draft', draft: true, featured: false } },
    { id: 'quiche', data: { title: 'Quiche', draft: false, featured: true } },
  ],
  blog: [
    {
      id: 'old',
      data: {
        title: 'Old',
        titleEs: 'Viejo',
        description: { es: 'Bajada', en: '' },
        date: new Date('2026-01-10'),
        featured: true,
        draft: false,
      },
    },
    {
      id: 'new',
      data: {
        title: 'New',
        titleEs: 'Nuevo',
        description: { es: 'Bajada nueva', en: 'New intro' },
        date: new Date('2026-12-01'),
        featured: false,
        draft: false,
      },
    },
    {
      id: 'wip',
      data: {
        title: 'Wip',
        titleEs: 'Wip',
        description: { es: '', en: '' },
        date: new Date(),
        featured: false,
        draft: true,
      },
    },
  ],
};

vi.mock('astro:content', () => ({
  getCollection: async (name: keyof typeof entries, filter?: (entry: unknown) => boolean) =>
    filter ? entries[name].filter(filter) : entries[name],
}));

describe('content', () => {
  it('should list published recipes, featured first', async () => {
    expect((await getPublishedRecipes()).map(({ id }) => id)).toEqual(['quiche', 'scones']);
  });

  it('should list published posts, newest first', async () => {
    expect((await getPublishedPosts()).map(({ id }) => id)).toEqual(['new', 'old']);
  });

  it('should list the published articles by date in each language', async () => {
    const es = await getBlogIndex('es');
    expect(es.map(({ id }) => id)).toEqual(['new', 'old']);
    expect(es[0]).toMatchObject({ title: 'Nuevo', description: 'Bajada nueva', featured: false });
    const en = await getBlogIndex('en');
    expect(en.find(({ id }) => id === 'old')).toMatchObject({
      title: 'Old',
      description: 'Bajada',
      featured: true,
    });
  });
});
