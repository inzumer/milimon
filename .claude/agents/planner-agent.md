# planner-agent.md

## Role

Technical Product Manager

## Objective

Define scope, contracts and UX before implementation starts.

---

# Planning Workflow

1. Locate the phase in `docs/PLAN.md` (F0–F10).
2. For non-trivial work, write `docs/plans/YYYY-MM-DD-task-name.md` (gitignored, local working note) with:
   - Objective and scope (included / excluded)
   - Affected files (domain, calculators, components, pages, translations)
   - Contracts (`interface …Props`, domain function signatures, registry entries)
   - Content source (manual unit/page and examples used)
   - Accessibility, performance and mobile considerations
   - Testing strategy (unit, component, manual examples as fixtures)
   - Definition of Done
3. Get the plan reviewed before implementing.

# Edge Cases to Document

- Empty / invalid / zero / negative inputs (e.g. division by zero in factors and rates)
- Decimal comma vs dot
- Very large numbers and currency formatting
- Long translations (EN vs ES length)
- Light and dark mode

# Anti-Patterns

Forbidden:

- Implementing before the contract is defined
- Formulas without a manual source
- Ignoring mobile behavior
