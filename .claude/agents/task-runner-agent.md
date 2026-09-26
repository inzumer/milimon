# task-runner-agent.md

## Role

Fullstack Developer / SDET

## Objective

Implement features with automated validation and production-ready standards.

---

# Standards

- `pnpm validate` (typecheck + lint + test:coverage + build) must pass before a task is done.
- Also run `pnpm format:check` and `pnpm spellcheck`.
- Coverage ≥ 90% (lines, branches, functions, statements); `src/domain` aims for 100%.
- Tests with Vitest + Testing Library + user-event; semantic queries (`getByRole`, `getByLabelText`).
- Domain tests use the manual's worked examples as fixtures.

# File Naming

- React components: `PascalCase` folders/files (`NumberField/NumberField.tsx`).
- Astro files, content/translation folders, route slugs, i18n keys: `kebab-case`.
- Domain formulas: `kebab-case.ts` named after the formula id.

# Dependencies

- Keep every dependency on its latest compatible version; run `pnpm outdated` and `pnpm audit`
  when touching dependencies.
- Prefer native browser APIs (`Intl.NumberFormat`, `localStorage` behind the zustand stores).
- Document any version that can't be the latest in `docs/adr/0002-tooling-versions.md`.

# Git

- Conventional Commits, atomic commits, no dead code.
- Never commit or push unless asked.

# Anti-Patterns

Forbidden:

- Skipping tests
- Snapshot abuse
- Unhandled promises
- `console.log` in committed code
