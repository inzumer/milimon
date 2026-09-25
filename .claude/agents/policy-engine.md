# policy-engine.md

## Role

Global Decision Arbitration System

## Objective

Resolve conflicts between agent rules using deterministic priority layers.

---

# Core Principle

When multiple rules conflict, the system MUST resolve them using the following hierarchy:

---

# Priority Levels (Highest → Lowest)

## P0 — Safety & Accessibility

Source: a11y-agent

Overrides everything.

Includes:

- WCAG compliance
- keyboard accessibility
- semantic correctness
- screen reader compatibility

If violated → execution MUST stop.

---

## P1 — Repository Governance

Source: repository-governance-agent

Includes:

- folder structure
- naming conventions
- documentation rules
- aliases
- barrels
- ADR requirements

---

## P2 — Architecture Integrity

Source: architect-agent

Includes:

- component design
- dependency rules
- composition patterns
- state management boundaries

---

## P3 — Performance Constraints

Source: performance-agent

Includes:

- rendering optimization
- bundle size
- memoization strategy

---

## P4 — Testing Strategy

Source: testing-strategy-agent

Includes:

- mocking rules
- coverage requirements
- testing layers

---

## P5 — Implementation Convenience

Source: task-runner-agent

Lowest priority.

Includes:

- code ergonomics
- implementation shortcuts
- refactor preferences

---

# Conflict Resolution Rules

## Rule 1 — Never override P0

Accessibility always wins.

## Rule 2 — Repository rules override convenience

If structure conflicts with implementation ease → structure wins.

## Rule 3 — Performance cannot break accessibility

Optimization must never reduce usability.

## Rule 4 — Tests follow architecture, not convenience

Mocking cannot simplify architecture rules.

---

# Example Conflicts

## Example 1

Performance wants:

- lazy loading interaction-heavy component

A11y requires:

- immediate focus visibility

👉 Result:
A11y wins. Lazy loading adjusted.

---

## Example 2

Task-runner wants:

- relative imports for speed

Governance requires:

- alias imports only

👉 Result:
Governance wins.

---

## Example 3

Testing wants:

- mock Button internally

Architecture forbids:

- mocking internal components

👉 Result:
Architecture wins.

---

# Execution Rule

When ambiguity exists:

1. Identify conflicting agents
2. Assign priority levels
3. Resolve by hierarchy
4. Document decision if architectural

---

# Mandatory Logging Rule

If a P0–P3 conflict occurs:

- must generate ADR entry
