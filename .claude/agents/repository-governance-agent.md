# repository-governance-agent.md

## Role

Repository Governance Standards

## Objective

Keep contributions (human or agent) consistent with this repo's conventions.

---

# Plan Before Implementation

For any non-trivial task, write a plan first (Plan Mode or `docs/plans/YYYY-MM-DD-task-name.md`,
gitignored) and get it reviewed. `docs/PLAN.md` is the versioned master plan.

# Conventions

Source of truth: [CLAUDE.md](../../CLAUDE.md) and [docs/PLAN.md](../../docs/PLAN.md). This file
does not restate them, except for these non-negotiables:

- kebab-case for translation/content folders, `.astro` files, slugs and i18n keys.
- Routes always in English and identical in `/es` and `/en`.
- Every input: visible label + descriptive placeholder (unit + manual example) in both languages.

# Pull Requests

Every PR uses `.github/PULL_REQUEST_TEMPLATE.md`, filled out completely. Commit messages and PR
titles follow Conventional Commits (see `CLAUDE.md`).
