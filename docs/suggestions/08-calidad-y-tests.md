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
