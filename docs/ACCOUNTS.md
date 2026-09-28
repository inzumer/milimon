# Cuentas (login con Google y Facebook)

Las cuentas las resuelve la API [`milimon-backend-nest`](https://github.com/inzumer/milimon-backend-nest)
(NestJS + PostgreSQL). La guía completa para crear la base de datos, desplegar la API y registrar
las apps de Google y Meta está en su [`docs/DEPLOY.md`](https://github.com/inzumer/milimon-backend-nest/blob/main/docs/DEPLOY.md),
y el modelo de seguridad en su [`docs/SECURITY.md`](https://github.com/inzumer/milimon-backend-nest/blob/main/docs/SECURITY.md).

## Variables del front

Se cargan como **variables del repositorio** en GitHub (Settings → Secrets and variables → Actions
→ Variables); el workflow de GitHub Pages las usa al compilar. Todas son públicas por diseño.

| Variable                  | Valor                                                        |
| ------------------------- | ------------------------------------------------------------ |
| `PUBLIC_API_URL`          | URL de la API en Render, sin barra final                     |
| `PUBLIC_API_KEY`          | La misma que `WEB_API_KEY` en la API (identifica al cliente) |
| `PUBLIC_API_APP_ID`       | `web`                                                        |
| `PUBLIC_GOOGLE_CLIENT_ID` | Client ID de OAuth de Google (tipo "Aplicación web")         |
| `PUBLIC_FACEBOOK_APP_ID`  | App ID de Meta for Developers                                |

Sin `PUBLIC_API_URL`, las páginas `/login` y `/account` explican que las cuentas todavía no están
disponibles. Cada botón de login aparece solo si su id está configurado.

## Probar en local

1. Levantar la API (`docker compose up -d` y `npm run start:dev` en su repo), con
   `CORS_ORIGIN=http://localhost:4321`.
2. En este repo, `.env` con `PUBLIC_API_URL=http://localhost:3000`, `PUBLIC_API_KEY` igual a la
   `WEB_API_KEY` de la API y los ids de Google/Facebook (con `http://localhost:4321` como origen
   autorizado en ambos).
3. `pnpm dev` → `/es/login`.

## Roles y administración

- Cada cuenta tiene un rol: **usuario** (todos), **editor** (gestiona el contenido del sitio) o
  **admin** (contenido y roles). La fuente de verdad es la base de datos de la API.
- **Primer admin**: en Render, la variable `BOOTSTRAP_ADMIN_EMAILS` (emails separados por coma)
  convierte en admin a esas personas la primera vez que inician sesión con ese email verificado.
  Después, los roles se gestionan desde **Administración** (`/es/admin`), no desde la variable.
- **Gestión del sitio** (grupo del menú, solo para editores y admins):
  - **Panel de gestión** (`/admin`): la sección de contenido (donde irá el CMS) y, para admins, la
    lista de cuentas con búsqueda, el cambio de rol con confirmación y el registro de cambios.
  - **Agenda de publicaciones** (`/admin/agenda`): qué se publica y cuándo, por mes; se guarda en
    la API (`/admin/agenda`), que vuelve a comprobar el rol en cada cambio.
  - **Guía de fotos** y **Sugerencias** (`/admin/suggestions/{id}`): los documentos de
    `docs/suggestions`, generados en el build (ids en `ADMIN_DOCS`). Ya son públicos en el
    repositorio, así que se ocultan con la sesión guardada en el dispositivo (sin llamar a la
    API), no se indexan y no están en el sitemap.
- **Zócalo "Modo gestión"**: franja debajo del header con el rol de quien navega; solo la ven
  editores y admins.
- Reglas (las aplica la API): nadie cambia su propio rol, siempre queda al menos un admin y cada
  cambio queda registrado con quién lo hizo y cuándo. Detalle en `docs/SECURITY.md` de la API.
