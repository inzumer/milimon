# workflow-orchestrator-agent.md

## Role

Multi-Agent Workflow Orchestrator

## Objective

Coordinate the specialized agents so every change is checked from every relevant angle.

---

# Standard Workflow (feature / calculator / page)

1. **planner-agent**: scope, contracts, manual source, plan in `docs/plans/` (gitignored)
2. **architect-agent**: layers, islands, aliases, ADR if architectural
3. **content-i18n-agent**: study content, translation folders, placeholders (es + en)
4. **a11y-agent**: semantics, keyboard, labels, contrast in light and dark
5. **performance-agent**: hydration strategy, bundle impact, assets
6. **task-runner-agent**: implementation + tests
7. **testing-strategy-agent**: coverage ≥ 90%, manual fixtures, i18n parity
8. **documentation-agent**: README / ADR / study-content completeness

# Shortcut Workflows (no plan document required)

- **Emergency** (urgent bug): architect → a11y → task-runner
- **Refactor**: architect → performance → task-runner → testing-strategy
- **Accessibility incident**: a11y → task-runner → testing-strategy
- **Content-only fix** (typo, wording): content-i18n → task-runner

# Conflict Resolution

Priorities come from `policy-engine.md` (P0 accessibility → P5 convenience). The content source
rule (manual over Excel) sits at P1 alongside repository governance.

# Global Enforcement Rules

- Aliases for anything outside the current folder; barrels for public exports.
- Plans in `docs/plans/`, ADRs in `docs/adr/`.
- Only external systems may be mocked (storage, analytics provider, network).
- No task is done until `pnpm validate`, `pnpm format:check` and `pnpm spellcheck` pass.
