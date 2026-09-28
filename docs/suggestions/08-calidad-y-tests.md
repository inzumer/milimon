# 08 · Calidad, tests y monitoreo

## Tests end to end (Playwright)

Contra el build (`astro preview`) y en mobile y escritorio:

- Inicio → calculadora → elegir cuenta → cargar ejemplo → resultado y desarrollo.
- Guardar en el historial, recargar, reabrir y borrar.
- Cambiar idioma manteniendo la ruta; cambiar tema y moneda; persistencia tras recargar.
- Banner de cookies: aceptar, rechazar, reabrir desde el pie.
- Compartir: enlaces correctos y "Copiar enlace".
- Login con el backend simulado (rutas de la API interceptadas) y migración de datos.
- Menú: abrir/cerrar con teclado, foco atrapado, Escape.
- 404 en rutas inexistentes, en los dos idiomas.

## En CI

- Correr la auditoría a11y (`scripts/a11y-audit.mjs`) en cada PR, no solo a mano.
- Lighthouse CI y verificación de enlaces rotos.
- Validar el JSON-LD (Rich Results / schema.org) de las páginas clave.
- Tests de contrato entre el front y la API (los tipos del cliente contra el Swagger).
- Dependabot o Renovate para las dependencias de los tres repos.

## Monitoreo en producción

- UptimeRobot (gratis) para el sitio y `/health` de la API.
- Sentry (plan gratuito) para errores del front y de la API, respetando el consentimiento.
- Search Console: cobertura, Core Web Vitals y errores de datos estructurados.

## Repositorios y paquetes (decidido 2026-09-27)

**Nombres de los repos de Milimon**: todos con el prefijo `milimon-`.

| Hoy           | Nuevo nombre      | Contenido                                                       |
| ------------- | ----------------- | --------------------------------------------------------------- |
| `milimon`     | `milimon-web`     | El sitio (Astro)                                                |
| `api-milimon` | `milimon-backend` | La API (NestJS)                                                 |
| —             | `milimon-e2e`     | Playwright + auditorías de accesibilidad, SEO y Lighthouse      |
| —             | `milimon-emails`  | Plantillas de emails (ver [10](./10-emails-transaccionales.md)) |
| —             | `milimon-cms`     | El CMS, si termina separado (ver [02](./02-cms-y-emails.md))    |

- Renombrar el front mueve GitHub Pages a `/milimon-web`: cambian `BASE_PATH` y `SITE_URL` del
  deploy, el `CORS_ORIGIN` de la API y se rompen los enlaces ya compartidos. Conviene hacerlo
  junto con el dominio propio ([01](./01-deploy-y-seguridad.md)), que deja de depender del nombre.
- GitHub redirige el repo viejo, pero igual hay que actualizar los remotes (`git remote set-url`),
  las carpetas locales y las referencias en `CLAUDE.md`, `README.md`, `docs/` y el Blueprint de Render.
- `scripts/a11y-audit.mjs` pasa a `milimon-e2e`; `scripts/og-image.mjs` queda en el front (es
  una herramienta del build, no un test).

**Paquetes de `@inzumer`**: un repo por paquete publicado, en lugar del monorepo `ui-library`.

| Paquete hoy                          | Repo nuevo          |
| ------------------------------------ | ------------------- |
| `@inzumer/ui-library` (publicado)    | `inzumer-ui-lib`    |
| `@inzumer/tokens` (publicado)        | `inzumer-ui-tokens` |
| `@inzumer/prettier-config` (privado) | `inzumer-prettier`  |
| `@inzumer/eslint-config` (privado)   | `inzumer-eslint`    |
| `@inzumer/tsconfig` (privado)        | `inzumer-tsconfig`  |
| workflows de `.github/` de cada repo | `inzumer-ci`        |

