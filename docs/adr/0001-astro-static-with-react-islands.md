# ADR 0001 — Astro static output with React islands

- **Status:** accepted
- **Date:** 2026-09-25

## Context

Milimon is mostly static study content (explanations, formulas, worked examples) plus a
set of interactive calculators. It must be bilingual (`/es`, `/en`), fast on mobile, SEO-friendly,
and reuse `@inzumer/ui-library` (React) with its Tailwind/tokens conventions.

Options considered: Vite SPA, Next.js (App Router, like `zamuner`), Astro.

## Decision

Use **Astro** with `output: 'static'` and **React islands** (`@astrojs/react`):

- Every page × language is prerendered to HTML at build time.
- Only interactive parts hydrate (calculators, menu, language/theme toggles), preferably with `client:visible`.
- Astro's built-in i18n routing with `prefixDefaultLocale: true`; routes in English, same in both languages.
- Translations as JSON data collections validated with zod at build time.

## Consequences

- Near-zero JavaScript on content pages → fast LCP/TTI on mobile, good SEO.
- Astro is Vite underneath: tsconfig path aliases, Tailwind and Vitest work as in ui-library.
- No i18next runtime on the client; islands receive resolved strings as props.
- No SSR server. If something dynamic is needed later (e.g. accounts in F10), it can use a
  client-side SDK or add an adapter for on-demand routes.
- `.astro` files are validated by `astro check` and the build, not by Vitest coverage.
