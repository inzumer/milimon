import {
  blogPostingSchema,
  breadcrumbSchema,
  personSchema,
  profilePageSchema,
  websiteSchema,
} from '../seo';

const SITE = 'https://inzumer.github.io';

describe('seo structured data', () => {
  it('should describe the author with her studies and where she lives', () => {
    expect(personSchema(SITE, '/milimon/es/about')).toStrictEqual({
      '@type': 'Person',
      '@id': 'https://inzumer.github.io/milimon/es/about#person',
      name: 'Milagros Tessey',
      url: 'https://inzumer.github.io/milimon/es/about',
      alumniOf: {
        '@type': 'EducationalOrganization',
        name: 'Instituto Argentino de Gastronomía (IAG)',
        url: 'https://www.iag.com.ar/',
      },
      homeLocation: {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressLocality: 'Zaragoza', addressCountry: 'ES' },
      },
    });
  });

  it('should describe the website and the profile page with absolute URLs', () => {
    const website = websiteSchema({
      site: SITE,
      homeHref: '/milimon/es',
      aboutHref: '/milimon/es/about',
      name: 'Milimon',
      description: 'Cocina y administración gastronómica',
      lang: 'es',
    });
    expect(website).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      url: 'https://inzumer.github.io/milimon/es',
      inLanguage: 'es',
      author: { name: 'Milagros Tessey' },
    });
    expect(
      profilePageSchema({
        site: SITE,
        aboutHref: '/milimon/en/about',
        description: 'About',
        lang: 'en',
      }),
    ).toMatchObject({ '@type': 'ProfilePage', mainEntity: { '@type': 'Person' } });
  });

  it('should number the breadcrumb trail and end with the current page', () => {
    const schema = breadcrumbSchema(SITE, [{ label: 'Inicio', href: '/milimon/es' }], {
      label: 'Blog',
      url: 'https://inzumer.github.io/milimon/es/blog',
    });
    expect(schema['itemListElement']).toStrictEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://inzumer.github.io/milimon/es',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://inzumer.github.io/milimon/es/blog',
      },
    ]);
  });

  it('should describe a blog post with its author and date', () => {
    expect(
      blogPostingSchema({
        site: SITE,
        url: 'https://inzumer.github.io/milimon/es/blog/milicitos',
        aboutHref: '/milimon/es/about',
        title: 'Los milicitos',
        description: 'Del 1 al 5',
        datePublished: '2026-09-26',
        image: 'https://inzumer.github.io/milimon/og/og-blog-es.png',
        lang: 'es',
      }),
    ).toMatchObject({
      '@type': 'BlogPosting',
      headline: 'Los milicitos',
      datePublished: '2026-09-26',
      mainEntityOfPage: 'https://inzumer.github.io/milimon/es/blog/milicitos',
      author: { '@type': 'Person', name: 'Milagros Tessey' },
    });
  });
});
