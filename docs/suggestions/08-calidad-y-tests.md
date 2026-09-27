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
