# Cuentas (login con Google y Facebook)

Las cuentas las resuelve la API [`api-milimon-cost-lab`](https://github.com/inzumer/api-milimon-cost-lab)
(NestJS + PostgreSQL). La guía completa para crear la base de datos, desplegar la API y registrar
las apps de Google y Meta está en su [`docs/DEPLOY.md`](https://github.com/inzumer/api-milimon-cost-lab/blob/main/docs/DEPLOY.md),
y el modelo de seguridad en su [`docs/SECURITY.md`](https://github.com/inzumer/api-milimon-cost-lab/blob/main/docs/SECURITY.md).

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