- Publicar las configs (hoy privadas) permite dejar de copiarlas en cada proyecto.
- `inzumer-ci`: workflows reutilizables de GitHub Actions (`workflow_call`) para lint, tests con
  cobertura, build, e2e, auditorías (accesibilidad, SEO, Lighthouse) y release, que llaman todos los
  repos (Milimon, Zamuner…).
- Orden sugerido: `inzumer-ci` y las configs primero (no rompen nada), después tokens y la
  librería (cambia de dónde publica el release), y por último los repos de Milimon con el dominio.

## Releases automáticos

**Estado: implementado (2026-09-28)** en `milimon` y `api-milimon`: `.github/workflows/release.yml`,
`release-finish.yml` y `.github/scripts/release-plan.mjs` (con tests en `node --test`). La API
corre martes y viernes a las 07:00 UTC y el sitio a las 09:00 UTC. Se puede lanzar a mano desde
**Actions → Release → Run workflow**, eligiendo el tipo de versión.

**Configuración de cada repo** (una sola vez, en GitHub):

- **Settings → Actions → General → Workflow permissions**: "Read and write permissions" y "Allow
  GitHub Actions to create and approve pull requests".
- **Settings → General**: "Automatically delete head branches".
- Si `main` tiene reglas que piden revisiones o checks, dejar pasar al bot `github-actions` o crear
  la variable del repo `RELEASE_AUTO_MERGE=false` (entonces el PR queda para fusionarlo a mano y
  `release-finish.yml` hace el tag, el release y la vuelta a `dev`).

**Diseño**

Objetivo: que el release (`dev` → `main`, versión, tag y vuelta a `dev`) salga solo **una o dos
veces por semana** (por ejemplo martes y viernes) y que **se cierre sin hacer nada si no hay
cambios**. Primero en cada repo; después, como workflow reutilizable en `inzumer-ci`.

**Workflow `release.yml`** (`schedule` + `workflow_dispatch` para forzarlo):

1. Compara `main..dev` (commits que no son merges). **Sin cambios**: cierra los PRs `release/*`
   abiertos, borra sus ramas y termina.
2. Calcula la versión con Conventional Commits desde el último tag: `!` o `BREAKING CHANGE` →
   major, `feat` → minor, el resto → patch.
3. Cierra un PR de release anterior que haya quedado abierto, crea `release/X.Y.Z` desde `dev`,
   sube la versión (`chore(release): X.Y.Z`) y abre el PR a `main` con las notas agrupadas por tipo.
4. Corre la validación completa reutilizando `ci.yml` (agregarle `workflow_call`) sobre la rama.
5. Si pasa y la variable del repo `RELEASE_AUTO_MERGE` no es `false`: fusiona a `main`, crea el tag
   `vX.Y.Z` y el GitHub Release, fusiona `main` en `dev` y borra la rama. Si no, deja el PR para
   revisarlo a mano y un `release-finish.yml` (PR a `main` cerrado y fusionado) hace el resto.

**Detalles a tener en cuenta**

- Lo que hace el `GITHUB_TOKEN` **no dispara otros workflows**: ni el CI del PR ni el deploy de Pages
  por el push a `main`. Por eso la validación va dentro del mismo workflow (paso 4) y el deploy del
  front se lanza con `gh workflow run pages.yml --ref main`. Render sí despliega solo (usa su propia
  integración con GitHub). Alternativa: un token de una GitHub App como secreto.
- Protección de ramas: si `main` pide revisiones, el merge automático falla; o se exceptúa al bot o
  se usa `RELEASE_AUTO_MERGE=false`.
- Se puede correr dos veces sin romper nada: si el tag ya existe, no se vuelve a crear.
- `concurrency` por repo para que no corran dos releases a la vez.
- Activar "Automatically delete head branches" en cada repo.
- Orden: primero la API (el front puede depender de endpoints nuevos). Con horarios distintos (API
  martes 9:00, front martes 11:00) alcanza; más adelante, un release coordinado desde `inzumer-ci`.
