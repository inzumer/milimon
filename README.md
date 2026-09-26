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

El sitio es estático y se publica en **GitHub Pages**: <https://inzumer.github.io/milimon-cost-lab/>.
El workflow `.github/workflows/pages.yml` compila y despliega cada push a `main` (es decir, cada
release). Las variables `PUBLIC_*` se cargan como variables del repositorio (Settings → Secrets and
variables → Actions → Variables). La API de cuentas se despliega aparte, en Render (ver su repo).

Variables de entorno (ver `.env.example`):

| Variable                                             | Para qué                                                                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL` / `BASE_PATH`                             | Origen y ruta base del sitio (`https://inzumer.github.io` + `/milimon-cost-lab`): canónicas, `hreflang`, sitemap y Open Graph      |
| `PUBLIC_GTM_ID`                                      | Contenedor de Google Tag Manager (`GTM-…`). Vacío = sin analítica ni banner de cookies                                             |
| `PUBLIC_API_URL`                                     | URL de la API de cuentas ([api-milimon-cost-lab](https://github.com/inzumer/api-milimon-cost-lab)). Vacío = cuentas no disponibles |
| `PUBLIC_API_KEY` / `PUBLIC_API_APP_ID`               | Identificación del cliente ante la API (públicas por diseño)                                                                       |
| `PUBLIC_GOOGLE_CLIENT_ID` / `PUBLIC_FACEBOOK_APP_ID` | Botones de login; cada uno aparece solo si está configurado                                                                        |

Para activar el login con Google y Facebook, seguí [docs/ACCOUNTS.md](docs/ACCOUNTS.md).

## Estructura

```
src/
  pages/        rutas (.astro): /[lang]/…
  layouts/      layouts .astro
  components/   toda la UI (atoms / molecules / organisms), calculadoras incluidas
  hooks/        estado de React (una por calculadora, borradores, moneda, tema)
  utils/        funciones puras: fórmulas + registry, cálculo, formato, tracking…
  constants/    valores ajustables
  repositories/ persistencia (configuración, borradores) detrás de interfaces
  services/     integraciones externas (API de cuentas, Google Tag Manager, SDKs de login)
  i18n/         traducciones en carpetas kebab-case: <carpeta>/{es,en}.json
  styles/ assets/ test/
docs/
  PLAN.md       plan maestro
  adr/          decisiones de arquitectura
```

## Convenciones

Ver [CLAUDE.md](./CLAUDE.md): Conventional Commits, aliases de imports, traducciones en
kebab-case, rutas en inglés, placeholders descriptivos y tokens de color para claro y oscuro.
