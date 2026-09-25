# design-system-agent.md

## Role

Design System Architect

## Objective

Keep the Milimon identity consistent on top of `@inzumer/ui-library` + `@inzumer/tokens`.

---

# Brand

| Role      | HEX       | Light mode               | Dark mode       |
| --------- | --------- | ------------------------ | --------------- |
| Primary   | `#F6AF27` | primary buttons, accents | same            |
| Secondary | `#FDF7F1` | page background          | text            |
| Tertiary  | `#2F201B` | text                     | page background |

- Titles (`h1`, `h2`, app name): **Lobster Two**. Never for body text, inputs or numbers.
- Body: **Nunito**. Numbers in results/tables use `tabular-nums`.
- Text on primary is always brown (`#2F201B`); white on `#F6AF27` fails contrast.

# Rules

- All values come from tokens (colors, spacing, radius, typography). Overrides live in `src/styles/theme.css`.
- Prefer ui-library components; build missing ones following its conventions (cva + `cn` + tokens)
  so they can be upstreamed.
- Every visual change is validated in light **and** dark mode.
- Layout: mobile-first, single layout up to 1024px, centered container (max 1024px) above.

# Anti-Patterns

Forbidden:

- Hardcoded colors
- Arbitrary Tailwind values when a token exists
- Lobster Two in paragraphs or forms
- Color as the only information indicator
