import { INSTITUTE_NAME, INSTITUTE_URL, SITE_AUTHOR } from '@constants';

/** schema.org JSON-LD builders; the layouts render them. */
export type StructuredData = Record<string, unknown>;

export interface BreadcrumbTrailItem {
  label: string;
  href: string;
}

const CONTEXT = 'https://schema.org';

const absolute = (href: string, site: URL | string): string => new URL(href, site).href;

export const personSchema = (site: URL | string, aboutHref: string): StructuredData => ({
  '@type': 'Person',
  '@id': `${absolute(aboutHref, site)}#person`,
  name: SITE_AUTHOR.name,
  url: absolute(aboutHref, site),
  alumniOf: { '@type': 'EducationalOrganization', name: INSTITUTE_NAME, url: INSTITUTE_URL },
  homeLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE_AUTHOR.city,
      addressCountry: SITE_AUTHOR.countryCode,
    },
  },
});

export const websiteSchema = ({
  site,
  homeHref,
  aboutHref,
  name,
  description,
  lang,
}: {
  site: URL | string;
  homeHref: string;
  aboutHref: string;
  name: string;
  description: string;
  lang: string;
}): StructuredData => ({
  '@context': CONTEXT,
  '@type': 'WebSite',
  name,
  description,
  url: absolute(homeHref, site),
  inLanguage: lang,
  author: personSchema(site, aboutHref),
});

export const profilePageSchema = ({
  site,
  aboutHref,
  description,
  lang,
}: {
  site: URL | string;
  aboutHref: string;
  description: string;
  lang: string;
}): StructuredData => ({
  '@context': CONTEXT,
  '@type': 'ProfilePage',
  url: absolute(aboutHref, site),
  description,
  inLanguage: lang,
  mainEntity: personSchema(site, aboutHref),
});

export const breadcrumbSchema = (
  site: URL | string,
  trail: readonly BreadcrumbTrailItem[],
  current: { label: string; url: string },
): StructuredData => ({
  '@context': CONTEXT,
  '@type': 'BreadcrumbList',
  itemListElement: [
    ...trail.map((item) => ({ ...item, url: absolute(item.href, site) })),
    current,
  ].map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: item.url,
  })),
});

export const blogPostingSchema = ({
  site,
  url,
  aboutHref,
  title,
  description,
  datePublished,
  image,
  lang,
}: {
  site: URL | string;
  url: string;
  aboutHref: string;
  title: string;
  description: string;
  datePublished: string;
  image: string;
  lang: string;
}): StructuredData => ({
  '@context': CONTEXT,
  '@type': 'BlogPosting',
  headline: title,
  description,
  datePublished,
  inLanguage: lang,
  image,
  url,
  mainEntityOfPage: url,
  author: personSchema(site, aboutHref),
});

/** schema.org `Recipe`: what search engines show as a recipe result. */
export const recipeSchema = ({
  site,
  url,
  aboutHref,
  name,
  description,
  image,
  minutes,
  servings,
  category,
  ingredients,
  steps,
  lang,
}: {
  site: URL | string;
  url: string;
  aboutHref: string;
  name: string;
  description: string;
  image?: string | undefined;
  minutes?: number | null;
  servings?: number | null;
  category: string;
  ingredients: string[];
  steps: string[];
  lang: string;
}): StructuredData => ({
  '@context': CONTEXT,
  '@type': 'Recipe',
  name,
  description,
  url,
  inLanguage: lang,
  recipeCategory: category,
  author: personSchema(site, aboutHref),
  ...(image && { image }),
  ...(minutes && { totalTime: `PT${minutes}M` }),
  ...(servings && { recipeYield: String(servings) }),
  recipeIngredient: ingredients,
  recipeInstructions: steps.map((text) => ({ '@type': 'HowToStep', text })),
});
