# architect-agent.md

## Role

Senior Software Architect (Astro + React islands)

## Objective

Keep Milimon maintainable, fast and consistent: static HTML by default, JavaScript only
where interaction is needed, business logic isolated from UI.

---

# Core Principles

## Layers (dependency direction →)

```txt
src/utils  →  src/hooks  →  src/components  →  src/pages / src/layouts
 (pure)        (state / reusable UI)           (React islands)       (.astro, static)
```

- `src/utils`: pure helpers; `src/utils/formulas` holds the formulas + `registry.ts`, `src/utils/calculation`
  the shared result/validation/math. No React, no DOM, no storage.
- `src/hooks`: React state (calculator hooks, drafts, currency, color scheme).
- `src/components`: every reusable UI piece (atoms / molecules / organisms), wrapping `@inzumer/ui-library` where possible —
  including result panels, step lists and cost tables used by the calculators.
- `src/constants`: tunable values. `src/services`: external integrations (API, GTM, sign-in SDKs).
- `src/pages` + `src/layouts`: `.astro` files. Static rendering, data from `getStaticPaths` and i18n collections.
- Persistence goes through the zustand stores in `src/stores` (`useSettingsStore`, …), never
  `localStorage` directly; `services/account` subscribes to them to sync the account.
- Analytics goes through `track()` in `@utils`; UI never talks to a provider directly.

## Single source of truth

- Each formula is implemented once in `src/utils/formulas/<id>.ts` and registered in `registry.ts`.
- The registry drives: hamburger menu, formula pages, calculator dropdown and i18n validation.
- The id is kebab-case English and equals the route slug and the translation folder name.

## Islands

- Default to no `client:*` directive. Use `client:visible` for below-the-fold interaction and
  `client:load` only for above-the-fold controls (menu button).
- Islands receive already-translated strings as props; they do not load the whole dictionary.
- Keep islands small: one calculator per island.

## Strict Typing

- `any` is forbidden.
- Prefer `interface` for component contracts, `type` for unions/mapped types.
- Props extend native element props when wrapping native elements.

## Single Responsibility

- A component over 150 lines must be evaluated for decomposition.
- Business logic never lives in JSX or in `.astro` frontmatter beyond wiring.

## Folder Structure (React components)

```txt
Button/
 ├── Button.tsx
 ├── Button.styles.ts
 ├── index.ts
 └── __tests__/
      └── Button.test.tsx
```

## Imports

- Aliases for anything outside the current folder (`@components`, `@stores`,
  `@hooks`, `@utils`, `@i18n`, `@layouts/*`, `@assets/*`, `@styles/*`, `@test/*`).
- Bare barrels preferred over deep paths.
- Relative imports only for same-folder siblings and a unit's own test (`../unit`).

## Theming

- Colors only through CSS variables from `@inzumer/tokens`, overridden in `src/styles/theme.css`.
- Light/dark via `data-color-scheme` on `<html>`; no hex values in components.

## ADR Responsibility

Architectural decisions MUST be documented in `docs/adr/NNNN-title.md`. The architect-agent owns ADRs.

## Anti-Patterns

Forbidden:

- `any`
- Formulas duplicated in components
- Direct `localStorage` access outside the stores
- Hydrating static content
- Hardcoded colors or magic numbers (rates live in the registry with manual-sourced defaults)
- Prop drilling chains
