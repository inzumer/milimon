# ADR 0002 — Tooling versions and deviations from ui-library

- **Status:** accepted
- **Date:** 2026-09-25

## Context

Policy: every dependency on its **latest** version with **no known vulnerabilities**
(`pnpm audit`). ui-library (the conventions we mirror) is on older majors (TS 5, ESLint 9,
Tailwind 3, Vitest 2). This ADR records where we match "latest" and where we can't yet.

## Decisions

| Area          | Version                    | Notes                                                                                                                                                           |
| ------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node          | **24.21.0 LTS** (`.nvmrc`) | Latest LTS. Node 26 becomes LTS in October 2026. Upgrade then.                                                                                                  |
| pnpm          | **12.6.0**                 | Latest. Install scripts blocked by default; allowed explicitly in `pnpm-workspace.yaml`.                                                                        |
| Astro         | 7.3.5                      | Latest.                                                                                                                                                         |
| React         | 19.3.0                     | Latest.                                                                                                                                                         |
| TypeScript    | **6.0.3** (latest: 7.0.2)  | `@astrojs/check` supports `^5 \|\| ^6` and `typescript-eslint` supports `<6.1`. Upgrade to 7 when both do.                                                      |
| Tailwind      | 4.3.3                      | Latest. The `@inzumer/tokens` preset (v3 format) is loaded with `@config`; ui-library's `dist` is scanned with `@source` because it ships class names, not CSS. |
| ESLint        | 10.11.0                    | Latest. `eslint-plugin-react` and `eslint-plugin-jsx-a11y` don't support ESLint 10 → replaced by `@eslint-react/eslint-plugin` and `eslint-plugin-jsx-a11y-x`.  |
| Vitest        | 5.x                        | Latest (pnpm's release-age policy may hold a patch released in the last few days).                                                                              |
| `@types/node` | 24.x                       | Matches the Node major in `.nvmrc`, not the latest types major.                                                                                                 |

## Native binaries on Windows

Windows Smart App Control blocked `@astrojs/compiler-binding-win32-x64-msvc@0.5.0` (released
three days before this ADR, so without reputation yet). Rather than downgrading Astro or
weakening OS security, `pnpm-workspace.yaml` also installs `wasm32` builds of napi-rs packages;
their loaders fall back to WebAssembly automatically when the native binary can't be loaded.
CI (Linux) keeps using native binaries. Revisit and remove `wasm32` once the native binary loads.

## Review

Run `pnpm outdated` and `pnpm audit` at the start of each phase and update this table when an
exception is resolved.
