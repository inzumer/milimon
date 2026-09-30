# ADR 0006 · Staging y producción separados, con CMS en staging y backups

- **Estado:** aceptada (sitio, API y base de staging en marcha desde el 30/09)
- **Fecha:** 2026-09-30

## Contexto

Hoy hay un solo ambiente a medias:

- El **sitio** de `dev` se publica en GitHub Pages (staging). Producción (`main`) todavía no tiene
  dónde publicarse: espera el dominio propio.
- Hay **una sola API** (Render, desde `main`) y **una sola base** (Neon, rama `production`), que usan
  staging y producción a la vez. Un cambio de `dev` que necesita la API nueva rompe staging hasta el
  release (pasó con `locale` en el inicio de sesión y con las recetas guardadas).
- El **CMS** (Keystatic) solo funciona en local: necesita un servidor para iniciar sesión con GitHub
  y guardar, y GitHub Pages solo sirve archivos.
- **Backups**: Neon gratuito permite volver a cualquier momento de las **últimas 6 horas**
  (`history_retention_seconds` = 21600). No hay copias propias más viejas.

## Decisión

Dos ambientes completos, de punta a punta, y el contenido viaja de staging a producción con el
mismo release que el código.

| Pieza    | Staging                                                                            | Producción                                                                      |
| -------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Sitio    | Worker `milimon-staging`, rama `dev` (`milimon-staging.inzumer.workers.dev`)       | Worker `milimon`, rama `main` (`milimon.inzumer.workers.dev`, luego el dominio) |
| CMS      | Keystatic online, modo GitHub: cada "Guardar" va a una rama `cms/…` con PR a `dev` | Sin edición: el contenido llega con el release                                  |
| API      | Render `milimon-backend-nest-staging`, desde `dev`                                 | Render `milimon-backend-nest`, desde `main`                                     |
| Base     | Neon rama `staging`, **solo esquema** (sin datos personales)                       | Neon rama `production`                                                          |
| Mails    | Desactivados (sin `RESEND_API_KEY`)                                                | Resend con el dominio                                                           |
| Medición | Entorno "Staging" de GTM                                                           | Entorno "Live" de GTM                                                           |

Flujo de publicación:

1. **Contenido**: Milagros edita en el CMS de staging → rama `cms/…` → el build valida y se abre el
   PR a `dev` → al aceptarlo, staging se actualiza en minutos → lo revisa ahí.
2. **Código**: `feature/*` → PR a `dev` → staging (sitio y API).
3. **Producción**: el release (viernes → lunes, o a mano hasta el lanzamiento) lleva `dev` a `main`
   en el front y en la API. Las migraciones corren primero en staging.

Seguridad:

- **Secretos por ambiente**: `JWT_SECRET`, claves de clientes y `DATABASE_URL` distintos en staging
  y producción. Nunca se comparten.
- **CORS y orígenes**: cada API acepta solo su sitio (staging o producción).
- **CMS**: solo entra quien tiene acceso de escritura al repo en GitHub (la GitHub App de
  Keystatic). En producción `/keystatic` no existe; "Gestión del sitio" enlaza al de staging.
  `dev` sigue aceptando solo PRs: el CMS guarda en ramas `cms/…` y `cms-to-dev` abre el PR.
- **Staging sin datos personales**: su base se crea solo con el esquema y la llenan las pruebas.
- **Ramas protegidas** en GitHub: `main` y `dev` solo por PR con el CI en verde.

Backups de producción:

- **Diario**: un workflow de la API hace `pg_dump` de la rama `production`, lo **cifra** (la clave
  queda en los secretos de GitHub) y lo guarda como artifact por 30 días.
- **Antes de cada release con migraciones**: una rama de Neon `pre-release-<versión>` (copia al
  instante), que se borra a la semana.
- **Prueba de restauración mensual**: restaurar el último backup en una rama temporal y correr los
  e2e contra ella.

## Consecuencias

- Todo entra en los planes gratuitos: dos Workers de Cloudflare (ambientes de Wrangler en
  `wrangler.jsonc`, cada uno con sus variables), dos servicios de Render (staging duerme sin
  keep-alive; las 750 h/mes se comparten en el workspace) y ramas de Neon (hasta 10).
- GitHub Pages quedó retirado al pasar los dos sitios a Cloudflare.
- Hacen falta cuentas y accesos de la persona dueña: Cloudflare, el servicio de staging en Render, la
  GitHub App de Keystatic y los secretos (nunca pasan por el chat).
- El sitio de producción puede salir en `*.workers.dev` antes del dominio y moverse después sin
  cambios de fondo.
