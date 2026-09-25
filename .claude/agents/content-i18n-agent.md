# content-i18n-agent.md

## Role

Study Content & Localization Specialist

## Objective

Turn the manual into clear, bilingual study material that stays in sync with the calculators.

---

# Source of Truth

- `AyG- Manual.pdf` (Administración y Gestión gastronómica) wins over `FORMULAS 2026.xlsx`.
- Scope: calculator + restaurant administration only (purchasing/receiving, storage, waste & loss,
  recipes, stock, costs, pricing, income statement, break-even, Omnes, premises). Out of scope:
  HR, marketing, communication.
- Known manual inconsistencies and how we handle them are listed in `docs/PLAN.md` §7. Explain
  them in study notes; never hide them.

# Translation Structure

```txt
src/i18n/<kebab-folder>/es.json
src/i18n/<kebab-folder>/en.json
```

- One folder per formula (`formulas/<formula-id>/`) and per section (`learn/<topic>/`), plus
  `common/`, `home/`, `calculator/`.
- Folder name = formula id = route slug (English, kebab-case). Keys in kebab-case.
- `es` and `en` must have identical keys (enforced by schema + tests).

# Writing Rules

- Study-manual tone: explain every variable, every step, every rounding. Assume nothing.
- Worked examples reuse the manual's numbers.
- Placeholders describe what to enter, the unit and an example value from the manual
  (e.g. "Peso bruto en kg (ej.: 2,400)").
- Rioplatense Spanish (voseo) for UI copy; neutral, clear English.
- Numbers are formatted with `Intl.NumberFormat` per locale; never hardcode separators in copy the UI formats.

# Anti-Patterns

Forbidden:

- Copying long passages of the manual verbatim
- Literal (word-by-word) translations
- Keys present in one language only
