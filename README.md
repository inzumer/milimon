# Milimon Cost Lab

Manual de estudio y calculadoras de costos, desechos y mermas en gastronomía. Bilingüe
(`/es`, `/en`), mobile-first, con modo claro y oscuro.

Basado en el manual _Administración y Gestión gastronómica_. Plan completo en
[docs/PLAN.md](./docs/PLAN.md).

## Stack

- [Astro](https://astro.build) (salida estática) + islas de React 19
- TypeScript estricto
- Tailwind CSS v4 + [`@inzumer/tokens`](https://www.npmjs.com/package/@inzumer/tokens)
- Componentes de [`@inzumer/ui-library`](https://www.npmjs.com/package/@inzumer/ui-library)
- Vitest + Testing Library (cobertura mínima 90%)
- ESLint 10, Prettier, cspell

Detalle de versiones y excepciones: [docs/adr/0002-tooling-versions.md](./docs/adr/0002-tooling-versions.md).

## Requisitos

- Node **24.21.0** (ver `.nvmrc`; con nvm: `nvm install` + `nvm use`)
- pnpm **12** (`npm install -g pnpm@12` o `corepack enable`)

## Uso

```bash
pnpm install
pnpm dev          # http://localhost:4321 → redirige a /es
```

| Script               | Descripción                                                                         |
| -------------------- | ----------------------------------------------------------------------------------- |
| `pnpm dev`           | Servidor de desarrollo                                                              |
| `pnpm build`         | Build estático en `dist/`                                                           |
| `pnpm preview`       | Sirve el build                                                                      |
| `pnpm typecheck`     | `astro check`                                                                       |
| `pnpm lint`          | ESLint                                                                              |
| `pnpm test`          | Tests                                                                               |
| `pnpm test:coverage` | Tests con umbral de cobertura del 90%                                               |
| `pnpm format`        | Prettier                                                                            |
| `pnpm spellcheck`    | Corrector ortográfico (inglés + español)                                            |
| `pnpm validate`      | typecheck + lint + test:coverage + build                                            |
| `pnpm audit:a11y`    | axe-core en todas las páginas, tema claro y oscuro (requiere `pnpm build` y Chrome) |
| `pnpm og:image`      | Regenera las imágenes para compartir `public/og/og-{es,en}.png` (requiere Chrome)   |

## Deploy

El sitio es estático (`dist/`), así que sirve cualquier hosting estático. En Vercel se detecta Astro
solo, sin configuración.

Variables de entorno (ver `.env.example`):

| Variable                          | Para qué                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `SITE_URL`                        | URL pública: canónicas, `hreflang`, sitemap y Open Graph (obligatoria en producción)   |
| `PUBLIC_GTM_ID`                   | Contenedor de Google Tag Manager (`GTM-…`). Vacío = sin analítica ni banner de cookies |
| `PUBLIC_SUPABASE_URL`             | URL del proyecto de Supabase (cuentas). Vacío = sin login                              |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable de Supabase (pública por diseño; los datos se protegen con RLS)       |

Para activar el login con Google y Facebook, seguí [docs/ACCOUNTS.md](docs/ACCOUNTS.md).

## Estructura

```
src/
  pages/        rutas (.astro): /[lang]/…
  layouts/      layouts .astro
  components/   UI reutilizable (atoms / molecules / organisms / templates)
  calculators/  islas de React, una por calculadora
  domain/       fórmulas puras + registry
  repositories/ persistencia (configuración, borradores) detrás de interfaces
  services/     integraciones externas (Google Analytics, cuentas con Supabase)
  i18n/         traducciones en carpetas kebab-case: <carpeta>/{es,en}.json
  hooks/ utils/ styles/ assets/ test/
supabase/
  migrations/   tablas y políticas RLS de las cuentas
docs/
  PLAN.md       plan maestro
  adr/          decisiones de arquitectura
```

## Convenciones

Ver [CLAUDE.md](./CLAUDE.md): Conventional Commits, aliases de imports, traducciones en
kebab-case, rutas en inglés, placeholders descriptivos y tokens de color para claro y oscuro.
