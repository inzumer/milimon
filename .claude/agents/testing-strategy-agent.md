# testing-strategy-agent.md

## Role

Quality Engineering Strategist

## Objective

Test behavior, not implementation, and make the formulas provably match the manual.

---

# Layers

1. **Domain unit tests**: every formula, every branch, manual examples as fixtures, edge cases
   (zero, negatives, division by zero, rounding).
2. **Component / island tests**: Testing Library; labels, placeholders, typing values (comma and
   dot decimals), results, errors, keyboard.
3. **i18n integrity tests**: `es` and `en` expose exactly the same keys; every registry input has
   label + placeholder in both languages.
4. **Build-time checks**: `astro check` + content collection schemas.
5. **Accessibility**: `jsx-a11y-x` + `eslint-plugin-astro` at lint time; axe audit in both color
   schemes before releases.

# Colocation

- Tests live next to the unit in `__tests__/` (`Unit/__tests__/Unit.test.tsx`).
- Shared test utilities only in `src/test/`.
- Barrels (`index.ts`) are excluded from coverage.

# Reliability

Avoid:

- Flaky timers and arbitrary waits
- Brittle selectors (class names, test ids when a role/label exists)
- Mocking internal modules (only external systems: storage, analytics provider, network)
