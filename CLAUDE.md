# CLAUDE.md

Guidance for Claude Code (and any other AI coding agent) working in this repository.

## Project

**Milimon Cost Lab** (`milimon-cost-lab`): a bilingual (`/es`, `/en`) study manual and set of
calculators for food cost, waste (desechos) and cooking loss (mermas) in gastronomy.

- Master plan and decisions: [docs/PLAN.md](./docs/PLAN.md). Architecture decisions: [docs/adr](./docs/adr).
- Content source of truth: the original manual `AyG- Manual.pdf`; it wins over `FORMULAS 2026.xlsx`.
- Stack: Astro (static output) + React 19 islands, TypeScript strict, Tailwind v4 + `@inzumer/tokens`
  preset, `@inzumer/ui-library` components, Vitest + Testing Library.
- Agent roles live in [.claude/agents](./.claude/agents); start with `workflow-orchestrator-agent.md`.

Key commands (Node from `.nvmrc`, pnpm from `packageManager`):

| Command              | What it does                                                   |
| -------------------- | -------------------------------------------------------------- |
| `pnpm dev`           | Astro dev server                                               |
| `pnpm typecheck`     | `astro check` (TS + `.astro`)                                  |
| `pnpm lint`          | ESLint (TS, React, a11y, Astro, Vitest)                        |
| `pnpm test:coverage` | Vitest with the **90%** coverage gate                          |
| `pnpm build`         | Static build to `dist/`                                        |
| `pnpm format`        | Prettier (imports sorted, Astro + Tailwind plugins)            |
| `pnpm spellcheck`    | cspell (en + es; project words in `.cspell/project-words.txt`) |
| `pnpm validate`      | typecheck + lint + test:coverage + build                       |

## Non-negotiable conventions

- **Routes** always in English and identical in both languages: `/es/formulas/cooking-loss` ↔ `/en/formulas/cooking-loss`.
- **Translations** in kebab-case folders, one file per language: `src/i18n/<folder>/{es,en}.json`.
  Folder name = formula id = route slug. `es` and `en` must have exactly the same keys.
- **Every input** has a visible label and a descriptive placeholder (what, unit, example from the manual).
- **Tests**: every test title starts with `should …` (e.g. `it('should render the menu')`), enforced
  by `vitest/valid-title`. `describe` names the unit under test.
- **Formulas** are pure functions in `src/utils/formulas`, registered once in `registry.ts`, tested with
  the manual's worked examples.
- **Imports**: path aliases (`@components`, `@constants`, `@calculators`, `@repositories`, `@services`, `@hooks`, `@utils`, `@i18n`,
  `@layouts/*`, `@assets/*`, `@styles/*`, `@test/*`) for anything outside the current folder. Enforced by ESLint.
- **Constants**: limits, retries, timeouts, patterns and other tunable values live in `src/constants`
  (`@constants`), never as magic numbers inside components or services.
- **Tracking ids**: every interactive element (inputs, selects, switches, buttons, CTA links) has a
  stable id from `trackingId(scope, kind, name)` for Google Tag Manager (see docs/TRACKING.md).
- **Placement**: UI pieces in `src/components` (atoms / molecules / organisms), calculator islands
  only in `src/calculators`, hooks in `src/hooks`, pure helpers and formulas in `src/utils`,
  tunable values in `src/constants`, external integrations (API, GTM, sign-in SDKs) in `src/services`.
- **Naming**: React components in PascalCase folders; `.astro` files, content folders, slugs and
  i18n keys in kebab-case.
- **Theming**: colors only via CSS variables (`src/styles/theme.css`); light and dark mode must both work.
- **Layout**: mobile-first; one layout up to 1024px, centered container above.
- **Static first**: no `client:*` directive unless the component is interactive.
- **Persistence**: through repositories only (localStorage now, accounts later). **Analytics**: through `track()` only.
- **Dependencies**: latest compatible versions, `pnpm audit` clean. Exceptions documented in
  [docs/adr/0002-tooling-versions.md](./docs/adr/0002-tooling-versions.md).

## Commit messages & PR titles

This repo strictly follows [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
for every commit message and pull request title generated or suggested here.

Format: `<type>[optional scope]: <description>`

| Type       | Use for                                  |
| ---------- | ---------------------------------------- |
| `feat`     | New functionality                        |
| `fix`      | Bug fix                                  |
| `chore`    | Maintenance, dependencies, routine tasks |
| `refactor` | Code change with no functional impact    |
| `docs`     | Documentation only                       |
| `test`     | Adding or fixing tests                   |
| `style`    | Formatting/whitespace, no logic change   |
| `perf`     | Performance improvements                 |
| `ci`       | CI configuration                         |
| `build`    | Build system / tooling                   |
| `content`  | Study content or translations only       |

Breaking changes: append `!` before the colon and/or add a `BREAKING CHANGE:` footer.

Suggested scopes: `formulas`, `calculators`, `ui`, `i18n`, `theme`, `pages`, `deps`, `ci`.

## Git workflow (gitflow)

- `main`: production. Only receives `release/*` (and `hotfix/*`) merges, tagged `vX.Y.Z`.
- `dev`: integration branch. Every feature is merged here with `--no-ff`.
- `feature/<kebab-name>` from `dev` → back into `dev`. One phase (or part of one) per feature branch.
- `release/<version>` from `dev` → `main` (tag) and back into `dev`.
- `hotfix/<kebab-name>` from `main` → `main` (tag) and `dev`.
- Releases so far: v1.0.0 (F0–F10, accounts and history) and v1.1.0 (F9: components moved to
  ui-library). New work keeps going through `feature/*` → `dev` → `release/*`.
- Never commit directly on `main` or `dev`, and never commit or push unless asked.

## Pull requests

Every PR must use [.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md) filled out
in full. Describe what changed and why, tick checklist items only once they're true, and leave a
trail in "Notas adicionales" for any non-obvious decision.

## Local environment notes

- `pnpm-workspace.yaml` allows only the install scripts we need (`esbuild`) and also installs the
  WebAssembly builds of native packages, used automatically as a fallback when a native binary
  can't load (e.g. Windows Smart App Control blocking a freshly released `.node` file). Seeing
  `ExperimentalWarning: WASI` locally means that fallback is active.
