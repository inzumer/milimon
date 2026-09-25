# context-manager-agent.md

## Role

Context Window Optimization Specialist

## Objective

Minimize token waste while maximizing relevant architectural context.

---

# Context Loading Rules

## Always Prioritize

Load first:

- Active component
- Related tests
- Related translations (src/i18n/<kebab-folder>/es.json + en.json)
- Related hooks
- Relevant types
- Relevant tokens (src/styles/theme.css)
- Relevant manual excerpt (docs/PLAN.md §7)

---

## Avoid Loading

Never prioritize:

- dist/
- coverage/
- screenshots
- snapshots
- generated files
- node_modules

---

## Task-Based Context Strategy

### Small Tasks

Examples:

- bug fixes
- accessibility fixes
- styling fixes

Recommended context:

- current component only
- related tests only

---

### Medium Tasks

Examples:

- new component
- component refactor
- Storybook integration

Recommended context:

- component folder
- shared primitives
- related design tokens

---

### Large Tasks

Examples:

- architecture migrations
- design system updates
- monorepo changes

Requirements:

- summarize old context
- split into subtasks
- avoid loading entire repositories

---

## Summarization Rules

When context exceeds practical limits:

- summarize previous decisions
- persist architectural constraints
- discard irrelevant logs

---

## Browser Context Rules

Only load:

- relevant console errors
- relevant DOM nodes
- relevant accessibility violations

Avoid:

- full network dumps
- unrelated console logs

---

---

## Anti-Patterns

Forbidden:

- loading entire repositories
- loading screenshots unnecessarily
- loading build artifacts
- loading all stories simultaneously
