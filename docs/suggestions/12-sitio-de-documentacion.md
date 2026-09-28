# 12 · Sitio de documentación

Un sitio propio para documentar cómo funciona Milimon, con diagramas de flujo, el plan y las
sugerencias, separado del sitio principal: **`docs.<dominio>`** (decidido 2026-09-28).

## Por qué un subdominio

- La documentación es para el equipo (Milagros, editores, desarrollo), no para quien visita el
  sitio; separarla evita mezclar navegación, SEO y estilos.
- Tiene su propio ritmo: se puede publicar sin hacer un release del sitio.
- Hoy la sección **Gestión del sitio → Sugerencias** (`/admin/suggestions`) muestra estos
  documentos con la sesión de editor o admin; cuando exista el subdominio, esa sección enlaza allá.

## Cómo

- **Repo `milimon-docs`** (sigue la convención `milimon-*`, ver
  [08](./08-calidad-y-tests.md#repositorios-y-paquetes-decidido-2026-09-27)).
- **[Starlight](https://starlight.astro.build/)**: es Astro, el mismo stack del sitio. Trae
  navegación lateral, buscador (Pagefind, sin servicios externos), modo claro y oscuro, español e
  inglés y páginas en Markdown/MDX. Gratis.
- **Diagramas con [Mermaid](https://mermaid.js.org/)** escritos en Markdown: se versionan como
  texto, GitHub también los muestra y se revisan en los PRs. Se renderizan a SVG en el build (sin
  JavaScript en el navegador, compatible con una CSP estricta).
- **Tema con los tokens** de `@inzumer/tokens` y la paleta de Milimon (crema, chocolate,
  terracota, amarillo).
- **Hosting**: Cloudflare Pages (el mismo proveedor que el deploy oficial, ver
  [01](./01-deploy-y-seguridad.md)), con un subdominio del dominio propio. Si todavía no hay
  dominio, GitHub Pages del repo.
- **Acceso**: el plan y las sugerencias ya son públicos en el repo. Si más adelante hay algo
  privado, Cloudflare Access (gratis hasta 50 personas) pide el email antes de entrar.
- **Fuente única**: `docs/` de cada repo sigue siendo la fuente; el sitio los toma en el build
  (con `git submodule`, o un paso de CI que copia `milimon-web/docs` y `milimon-backend/docs`) para no
  duplicar texto.

## Contenido

| Sección            | Qué incluye                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Visión general     | Qué es Milimon, secciones del sitio, repos y cómo se conectan                                 |
| Arquitectura       | Sitio estático + islas de React, API NestJS + Postgres (Neon), Render, GitHub Pages; las ADRs |
| Cómo funciona      | Un documento por flujo, cada uno con su diagrama (lista abajo)                                |
| Guías de uso       | Para Milagros y editores: agenda, roles, CMS, fotografía                                      |
| Desarrollo         | Convenciones (`CLAUDE.md`), gitflow, releases, tests, tracking (`TRACKING.md`)                |
| Plan y sugerencias | `PLAN.md` con sus pendientes y las sugerencias 01 a 12                                        |

## Diagramas de flujo a hacer

1. **Mapa del sistema**: navegador, sitio estático, API, base de datos, Google/Facebook, GTM.
2. **Inicio de sesión** con Google (y Facebook): credencial → API → tokens → sesión en el
   dispositivo.
3. **Renovación del token**: access token de 15 minutos, refresh token de un solo uso, sesión
   vencida.
4. **Sincronización**: invitado en `localStorage` → migración al iniciar sesión → cambios que se
   guardan en la cuenta.
5. **Calculadora**: fórmula pura → registry → formulario → resultado con el desarrollo de la cuenta
   → historial.
6. **Roles**: primer admin por `BOOTSTRAP_ADMIN_EMAILS`, cambio de rol con confirmación, reglas (no
   el propio rol, siempre un admin) y registro de cambios.
7. **Agenda de publicaciones**: crear, editar y borrar; qué comprueba la API en cada paso.
8. **Consentimiento y medición**: banner de cookies, Consent Mode v2, `track()` → GTM.
9. **Borrado de cuenta** (y el callback de Meta).
10. **Gitflow y releases**: `feature/*` → `dev` → release automático → `main` → deploy (ver
    [08](./08-calidad-y-tests.md#releases-automáticos)).
11. **Publicar contenido con el CMS**, cuando exista (ver [02](./02-cms-y-emails.md)).

## Pasos

**Estado (2026-09-28):** los pasos 1, 2, 3 y 5 están hechos en
[`inzumer/milimon-docs`](https://github.com/inzumer/milimon-docs), publicado en
https://inzumer.github.io/milimon-docs/. Cambio respecto del diseño: los diagramas se dibujan en el
navegador (`astro-mermaid`), así siguen el modo claro u oscuro y el build no necesita un navegador.

1. Crear `milimon-docs` con Starlight, el tema y los diagramas de Mermaid.
2. Traer `docs/` de los repos en el build y armar la navegación.
3. Escribir primero los diagramas 1 a 4 (lo que más se consulta) y después el resto.
4. Publicarlo en el subdominio con el deploy oficial; enlazarlo desde **Gestión del sitio**.
5. Sumar al CI un chequeo de enlaces rotos y que el build falle si un diagrama no compila.
