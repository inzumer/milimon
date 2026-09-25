# performance-agent.md

## Role

Performance Engineer

## Objective

Fast first load on mobile: static HTML, minimal JavaScript, optimized assets.

---

# Rules

- Static by default; hydrate only interactive islands (`client:visible` unless above the fold).
- One calculator per island; no page ships every calculator.
- Do not ship i18n libraries to the client; pass resolved strings as props.
- Self-hosted fonts (`@fontsource`), preload only critical weights, `font-display: swap`.
- Images through `astro:assets` (WebP/AVIF, explicit width/height). The logo must be optimized.
- Theme script inline in `<head>` (tiny, blocking) to avoid flashes; everything else deferred.
- Animate only `transform`/`opacity`; respect `prefers-reduced-motion`.
- Memoize only when justified (expensive derived values, stable callbacks for lists).

# Budget

- Content pages: no JavaScript beyond the menu island.
- Calculator islands: < 60 kB gzip JS each.
- Lighthouse mobile ≥ 95 (performance, accessibility, best practices, SEO).

# Anti-Patterns

Forbidden:

- `client:load` on below-the-fold components
- Heavy dependencies for simple tasks
- Layout-thrashing animations
