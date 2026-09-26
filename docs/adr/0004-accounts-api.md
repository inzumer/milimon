# ADR 0004 · Cuentas con una API propia (reemplaza a la ADR 0003)

- **Estado:** aceptada
- **Fecha:** 2026-09-26
- **Reemplaza a:** [ADR 0003](0003-accounts-with-supabase.md)

## Contexto

La primera versión de las cuentas usaba Supabase directo desde el navegador. Se decidió que el
backend viva en **su propio repositorio**, con las convenciones de las otras APIs (`api-zamuner`,
`api-store`): [`api-milimon`](https://github.com/inzumer/api-milimon), NestJS +
PostgreSQL. Este repo queda solo con el front (sitio estático en GitHub Pages).

## Decisión

- **Sin código de backend en el front**: se eliminaron el SDK de Supabase, sus migraciones SQL y su
  adaptador. El esquema, las reglas y la seguridad viven en el repo de la API.
- **Login sin redirecciones por la API**: el front obtiene un ID token de Google (botón oficial de
  Google Identity Services) o un access token de Facebook (Facebook Login) y lo envía a
  `POST /auth/google` o `/auth/facebook`. La API lo verifica con el proveedor y devuelve su propia
  sesión: access token JWT de 15 minutos y refresh token rotativo de un solo uso.
- **`AccountBackend` se mantiene**: `api-backend.ts` lo implementa sobre HTTP y la sincronización
  offline-first (ADR 0003) no cambia.
- **Cliente HTTP** (`src/utils/http`): timeout por intento y **como máximo 3 reintentos** con espera
  exponencial, solo ante fallas transitorias (red, 408, 429, 5xx; respeta `retry-after`). Los valores
  viven en `src/constants/api.ts`. El refresh de sesión **no** se reintenta si el servidor pudo
  haberlo procesado: reenviar un refresh token ya usado dispara la detección de reúso de la API.
- **Sesión en `localStorage`** (`milimon:auth`): un sitio estático no tiene servidor propio para una
  cookie httpOnly. Por eso el sitio lleva una Content-Security-Policy estricta.
- **Encabezados de cliente** en cada llamada: `request-app-id`, `x-api-key` (identifica al cliente;
  es pública, no es un secreto) y `request-id`.
- Los SDKs de Google y Facebook se cargan **solo en la página de login**. Las páginas de login y
  cuenta existen siempre; sin `PUBLIC_API_URL` explican que las cuentas todavía no están
  disponibles.

## Consecuencias

- El plan gratis de Render duerme la API cuando no se usa: el primer pedido tarda hasta un minuto.
  El login avisa "el servidor se está despertando" y los reintentos cubren la espera.
- Configuración: [docs/ACCOUNTS.md](../ACCOUNTS.md) y la guía de despliegue del repo de la API.
